import 'dart:convert';

import 'package:barberia/blocs/blocs.dart';
import 'package:barberia/fcm/fcm_background_handler.dart';

import 'package:barberia/screens/supergods/Onboarding.dart';
import 'package:barberia/screens/supergods/api_client.dart';
import 'package:barberia/screens/supergods/home_barber_screen.dart';
import 'package:barberia/screens/supergods/home_cashier_screen.dart';
import 'package:barberia/screens/supergods/home_client_screen.dart';
import 'package:barberia/screens/supergods/home_owner_screen.dart';
import 'package:barberia/screens/supergods/home_unknown_screen.dart';
import 'package:barberia/screens/supergods/login_client_phone_screen.dart';
import 'package:barberia/screens/supergods/notifications_screen.dart';
import 'package:barberia/screens/supergods/role_select_screen.dart';
import 'package:barberia/screens/supergods/select_tenant_client_screen.dart';
import 'package:barberia/services/fcm_token_sync_service.dart';
import 'package:barberia/services/session_service.dart';
import 'package:barberia/utils/role_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

FlutterLocalNotificationsPlugin? flutterLocalNotificationsPlugin;
AndroidNotificationChannel? channel;

bool show = true;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  show = prefs.getBool('ON_BOARDING') ?? true;

  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

  flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  channel = const AndroidNotificationChannel(
    'pushnotificationapp',
    'pushnotificationapp',
    importance: Importance.max,
  );

  await flutterLocalNotificationsPlugin
      ?.resolvePlatformSpecificImplementation<
      AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel!);

  await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );

  final settings = await FirebaseMessaging.instance.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
  final fcmToken = await FirebaseMessaging.instance.getToken();

  debugPrint('iOS permission => ${settings.authorizationStatus}');
  debugPrint('APNS TOKEN => $apnsToken');
  debugPrint('FCM TOKEN => $fcmToken');

  await FcmTokenSyncService().syncCurrentToken();

  FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
    final notification = message.notification;

    if (notification == null ||
        flutterLocalNotificationsPlugin == null ||
        channel == null) {
      return;
    }

    await flutterLocalNotificationsPlugin!.show(
      id: notification.hashCode,
      title: notification.title,
      body: notification.body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          channel!.id,
          channel!.name,
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: message.data['notificationId'],
    );
  });

  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    final notificationId = message.data['notificationId'];
    debugPrint('PUSH OPENED APP => notificationId=$notificationId');
    ApiClient.navigatorKey.currentState?.pushNamed('/notifications');
  });

  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ApiClient.navigatorKey.currentState?.pushNamed('/notifications');
    });
  }

  ApiClient.init();

  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => GpsBloc()),
      ],
      child: const ProviderScope(
        child: MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  static const String title = 'Main Page';

  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      locale: const Locale('es', 'PE'),
      supportedLocales: const [
        Locale('es', 'PE'),
        Locale('es'),
        Locale('en'),
      ],
      navigatorKey: ApiClient.navigatorKey,
      debugShowCheckedModeBanner: false,
      title: title,
      theme: ThemeData.dark().copyWith(
        hintColor: Colors.amber,
      ),
      home: const AppStartRouter(),
      routes: {
        '/home-super-admin': (_) => const UnknownRoleScreen(),
        '/login-client-otp': (context) => const LoginClientOtpScreen(),
        '/home-client': (context) => const HomeClientScreen(),
        '/home-owner': (context) => const HomeOwnerScreen(),
        '/home-barber': (context) => const BarberHomeScreen(),
        '/home-cashier': (context) => const CashierHomeScreen(),
        '/home-unknown': (context) => const UnknownRoleScreen(),
        '/select-tenant-client': (_) => const SelectTenantClientScreen(),
        '/notifications': (_) => const NotificationsScreen(),
      },
    );
  }
}


class AppStartRouter extends StatefulWidget {
  const AppStartRouter({super.key});

  @override
  State<AppStartRouter> createState() => _AppStartRouterState();
}

class _AppStartRouterState extends State<AppStartRouter> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _route();
    });
  }

  Future<void> _route() async {
    if (!mounted) return;

    final prefs = await SharedPreferences.getInstance();
    final showOnboarding = prefs.getBool('ON_BOARDING') ?? true;

    if (showOnboarding) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const OnboardingScreens(),
        ),
      );
      return;
    }

    final token = await SessionService.getToken();
    final role = await SessionService.getRole();

    final hasSession =
        token != null &&
            token.isNotEmpty &&
            role != null &&
            role.isNotEmpty;

    if (hasSession) {
      final expired = _isJwtExpired(token);

      if (expired) {
        await SessionService.clearSession();
        if (!mounted) return;

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => const RoleSelectScreen(),
          ),
        );
        return;
      }

      if (!mounted) return;
      goHomeByRole(context, role);
      return;
    }

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => const RoleSelectScreen(),
      ),
    );
  }

  bool _isJwtExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;

      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final payloadMap = json.decode(
        utf8.decode(base64Url.decode(normalized)),
      );

      if (payloadMap is! Map<String, dynamic>) return true;

      final exp = payloadMap['exp'];
      if (exp == null) return true;

      final expDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
      return DateTime.now().isAfter(expDate);
    } catch (_) {
      return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}