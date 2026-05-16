import 'dart:async';

import 'package:barberia/screens/supergods/signin_screen.dart';
import 'package:barberia/screens/supergods/reward_redemption_validate_screen.dart';
import 'package:barberia/services/session_service.dart';
import 'package:barberia/constants/admin_permission_keys.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/admin_permissions_service.dart';
import '../../services/fcm_token_sync_service.dart';
import '../../services/subscription_service.dart' as subsvc;
import 'ai/owner_ai_advisor_screen.dart';
import 'notification_bell_button.dart';
import 'owner_agenda_screen.dart';

import 'owner_barbers_screen.dart';
import 'owner_cash_screen.dart';
import 'owner_cash_sale_create_screen.dart';
import 'owner_config_screen.dart';
import 'owner_customers_screen.dart';
import 'owner_reports_screen.dart';

double _asDouble(dynamic value, {double fallback = 0.0}) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  if (value is String) {
    final cleaned = value.replaceAll(',', '').trim();
    return double.tryParse(cleaned) ?? fallback;
  }
  return fallback;
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim()) ?? fallback;
  return fallback;
}

bool _asBool(dynamic value, {bool fallback = false}) {
  if (value == null) return fallback;
  if (value is bool) return value;
  if (value is String) {
    final v = value.trim().toLowerCase();
    if (v == 'true') return true;
    if (v == 'false') return false;
  }
  return fallback;
}

class BranchDashboardItemModel {
  final int branchId;
  final String branchName;
  final double todaySales;
  final int todayAppointments;
  final int activeBarbers;
  final double averageTicket;

  BranchDashboardItemModel({
    required this.branchId,
    required this.branchName,
    required this.todaySales,
    required this.todayAppointments,
    required this.activeBarbers,
    required this.averageTicket,
  });

  factory BranchDashboardItemModel.fromJson(Map<String, dynamic> json) {
    return BranchDashboardItemModel(
      branchId: _asInt(json['branchId']),
      branchName: (json['branchName'] ?? '').toString(),
      todaySales: _asDouble(json['todaySales']),
      todayAppointments: _asInt(json['todayAppointments']),
      activeBarbers: _asInt(json['activeBarbers']),
      averageTicket: _asDouble(json['averageTicket']),
    );
  }
}

class _Cita {
  final int id;
  final int? customerId;
  final int? serviceId;
  final int? barberId;
  final int? branchId;

  final String hora;
  final String cliente;
  final String servicio;
  final String barberName;

  const _Cita({
    required this.id,
    required this.hora,
    required this.cliente,
    required this.servicio,
    this.customerId,
    this.serviceId,
    this.barberId,
    this.branchId,
    this.barberName = '',
  });

  factory _Cita.fromJson(Map<String, dynamic> json) {
    return _Cita(
      id: _asInt(json['appointmentId']),
      hora: (json['time'] ?? '').toString(),
      cliente: (json['customerName'] ?? 'Cliente').toString(),
      servicio: (json['serviceName'] ?? 'Servicio').toString(),
      customerId: json['customerId'] == null ? null : _asInt(json['customerId']),
      serviceId: json['serviceId'] == null ? null : _asInt(json['serviceId']),
      barberId: json['barberId'] == null ? null : _asInt(json['barberId']),
      branchId: json['branchId'] == null ? null : _asInt(json['branchId']),
      barberName: (json['barberName'] ?? '').toString(),
    );
  }
}

class _OwnerDashboardData {
  final double todaySales;
  final int todayAppointments;
  final int activeBarbers;
  final int newClients;
  final double averageTicket;
  final double todayExpenses;
  final List<_Cita> upcomingAppointments;
  final List<BranchDashboardItemModel> branches;

  const _OwnerDashboardData({
    required this.todaySales,
    required this.todayAppointments,
    required this.activeBarbers,
    required this.newClients,
    required this.averageTicket,
    required this.todayExpenses,
    required this.upcomingAppointments,
    required this.branches,
  });

  factory _OwnerDashboardData.empty() {
    return const _OwnerDashboardData(
      todaySales: 0,
      todayAppointments: 0,
      activeBarbers: 0,
      newClients: 0,
      averageTicket: 0,
      todayExpenses: 0,
      upcomingAppointments: [],
      branches: [],
    );
  }

  factory _OwnerDashboardData.fromJson(Map<String, dynamic> json) {
    final items = (json['upcomingAppointments'] as List<dynamic>? ?? [])
        .map((e) => _Cita.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    final branches = (json['branches'] as List<dynamic>? ?? [])
        .map(
          (e) => BranchDashboardItemModel.fromJson(
        Map<String, dynamic>.from(e as Map),
      ),
    )
        .toList();

    return _OwnerDashboardData(
      todaySales: _asDouble(json['todaySales']),
      todayAppointments: _asInt(json['todayAppointments']),
      activeBarbers: _asInt(json['activeBarbers']),
      newClients: _asInt(json['newClients']),
      averageTicket: _asDouble(json['averageTicket']),
      todayExpenses: _asDouble(json['todayExpenses']),
      upcomingAppointments: items,
      branches: branches,
    );
  }
}

class _OwnerTabConfig {
  final Widget page;
  final BottomNavigationBarItem item;
  final String? permissionKey;

  const _OwnerTabConfig({
    required this.page,
    required this.item,
    this.permissionKey,
  });
}

class HomeOwnerScreen extends StatefulWidget {
  final int initialTab;

  const HomeOwnerScreen({
    super.key,
    this.initialTab = 0,
  });

  @override
  State<HomeOwnerScreen> createState() => _HomeOwnerScreenState();
}

class _HomeOwnerScreenState extends State<HomeOwnerScreen> with WidgetsBindingObserver {
  static const String baseUrl =
      "https://gods-saas-backend-production.up.railway.app";
  /// static const String baseUrl = "http://192.168.100.9:8081";

  late int _tab;
  bool _modoAtencion = false;

  Timer? _liveRefreshTimer;
  bool _refreshingSilently = false;
  DateTime? _lastDashboardUpdatedAt;

  static const Duration _liveRefreshEvery = Duration(seconds: 25);

  subsvc.SubscriptionInfo? _subscription;
  bool _loadingSubscription = true;
  String? _subscriptionError;

  bool _loadingDashboard = true;
  String? _dashboardError;
  _OwnerDashboardData _dashboard = _OwnerDashboardData.empty();

  bool _loadingSession = true;
  String tenantName = "Mi barbería";
  String userName = "Usuario";
  String _sessionRole = "OWNER";
  int? _sessionBranchId;
  String? _sessionBranchName;

  Set<String> _adminPermissions = {};
  bool _loadingPermissions = true;

  bool get _isAdminSession => _sessionRole.trim().toUpperCase() == 'ADMIN';
  bool get _isOwnerSession => _sessionRole.trim().toUpperCase() == 'OWNER';

  bool _hasPermission(String permissionKey) {
    if (_isOwnerSession) return true;
    if (!_isAdminSession) return false;

    return _adminPermissions.contains(permissionKey.trim().toUpperCase());
  }

  bool _hasAnyPermission(List<String> permissionKeys) {
    if (_isOwnerSession) return true;
    if (!_isAdminSession) return false;

    return permissionKeys.any(
          (p) => _adminPermissions.contains(p.trim().toUpperCase()),
    );
  }

  bool get _canUseReports {
    return _canUseCoreModules;
  }

  bool get _canUseAdvancedReports {
    final plan = (_subscription?.plan ?? '').trim().toUpperCase();
    return plan.isNotEmpty && plan != String.fromCharCodes([83, 84, 65, 82, 84, 69, 82]) && _canUseCoreModules;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tab = widget.initialTab;
    _loadInitialData();
    _startLiveRefresh();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FcmTokenSyncService().syncCurrentToken();
    });
  }

  @override
  void dispose() {
    _stopLiveRefresh();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startLiveRefresh();
      _refreshDashboardSilently();
      return;
    }

    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      _stopLiveRefresh();
    }
  }

  Future<void> _loadInitialData() async {
    await _loadSessionData();
    await _syncAdminPermissions();

    await Future.wait([
      _loadSubscription(),
      _loadDashboard(),
    ]);
  }

  void _startLiveRefresh() {
    _liveRefreshTimer?.cancel();

    if (!mounted || _tab != 0) return;

    _liveRefreshTimer = Timer.periodic(_liveRefreshEvery, (_) {
      _refreshDashboardSilently();
    });
  }

  void _stopLiveRefresh() {
    _liveRefreshTimer?.cancel();
    _liveRefreshTimer = null;
  }

  void _syncLiveRefreshWithTab() {
    if (_tab == 0) {
      _startLiveRefresh();
    } else {
      _stopLiveRefresh();
    }
  }

  void _changeTab(int index) {
    setState(() => _tab = index);
    _syncLiveRefreshWithTab();

    if (index == 0) {
      _refreshDashboardSilently();
    }
  }

  Future<void> _refreshDashboardSilently() async {
    if (!mounted || _tab != 0 || _refreshingSilently || _loadingDashboard) return;

    setState(() => _refreshingSilently = true);

    try {
      await _loadDashboard(silent: true);
    } finally {
      if (mounted) {
        setState(() => _refreshingSilently = false);
      }
    }
  }

  Future<void> _loadSessionData() async {
    try {
      final sessionTenantName = await SessionService.getTenantName();
      final sessionUserName = await SessionService.getUserName();
      final sessionBranchId = await SessionService.getBranchId();
      final sessionBranchName = await SessionService.getBranchName();
      final sessionRole = await SessionService.getRole();

      if (!mounted) return;

      setState(() {
        tenantName = (sessionTenantName != null && sessionTenantName.trim().isNotEmpty)
            ? sessionTenantName.trim()
            : "Mi barbería";
        userName = (sessionUserName != null && sessionUserName.trim().isNotEmpty)
            ? sessionUserName.trim()
            : "Usuario";
        _sessionRole = (sessionRole != null && sessionRole.trim().isNotEmpty)
            ? sessionRole.trim().toUpperCase()
            : "OWNER";
        _sessionBranchId = sessionBranchId;
        _sessionBranchName = (sessionBranchName != null && sessionBranchName.trim().isNotEmpty)
            ? sessionBranchName.trim()
            : null;
        _loadingSession = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingSession = false;
      });
    }
  }

  Future<void> _syncAdminPermissions() async {
    final role = (await SessionService.getRole() ?? '').trim().toUpperCase();

    if (role == 'OWNER') {
      await SessionService.saveIsOwner(true);
      await SessionService.saveAdminPermissions([]);

      if (!mounted) return;
      setState(() {
        _adminPermissions = {};
        _loadingPermissions = false;
      });
      return;
    }

    if (role != 'ADMIN') {
      await SessionService.saveIsOwner(false);
      await SessionService.saveAdminPermissions([]);

      if (!mounted) return;
      setState(() {
        _adminPermissions = {};
        _loadingPermissions = false;
      });
      return;
    }

    try {
      final permissions = await AdminPermissionsService().getMyPermissions();

      await SessionService.saveIsOwner(permissions.owner);
      await SessionService.saveAdminPermissions(permissions.permissions);

      if (!mounted) return;
      setState(() {
        _adminPermissions = permissions.permissions
            .map((e) => e.trim().toUpperCase())
            .where((e) => e.isNotEmpty)
            .toSet();
        _loadingPermissions = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _adminPermissions = {};
        _loadingPermissions = false;
      });
    }
  }

  Future<void> _refreshHome() async {
    await _loadSessionData();
    await _syncAdminPermissions();

    await Future.wait([
      _loadSubscription(),
      _loadDashboard(),
    ]);
  }

  void _showBusinessAccountInfo() {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text("Cuenta del negocio"),
        content: const Text(
          "El acceso de esta cuenta es gestionado por el administrador del negocio. "
          "Si necesitas cambios, comunícate con el administrador de tu barbería.",
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF0F172A),
              foregroundColor: Colors.white,
            ),
            child: const Text("Entendido"),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSessionExpired() async {
    await SessionService.clearSession();

    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const SignInScreen()),
          (route) => false,
    );
  }

  Future<void> _logout() async {
    final confirm = await _showLogoutDialog();
    if (confirm != true) return;

    await SessionService.clearSession();

    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const SignInScreen()),
          (route) => false,
    );
  }

  Future<bool?> _showLogoutDialog() {
    return showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text("Cerrar sesión"),
        content: const Text("¿Deseas cerrar tu sesión ahora?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("Cancelar"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
            ),
            child: const Text("Cerrar sesión"),
          ),
        ],
      ),
    );
  }

  Future<bool> _confirmExitApp() async {
    final shouldExit = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text("Salir de la app"),
        content: const Text("¿De verdad deseas salir?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("Cancelar"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
            ),
            child: const Text("Salir"),
          ),
        ],
      ),
    );

    return shouldExit ?? false;
  }

  Future<Dio> _buildDio() async {
    final token = await SessionService.getToken();

    if (token == null || token.isEmpty) {
      throw Exception("Sesión expirada. Vuelve a iniciar sesión.");
    }

    return Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 20),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      ),
    );
  }

  Future<void> _loadSubscription() async {
    if (mounted) {
      setState(() {
        _loadingSubscription = true;
        _subscriptionError = null;
      });
    }

    try {
      final sub = await subsvc.SubscriptionService().getCurrentSubscription();

      if (!mounted) return;
      setState(() {
        _subscription = sub;
        _loadingSubscription = false;
      });
    } on DioException catch (e) {
      debugPrint("OWNER SUB ERROR STATUS => ${e.response?.statusCode}");
      debugPrint("OWNER SUB ERROR DATA   => ${e.response?.data}");

      final statusCode = e.response?.statusCode;
      final responseData = e.response?.data;

      String backendCode = '';
      String backendMessage = '';

      if (responseData is Map) {
        final map = Map<String, dynamic>.from(responseData);
        backendCode = (map['code'] ?? '').toString();
        backendMessage = (map['message'] ?? '').toString();
      } else {
        backendMessage = responseData?.toString() ?? '';
      }

      final isTokenExpired =
          statusCode == 401 || backendCode.toUpperCase() == 'TOKEN_EXPIRED';

      if (isTokenExpired) {
        _toast("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        await _handleSessionExpired();
        return;
      }

      if (!mounted) return;
      setState(() {
        _subscriptionError = backendMessage.isNotEmpty
            ? backendMessage
            : (e.message ?? "No se pudo cargar la cuenta");
        _loadingSubscription = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _subscriptionError = e.toString();
        _loadingSubscription = false;
      });
    }
  }

  Future<void> _loadDashboard({bool silent = false}) async {
    if (mounted && !silent) {
      setState(() {
        _loadingDashboard = true;
        _dashboardError = null;
      });
    }

    try {
      final dio = await _buildDio();

      final response = await dio.get('/api/owner/home/dashboard');
      debugPrint("OWNER DASH DATA => ${response.data}");
      final data = Map<String, dynamic>.from(response.data as Map);

      if (!mounted) return;
      setState(() {
        _dashboard = _OwnerDashboardData.fromJson(data);
        _dashboardError = null;
        _lastDashboardUpdatedAt = DateTime.now();
        _loadingDashboard = false;
      });
    } on DioException catch (e) {
      debugPrint("OWNER DASH ERROR STATUS => ${e.response?.statusCode}");
      debugPrint("OWNER DASH ERROR DATA   => ${e.response?.data}");

      final statusCode = e.response?.statusCode;
      final responseData = e.response?.data;

      String backendCode = '';
      String backendMessage = '';

      if (responseData is Map) {
        final map = Map<String, dynamic>.from(responseData);
        backendCode = (map['code'] ?? '').toString();
        backendMessage = (map['message'] ?? '').toString();
      } else {
        backendMessage = responseData?.toString() ?? '';
      }

      final isTokenExpired =
          statusCode == 401 || backendCode.toUpperCase() == 'TOKEN_EXPIRED';

      if (isTokenExpired) {
        _toast("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        await _handleSessionExpired();
        return;
      }

      if (!mounted) return;
      setState(() {
        if (!silent) {
          _dashboardError = backendMessage.isNotEmpty
              ? backendMessage
              : (e.message ?? "No se pudo cargar el dashboard");
        }
        _loadingDashboard = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent) {
          _dashboardError = e.toString();
        }
        _loadingDashboard = false;
      });
    }
  }

  bool get _isExpired => _subscription?.isExpired == true;

  bool get _isPendingReview {
    final estado = (_subscription?.estado ?? '').trim().toUpperCase();
    return estado == 'PENDING_REVIEW';
  }

  bool get _allowOperateWhilePending {
    if (_subscription == null) return false;
    return _isPendingReview && !_isExpired;
  }

  bool get _canUseCoreModules {
    if (_subscription == null) return false;
    return _subscription!.canUseCoreModules || _allowOperateWhilePending;
  }

  bool get _canUseAi => _subscription != null && _subscription!.canUseAi;

  bool get _canUseLoyalty =>
      _subscription != null && _subscription!.canUseLoyalty;

  double get _ventasHoy => _dashboard.todaySales;
  int get _citasHoy => _dashboard.todayAppointments;
  int get _barberosActivos => _dashboard.activeBarbers;
  int get _clientesNuevos => _dashboard.newClients;
  double get _ticketPromedio => _dashboard.averageTicket;
  double get _gastosHoy => _dashboard.todayExpenses;
  List<_Cita> get _proximasCitas => _dashboard.upcomingAppointments;

  String get _lastUpdatedLabel {
    final updated = _lastDashboardUpdatedAt;
    if (updated == null) return "Actualizando...";

    final diff = DateTime.now().difference(updated);
    if (diff.inSeconds < 10) return "Actualizado ahora";
    if (diff.inMinutes < 1) return "Actualizado hace ${diff.inSeconds}s";
    if (diff.inMinutes < 60) return "Actualizado hace ${diff.inMinutes} min";
    return "Actualizado ${updated.hour.toString().padLeft(2, '0')}:${updated.minute.toString().padLeft(2, '0')}";
  }

  List<BranchDashboardItemModel> get _branchesSorted {
    final list = List<BranchDashboardItemModel>.from(_dashboard.branches);
    list.sort((a, b) => b.todaySales.compareTo(a.todaySales));
    return list;
  }

  List<BranchDashboardItemModel> get _topBranchesForDayDetail {
    final items = List<BranchDashboardItemModel>.from(_dashboard.branches);
    items.sort((a, b) => a.branchId.compareTo(b.branchId));
    if (items.length <= 2) return items;
    return items.take(2).toList();
  }

  void _showBlockedDialog({
    required String title,
    required String message,
    String primaryText = "Entendido",
  }) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(primaryText),
          ),
        ],
      ),
    );
  }

  int _tabIndexForPermission(String permissionKey, int ownerIndex) {
    if (!_isAdminSession) return ownerIndex;

    final adminTabs = _buildAdminTabs();
    final index = adminTabs.indexWhere((t) => t.permissionKey == permissionKey);

    return index >= 0 ? index : 0;
  }

  void _onTapTab(int i) {
    if (_loadingSubscription) {
      _toast("Espera un momento, validando tu cuenta...");
      return;
    }

    final isAdmin = _isAdminSession;

    if (i == 0) {
      _changeTab(i);
      return;
    }

    if (_subscription == null) {
      _toast("No se pudo validar el estado de la cuenta.");
      return;
    }

    if (_isExpired) {
      _showBlockedDialog(
        title: "Cuenta no disponible",
        message: "Esta cuenta no está disponible en este momento. Contacta al administrador del negocio.",
        primaryText: "Entendido",
      );
      return;
    }

    if (isAdmin) {
      if (_loadingPermissions) {
        _toast("Validando permisos del administrador.");
        return;
      }

      final adminTabs = _buildAdminTabs();

      if (i < 0 || i >= adminTabs.length) {
        _changeTab(0);
        return;
      }

      final permissionKey = adminTabs[i].permissionKey;

      if (permissionKey != null && !_hasPermission(permissionKey)) {
        _showBlockedDialog(
          title: "Sin permiso",
          message: "El dueño no te ha dado acceso a este módulo.",
          primaryText: "Entendido",
        );
        return;
      }

      final isAgenda = permissionKey == AdminPermissionKeys.agendaAccess;
      final isCash = permissionKey == AdminPermissionKeys.cashAccess;
      final isReports = permissionKey == AdminPermissionKeys.reportsAccess;

      if ((isAgenda || isCash) && !_canUseCoreModules) {
        _showBlockedDialog(
          title: "Módulo bloqueado",
          message: "Esta cuenta no tiene disponible este módulo.",
          primaryText: "Entendido",
        );
        return;
      }

      if (isReports && !_canUseReports) {
        _showBlockedDialog(
          title: "Reportes bloqueados",
          message: "Esta cuenta no tiene disponible el acceso a reportes.",
          primaryText: "Entendido",
        );
        return;
      }

      _changeTab(i);
      return;
    }

    // Menú OWNER: Inicio(0), Agenda(1), Barberos(2), Caja(3), Reportes(4), Config(5).
    if (i == 5) {
      _changeTab(i);
      return;
    }

    if ((i == 1 || i == 2 || i == 3) && !_canUseCoreModules) {
      _showBlockedDialog(
        title: "Módulo bloqueado",
        message: "Esta función no está disponible para esta cuenta.",
      );
      return;
    }

    if (i == 4 && !_canUseReports) {
      _showBlockedDialog(
        title: "Reportes bloqueados",
        message: "Los reportes no están disponibles para esta cuenta.",
        primaryText: "Entendido",
      );
      return;
    }

    _changeTab(i);
  }

  void _goToValidateRedemption() {
    if (!_canUseLoyalty) {
      _showBlockedDialog(
        title: "Canjes no disponibles",
        message:
        "La función de puntos y canjes no está disponible para esta cuenta.",
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const RewardRedemptionValidateScreen(),
      ),
    );
  }

  Future<void> _goToAiAdvisor() async {
    if (!_canUseAi) {
      _showBlockedDialog(
        title: "Asesor IA no disponible",
        message: _subscription?.isExpired == true
            ? "Esta cuenta no está disponible en este momento para usar el Asesor IA."
            : "El Asesor IA no está disponible para esta cuenta.",
      );
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const OwnerAiAdvisorScreen(),
      ),
    );
  }

  Future<void> _goToAttendAppointment(_Cita c) async {
    if (_isAdminSession &&
        !_hasPermission(AdminPermissionKeys.cashAccess)) {
      _showBlockedDialog(
        title: "Sin permiso",
        message: "El dueño no te ha dado acceso a caja para atender/cobrar.",
        primaryText: "Entendido",
      );
      return;
    }

    if (c.branchId == null) {
      _toast("La cita no tiene sede asociada.");
      return;
    }

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => OwnerCashSaleCreateScreen(
          branchId: c.branchId!,
          appointmentId: c.id,
          preselectedCustomerId: c.customerId,
          preselectedCustomerName: c.cliente,
          suggestedServiceId: c.serviceId,
          suggestedBarberUserId: c.barberId,
        ),
      ),
    );

    if (!mounted) return;

    if (result == true) {
      _toast("Cliente atendido correctamente");
      await _loadDashboard();
    }
  }

  String _planUsageText() {
    final s = _subscription;
    if (s == null) return "";
    return "Barberos ${s.usedBarbers}/${s.maxBarbers} · "
        "Sedes ${s.usedBranches}/${s.maxBranches} · "
        "Admins ${s.usedAdmins}/${s.maxAdmins}";
  }

  bool get _hasAnyLimitReached {
    final s = _subscription;
    if (s == null) return false;
    return !s.canAddBarber || !s.canAddBranch || !s.canAddAdmin;
  }

  String _limitsReachedMessage() {
    final s = _subscription;
    if (s == null) return "";

    final parts = <String>[];
    if (!s.canAddBarber) parts.add("límite de barberos");
    if (!s.canAddBranch) parts.add("límite de sedes");
    if (!s.canAddAdmin) parts.add("límite de administradores");

    if (parts.isEmpty) return "";
    return "Has alcanzado ${parts.join(', ')}.";
  }

  List<_OwnerTabConfig> _buildAdminTabs() {
    final tabs = <_OwnerTabConfig>[
      _OwnerTabConfig(
        page: _homeContent(),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.home_rounded),
          activeIcon: Icon(Icons.home_rounded, size: 25),
          label: "Inicio",
        ),
      ),
    ];

    if (_hasPermission(AdminPermissionKeys.agendaAccess)) {
      tabs.add(
        const _OwnerTabConfig(
          page: OwnerAgendaScreen(),
          permissionKey: AdminPermissionKeys.agendaAccess,
          item: BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month_rounded),
            activeIcon: Icon(Icons.calendar_month_rounded, size: 25),
            label: "Agenda",
          ),
        ),
      );
    }

    if (_hasPermission(AdminPermissionKeys.cashAccess)) {
      tabs.add(
        const _OwnerTabConfig(
          page: OwnerCashScreen(),
          permissionKey: AdminPermissionKeys.cashAccess,
          item: BottomNavigationBarItem(
            icon: Icon(Icons.point_of_sale_rounded),
            activeIcon: Icon(Icons.point_of_sale_rounded, size: 25),
            label: "Caja",
          ),
        ),
      );
    }

    if (_hasPermission(AdminPermissionKeys.reportsAccess)) {
      tabs.add(
        const _OwnerTabConfig(
          page: OwnerReportsScreen(),
          permissionKey: AdminPermissionKeys.reportsAccess,
          item: BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart_rounded),
            activeIcon: Icon(Icons.bar_chart_rounded, size: 25),
            label: "Reportes",
          ),
        ),
      );
    }

    if (_hasPermission(AdminPermissionKeys.configAccess)) {
      tabs.add(
        _OwnerTabConfig(
          page: OwnerConfigScreen(
            promotionsEnabled: _subscription?.promotionsEnabled ?? false,
          ),
          permissionKey: AdminPermissionKeys.configAccess,
          item: const BottomNavigationBarItem(
            icon: Icon(Icons.settings_rounded),
            activeIcon: Icon(Icons.settings_rounded, size: 25),
            label: "Config",
          ),
        ),
      );
    }

    return tabs;
  }

  List<_OwnerTabConfig> _buildOwnerTabs() {
    return [
      _OwnerTabConfig(
        page: _homeContent(),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.home_rounded),
          activeIcon: Icon(Icons.home_rounded, size: 25),
          label: "Inicio",
        ),
      ),
      const _OwnerTabConfig(
        page: OwnerAgendaScreen(),
        item: BottomNavigationBarItem(
          icon: Icon(Icons.calendar_month_rounded),
          activeIcon: Icon(Icons.calendar_month_rounded, size: 25),
          label: "Agenda",
        ),
      ),
      const _OwnerTabConfig(
        page: OwnerBarbersScreen(),
        item: BottomNavigationBarItem(
          icon: Icon(Icons.content_cut_rounded),
          activeIcon: Icon(Icons.content_cut_rounded, size: 25),
          label: "Barberos",
        ),
      ),
      const _OwnerTabConfig(
        page: OwnerCashScreen(),
        item: BottomNavigationBarItem(
          icon: Icon(Icons.point_of_sale_rounded),
          activeIcon: Icon(Icons.point_of_sale_rounded, size: 25),
          label: "Caja",
        ),
      ),
      const _OwnerTabConfig(
        page: OwnerReportsScreen(),
        item: BottomNavigationBarItem(
          icon: Icon(Icons.bar_chart_rounded),
          activeIcon: Icon(Icons.bar_chart_rounded, size: 25),
          label: "Reportes",
        ),
      ),
      _OwnerTabConfig(
        page: OwnerConfigScreen(
          promotionsEnabled: _subscription?.promotionsEnabled ?? false,
        ),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.settings_rounded),
          activeIcon: Icon(Icons.settings_rounded, size: 25),
          label: "Config",
        ),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = _isAdminSession;

    final tabConfigs = isAdmin ? _buildAdminTabs() : _buildOwnerTabs();

    final pages = tabConfigs.map((e) => e.page).toList();
    final navItems = tabConfigs.map((e) => e.item).toList();

    if (_tab >= pages.length) {
      _tab = 0;
    }

    final showBottomNav = navItems.length >= 2;

    if (_tab >= pages.length) {
      _tab = 0;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        final shouldExit = await _confirmExitApp();
        if (!mounted) return;

        if (shouldExit) {
          await SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F7FB),
        appBar: AppBar(
          toolbarHeight: 72,
          elevation: 0,
          backgroundColor: const Color(0xFFF4F7FB),
          surfaceTintColor: const Color(0xFFF4F7FB),
          titleSpacing: 14,
          title: _HeaderTitle(
            userName: userName,
            tenantName: tenantName,
          ),
          actions: [
            NotificationBellButton(
              iconColor: const Color(0xFF111827),
              onAfterReturn: _refreshHome,
            ),
            IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout_rounded),
            ),
            const SizedBox(width: 6),
          ],
        ),
        body: SafeArea(
          top: false,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: pages[_tab],
          ),
        ),
        bottomNavigationBar: showBottomNav
            ? Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Color(0x14000000),
                blurRadius: 20,
                offset: Offset(0, -6),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _tab,
            onTap: _onTapTab,
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            elevation: 0,
            selectedItemColor: const Color(0xFF0F172A),
            unselectedItemColor: const Color(0xFF7A869A),
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 12,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
            items: navItems,
          ),
        )
            : null,
      ),
    );
  }

  Widget _homeContent() {
    final subscription = _subscription;
    final loadingHome =
        _loadingSession || _loadingSubscription || _loadingDashboard;

    return RefreshIndicator(
      onRefresh: _refreshHome,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
        children: [
          if (loadingHome)
            const Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: LinearProgressIndicator(minHeight: 3),
            ),
          if (_subscriptionError != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SubscriptionMiniError(
                message: _subscriptionError!,
                onRetry: _refreshHome,
              ),
            ),
          if (_dashboardError != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SubscriptionMiniError(
                message: _dashboardError!,
                onRetry: _refreshHome,
              ),
            ),
          _LiveRefreshStrip(
            label: _lastUpdatedLabel,
            refreshing: _refreshingSilently,
            onRefresh: _refreshHome,
          ),
          const SizedBox(height: 10),
          if (subscription != null) ...[
            _SubscriptionBanner(
              subscription: subscription,
              usageText: _planUsageText(),
              onOpenConfig: _showBusinessAccountInfo,
            ),
            const SizedBox(height: 10),
            if (_hasAnyLimitReached)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _LimitAlertCard(
                  title: "Atención",
                  subtitle: "${_limitsReachedMessage()} Contacta al administrador.",
                  onTap: _showBusinessAccountInfo,
                ),
              ),
          ],
          _OwnerModeToggle(
            value: _modoAtencion,
            onChanged: (v) => setState(() => _modoAtencion = v),
          ),
          const SizedBox(height: 10),
          _SummaryCardPremium(
            ventasHoy: _ventasHoy,
            citasHoy: _citasHoy,
            barberosActivos: _barberosActivos,
            planLabel: "Cuenta",
            estadoLabel: subscription?.estadoLabel ?? "No validado",
            branches: _topBranchesForDayDetail,
            lastUpdatedLabel: _lastUpdatedLabel,
            refreshing: _refreshingSilently,
            onRefresh: _refreshHome,
            onResumenTap: () => _onTapTab(
              _tabIndexForPermission(AdminPermissionKeys.reportsAccess, 4),
            ),
          ),
          const SizedBox(height: 10),
          _QuickActionsGrid(
            agendaEnabled: _canUseCoreModules &&
                (!_isAdminSession || _hasPermission(AdminPermissionKeys.agendaAccess)),
            cobrarEnabled: _canUseCoreModules &&
                (!_isAdminSession || _hasPermission(AdminPermissionKeys.cashAccess)),
            loyaltyEnabled: _canUseLoyalty,
            aiEnabled: _canUseAi,
            onAgenda: () => _onTapTab(
              _tabIndexForPermission(AdminPermissionKeys.agendaAccess, 1),
            ),
            onCobrar: () => _onTapTab(
              _tabIndexForPermission(AdminPermissionKeys.cashAccess, 3),
            ),
            onAsesorIA: _goToAiAdvisor,
            onValidarCanje: _goToValidateRedemption,
            onClientes: _goToCustomers,
          ),
          if (_modoAtencion) ...[
            const SizedBox(height: 10),
            _OwnerSecondaryCTA(
              title: "Modo atención activo",
              subtitle: _canUseCoreModules
                  ? "Atiende clientes o registra una venta rápida desde aquí"
                  : "Cuenta no disponible para registrar nuevas atenciones",
              onTap: () {
                if (!_canUseCoreModules) {
                  _showBlockedDialog(
                    title: "Operación bloqueada",
                    message:
                    "Esta cuenta no permite registrar nuevas operaciones.",
                  );
                  return;
                }
                _goToQuickAttention();
              },
            ),
          ],
          const SizedBox(height: 10),
          _OwnerSecondaryCTA(
            title: "Clientes",
            subtitle: "Busca, registra y edita tu base de clientes",
            onTap: _goToCustomers,
          ),
          const SizedBox(height: 10),
          _OwnerSecondaryCTA(
            title: "Ver reportes de ventas",
            subtitle: _canUseAdvancedReports
                ? "Ventas por barbero, ticket promedio y detalle por fechas"
                : "Reportes básicos disponibles para esta cuenta",
            onTap: () => _onTapTab(
              _tabIndexForPermission(AdminPermissionKeys.reportsAccess, 4),
            ),
          ),
          const SizedBox(height: 14),
          _SectionTitle(
            title: "Próximos clientes",
            trailing: TextButton(
              onPressed: () => _onTapTab(
                _tabIndexForPermission(AdminPermissionKeys.agendaAccess, 1),
              ),
              child: const Text("Ver agenda"),
            ),
          ),
          const SizedBox(height: 8),
          if (_proximasCitas.isEmpty)
            const _EmptyStateCard(
              message: "No hay próximas citas para hoy.",
            )
          else
            ..._proximasCitas.take(3).map(
                  (c) => _CitaTileCompact(
                cita: c,
                enabled: _canUseCoreModules &&
                    (!_isAdminSession || _hasPermission(AdminPermissionKeys.cashAccess)),
                onAtender: () {
                  if (!_modoAtencion) {
                    _toast("Activa 'Modo atención' para atender clientes");
                    return;
                  }
                  if (!_canUseCoreModules) {
                    _showBlockedDialog(
                      title: "Atención bloqueada",
                      message:
                      "Esta cuenta no permite registrar atención de clientes.",
                    );
                    return;
                  }
                  _goToAttendAppointment(c);
                },
              ),
            ),
          const SizedBox(height: 14),
          _SectionTitle(
            title: "Indicadores rápidos",
            trailing: IconButton(
              onPressed: () => _onTapTab(
                _tabIndexForPermission(AdminPermissionKeys.reportsAccess, 4),
              ),
              icon: const Icon(Icons.auto_graph_rounded),
            ),
          ),
          const SizedBox(height: 8),
          _StatsRowCompact(
            items: [
              _StatItem(label: "Clientes nuevos", value: '$_clientesNuevos'),
              _StatItem(
                label: "Ticket promedio",
                value: "S/ ${_ticketPromedio.toStringAsFixed(0)}",
              ),
              _StatItem(label: "Reservas", value: '$_citasHoy'),
              _StatItem(
                label: "Gastos",
                value: "S/ ${_gastosHoy.toStringAsFixed(0)}",
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _goToCustomers() async {
    if (_isAdminSession &&
        !_hasPermission(AdminPermissionKeys.customersAccess)) {
      _showBlockedDialog(
        title: "Sin permiso",
        message: "El dueño no te ha dado acceso a clientes.",
        primaryText: "Entendido",
      );
      return;
    }

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const OwnerCustomersScreen(),
      ),
    );
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        duration: const Duration(milliseconds: 900),
      ),
    );
  }

  Future<void> _goToQuickAttention() async {
    if (_isAdminSession &&
        !_hasPermission(AdminPermissionKeys.cashAccess)) {
      _showBlockedDialog(
        title: "Sin permiso",
        message: "El dueño no te ha dado acceso a caja.",
        primaryText: "Entendido",
      );
      return;
    }

    final branches = List<BranchDashboardItemModel>.from(_dashboard.branches)
      ..sort((a, b) => a.branchId.compareTo(b.branchId));

    int? branchIdToUse;

    if (_sessionBranchId != null && _sessionBranchId! > 0) {
      branchIdToUse = _sessionBranchId;
    } else if (branches.isNotEmpty) {
      branchIdToUse = branches.first.branchId;
    }

    if (branchIdToUse == null) {
      _toast("No se pudo determinar la sede actual.");
      return;
    }

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => OwnerCashSaleCreateScreen(
          branchId: branchIdToUse!,
        ),
      ),
    );

    if (!mounted) return;

    if (result == true) {
      _toast("Venta registrada correctamente");
      await _loadDashboard();
    }
  }
}

class _HeaderTitle extends StatelessWidget {
  final String userName;
  final String tenantName;

  const _HeaderTitle({
    required this.userName,
    required this.tenantName,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "¡Buenas! Bienvenido, $userName",
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF667085),
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          tenantName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 19,
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w900,
            letterSpacing: 0.15,
          ),
        ),
      ],
    );
  }
}

class _LiveRefreshStrip extends StatelessWidget {
  final String label;
  final bool refreshing;
  final Future<void> Function() onRefresh;

  const _LiveRefreshStrip({
    required this.label,
    required this.refreshing,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: const BoxDecoration(
              color: Color(0xFF22C55E),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          const Text(
            "Dashboard en vivo",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              refreshing ? "Sincronizando datos..." : label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF667085),
              ),
            ),
          ),
          InkWell(
            onTap: () {
              onRefresh();
            },
            borderRadius: BorderRadius.circular(999),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F5F8),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Icon(
                refreshing ? Icons.sync_rounded : Icons.refresh_rounded,
                size: 17,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveChip extends StatelessWidget {
  final bool refreshing;

  const _LiveChip({required this.refreshing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF16A34A).withOpacity(0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFF86EFAC).withOpacity(0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: Color(0xFF86EFAC),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            refreshing ? "Sync" : "En vivo",
            style: const TextStyle(
              fontSize: 10.5,
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _SubscriptionMiniError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _SubscriptionMiniError({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: Color(0xFFB45309),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF92400E),
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text("Reintentar"),
          ),
        ],
      ),
    );
  }
}

class _SubscriptionBanner extends StatelessWidget {
  final subsvc.SubscriptionInfo subscription;
  final String usageText;
  final VoidCallback onOpenConfig;

  const _SubscriptionBanner({
    required this.subscription,
    required this.usageText,
    required this.onOpenConfig,
  });

  bool get _isPendingReview {
    final estado = (subscription.estado ?? '').trim().toUpperCase();
    return estado == 'PENDING_REVIEW';
  }

  Color get _bgColor {
    if (subscription.isExpired) return const Color(0xFFFEF2F2);
    if (_isPendingReview) return const Color(0xFFFFFBEB);
    if (subscription.isTrial) return const Color(0xFFFFFBEB);
    return const Color(0xFFECFDF5);
  }

  Color get _borderColor {
    if (subscription.isExpired) return const Color(0xFFFECACA);
    if (_isPendingReview) return const Color(0xFFFDE68A);
    if (subscription.isTrial) return const Color(0xFFFDE68A);
    return const Color(0xFFA7F3D0);
  }

  Color get _titleColor {
    if (subscription.isExpired) return const Color(0xFF991B1B);
    if (_isPendingReview) return const Color(0xFF92400E);
    if (subscription.isTrial) return const Color(0xFF92400E);
    return const Color(0xFF065F46);
  }

  IconData get _icon {
    if (subscription.isExpired) return Icons.lock_outline_rounded;
    if (_isPendingReview) return Icons.hourglass_top_rounded;
    if (subscription.isTrial) return Icons.workspace_premium_rounded;
    return Icons.verified_rounded;
  }

  String get _subtitle {
    if (subscription.isExpired) {
      return "Esta cuenta no está disponible en este momento.";
    }
    if (_isPendingReview) {
      return "El estado de esta cuenta está pendiente de revisión.";
    }
    if (subscription.isTrial) {
      return "Esta cuenta se encuentra en período de evaluación.";
    }
    return "Tu cuenta está activa y lista para operar.";
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_icon, color: _titleColor, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subscription.estadoLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: _titleColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: _titleColor.withOpacity(0.84),
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onOpenConfig,
                child: const Text("Ver"),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              usageText,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: _titleColor.withOpacity(0.9),
              ),
            ),
          ),
          if ((subscription.fechaRenovacion ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: 5),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Fecha límite: ${subscription.fechaRenovacion}",
                style: TextStyle(
                  fontSize: 11.2,
                  fontWeight: FontWeight.w700,
                  color: _titleColor.withOpacity(0.8),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _LimitAlertCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _LimitAlertCard({
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.info_outline_rounded,
                color: Color(0xFFB45309),
                size: 19,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 11.5,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}

class _OwnerModeToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _OwnerModeToggle({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 14,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F5F8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.person_pin_circle_rounded,
              color: Color(0xFF0F172A),
              size: 20,
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Modo atención",
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  "Actívalo solo si hoy vas a atender clientes.",
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF667085),
                  ),
                ),
              ],
            ),
          ),
          Transform.scale(
            scale: 0.92,
            child: Switch(
              value: value,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCardPremium extends StatelessWidget {
  final double ventasHoy;
  final int citasHoy;
  final int barberosActivos;
  final String planLabel;
  final String estadoLabel;
  final List<BranchDashboardItemModel> branches;
  final String lastUpdatedLabel;
  final bool refreshing;
  final Future<void> Function() onRefresh;
  final VoidCallback onResumenTap;

  const _SummaryCardPremium({
    required this.ventasHoy,
    required this.citasHoy,
    required this.barberosActivos,
    required this.planLabel,
    required this.estadoLabel,
    required this.branches,
    required this.lastUpdatedLabel,
    required this.refreshing,
    required this.onRefresh,
    required this.onResumenTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0F172A),
            Color(0xFF111827),
            Color(0xFF172554),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x220F172A),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  "PRODUCCIÓN DE HOY",
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFFCBD5E1),
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
              ),
              _LiveChip(refreshing: refreshing),
              const SizedBox(width: 8),
              _TopChip(label: estadoLabel),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            "S/ ${ventasHoy.toStringAsFixed(2)}",
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            "Venta total acumulada del día",
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFFCBD5E1),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  lastUpdatedLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ),
              InkWell(
                onTap: () {
                  onRefresh();
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        refreshing ? Icons.sync_rounded : Icons.refresh_rounded,
                        size: 15,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        "Actualizar",
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onResumenTap,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: const Icon(
                    Icons.bar_chart_rounded,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _DarkPill(
                icon: Icons.calendar_month_rounded,
                text: "$citasHoy citas",
              ),
              _DarkPill(
                icon: Icons.content_cut_rounded,
                text: "$barberosActivos barberos",
              ),
            ],
          ),
          if (branches.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text(
              "Detalle de producción por sede",
              style: TextStyle(
                fontSize: 12,
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            ...branches.map(
                  (branch) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _BranchDayDetailCard(branch: branch),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TopChip extends StatelessWidget {
  final String label;

  const _TopChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 130),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 10.5,
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _DarkPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _DarkPill({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _BranchDayDetailCard extends StatelessWidget {
  final BranchDashboardItemModel branch;

  const _BranchDayDetailCard({
    required this.branch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.09),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            branch.branchName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "S/ ${branch.todaySales.toStringAsFixed(2)}",
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF86EFAC),
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _MiniDarkInfo(text: "${branch.todayAppointments} citas"),
              _MiniDarkInfo(text: "${branch.activeBarbers} barberos"),
              _MiniDarkInfo(
                text: "Ticket S/ ${branch.averageTicket.toStringAsFixed(0)}",
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniDarkInfo extends StatelessWidget {
  final String text;

  const _MiniDarkInfo({
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 10.8,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE2E8F0),
        ),
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  final bool agendaEnabled;
  final bool cobrarEnabled;
  final bool loyaltyEnabled;
  final bool aiEnabled;
  final VoidCallback onAgenda;
  final VoidCallback onCobrar;
  final VoidCallback onAsesorIA;
  final VoidCallback onValidarCanje;
  final VoidCallback onClientes;

  const _QuickActionsGrid({
    required this.agendaEnabled,
    required this.cobrarEnabled,
    required this.loyaltyEnabled,
    required this.aiEnabled,
    required this.onAgenda,
    required this.onCobrar,
    required this.onAsesorIA,
    required this.onValidarCanje,
    required this.onClientes,
  });

  @override
  Widget build(BuildContext context) {
    return GridView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.62,
      ),
      children: [
        _ActionCard(
          icon: Icons.people_alt_rounded,
          title: "Clientes",
          subtitle: "Base de clientes",
          onTap: onClientes,
          enabled: true,
        ),
        _ActionCard(
          icon: Icons.calendar_month_rounded,
          title: "Agenda",
          subtitle: agendaEnabled ? "Ver citas" : "Bloqueado",
          onTap: onAgenda,
          enabled: agendaEnabled,
        ),
        _ActionCard(
          icon: Icons.point_of_sale_rounded,
          title: "Cobrar",
          subtitle: cobrarEnabled ? "Caja" : "Bloqueado",
          onTap: onCobrar,
          enabled: cobrarEnabled,
        ),
        _ActionCard(
          icon: Icons.redeem_rounded,
          title: "Validar canje",
          subtitle: loyaltyEnabled ? "Premios" : "No incluido",
          onTap: onValidarCanje,
          enabled: true,
          locked: !loyaltyEnabled,
        ),
        _ActionCard(
          icon: Icons.auto_awesome_rounded,
          title: "Asesor IA",
          subtitle: aiEnabled ? "Disponible" : "No disponible",
          onTap: onAsesorIA,
          highlight: true,
          enabled: true,
          locked: !aiEnabled,
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool highlight;
  final bool enabled;
  final bool locked;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.highlight = false,
    this.enabled = true,
    this.locked = false,
  });

  @override
  Widget build(BuildContext context) {
    final actualHighlight = highlight && enabled;
    final bg = actualHighlight ? const Color(0xFF0F172A) : Colors.white;
    final fg = enabled
        ? (actualHighlight ? Colors.white : const Color(0xFF0F172A))
        : const Color(0xFF9CA3AF);
    final sub = enabled
        ? (actualHighlight ? Colors.white70 : const Color(0xFF667085))
        : const Color(0xFF9CA3AF);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(18),
          border: !enabled ? Border.all(color: const Color(0xFFE5E7EB)) : null,
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D000000),
              blurRadius: 14,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: actualHighlight
                      ? Colors.white.withOpacity(0.12)
                      : const Color(0xFFF3F5F8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  locked ? Icons.lock_outline_rounded : icon,
                  color: fg,
                  size: 19,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.05,
                  fontWeight: FontWeight.w900,
                  color: fg,
                ),
              ),
              const SizedBox(height: 3),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: sub,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    locked
                        ? Icons.workspace_premium_rounded
                        : Icons.chevron_right_rounded,
                    color: fg,
                    size: 17,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OwnerSecondaryCTA extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _OwnerSecondaryCTA({
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F5F8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.flash_on_rounded,
                  color: Color(0xFF0F172A),
                  size: 19,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF0F172A),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final Widget trailing;

  const _SectionTitle({
    required this.title,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const Spacer(),
        trailing,
      ],
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  final String message;

  const _EmptyStateCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: Color(0xFF667085),
        ),
      ),
    );
  }
}

class _CitaTileCompact extends StatelessWidget {
  final _Cita cita;
  final bool enabled;
  final VoidCallback onAtender;

  const _CitaTileCompact({
    required this.cita,
    required this.enabled,
    required this.onAtender,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            padding: const EdgeInsets.symmetric(vertical: 9),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F5F8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  cita.hora,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 3),
                const Icon(
                  Icons.timer_outlined,
                  size: 14,
                  color: Color(0xFF667085),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cita.cliente,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  cita.servicio,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF667085),
                  ),
                ),
                if (cita.barberName.trim().isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    "Barbero: ${cita.barberName}",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10.8,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF98A2B3),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: onAtender,
            style: ElevatedButton.styleFrom(
              backgroundColor:
              enabled ? const Color(0xFF0F172A) : const Color(0xFFD1D5DB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              elevation: 0,
              minimumSize: const Size(74, 38),
            ),
            child: Text(
              enabled ? "Atender" : "Bloq.",
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 11.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRowCompact extends StatelessWidget {
  final List<_StatItem> items;

  const _StatsRowCompact({required this.items});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final itemWidth = (width - 14 * 2 - 10) / 2;

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: items
          .map(
            (s) => Container(
          width: itemWidth,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 12,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                s.label,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF667085),
                ),
              ),
              const SizedBox(height: 5),
              Text(
                s.value,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),
      )
          .toList(),
    );
  }
}

class _StatItem {
  final String label;
  final String value;

  const _StatItem({
    required this.label,
    required this.value,
  });
}