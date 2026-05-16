import 'package:dio/dio.dart';
import 'session_service.dart';

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

class SubscriptionInfo {
  final int? subId;
  final int? tenantId;
  final String plan;
  final String estado;
  final bool trial;
  final double precioMensual;
  final String billingCycle;
  final String currency;
  final String? fechaInicio;
  final String? fechaRenovacion;
  final String? fechaFin;
  final int diasGracia;
  final String observaciones;
  final int maxBranches;
  final int usedBranches;
  final int maxBarbers;
  final int usedBarbers;
  final int maxAdmins;
  final int usedAdmins;
  final bool aiEnabled;
  final bool loyaltyEnabled;
  final bool promotionsEnabled;
  final bool canOperate;
  final bool expired;

  const SubscriptionInfo({
    required this.subId,
    required this.tenantId,
    required this.plan,
    required this.estado,
    required this.trial,
    required this.precioMensual,
    required this.billingCycle,
    required this.currency,
    required this.fechaInicio,
    required this.fechaRenovacion,
    required this.fechaFin,
    required this.diasGracia,
    required this.observaciones,
    required this.maxBranches,
    required this.usedBranches,
    required this.maxBarbers,
    required this.usedBarbers,
    required this.maxAdmins,
    required this.usedAdmins,
    required this.aiEnabled,
    required this.loyaltyEnabled,
    required this.promotionsEnabled,
    required this.canOperate,
    required this.expired,
  });

  factory SubscriptionInfo.fromJson(Map<String, dynamic> j) {
    return SubscriptionInfo(
      subId: j['subId'] == null ? null : _asInt(j['subId']),
      tenantId: j['tenantId'] == null ? null : _asInt(j['tenantId']),
      plan: (j['plan'] ?? 'STARTER').toString(),
      estado: (j['estado'] ?? 'TRIAL').toString(),
      trial: _asBool(j['trial']),
      precioMensual: _asDouble(j['precioMensual']),
      billingCycle: (j['billingCycle'] ?? 'MONTHLY').toString(),
      currency: (j['currency'] ?? 'USD').toString(),
      fechaInicio: j['fechaInicio']?.toString(),
      fechaRenovacion: j['fechaRenovacion']?.toString(),
      fechaFin: j['fechaFin']?.toString(),
      diasGracia: _asInt(j['diasGracia']),
      observaciones: (j['observaciones'] ?? '').toString(),
      maxBranches: _asInt(j['maxBranches']),
      usedBranches: _asInt(j['usedBranches']),
      maxBarbers: _asInt(j['maxBarbers']),
      usedBarbers: _asInt(j['usedBarbers']),
      maxAdmins: _asInt(j['maxAdmins']),
      usedAdmins: _asInt(j['usedAdmins']),
      aiEnabled: _asBool(j['aiEnabled']),
      loyaltyEnabled: _asBool(j['loyaltyEnabled']),
      promotionsEnabled: _asBool(j['promotionsEnabled']),
      canOperate: _asBool(j['canOperate'], fallback: true),
      expired: _asBool(j['expired']),
    );
  }

  bool get isExpired {
    final e = estado.trim().toUpperCase();
    return expired ||
        e == 'EXPIRED' ||
        e == 'PAST_DUE' ||
        e == 'CANCELLED' ||
        e == 'VENCIDO' ||
        e == 'EXPIRADO' ||
        e == 'CANCELADO';
  }

  bool get isTrial {
    final e = estado.trim().toUpperCase();
    return trial || e == 'TRIAL';
  }

  bool get isActiveLike {
    final e = estado.trim().toUpperCase();
    return e == 'ACTIVE' ||
        e == 'TRIAL' ||
        e == 'ACTIVO' ||
        e == 'ACTIVA';
  }

  bool get canUseCoreModules => canOperate && isActiveLike && !isExpired;
  bool get canUseAi => canUseCoreModules && aiEnabled;
  bool get canUseLoyalty => canUseCoreModules && loyaltyEnabled;
  bool get canAddBarber => usedBarbers < maxBarbers;
  bool get canAddBranch => usedBranches < maxBranches;
  bool get canAddAdmin => usedAdmins < maxAdmins;

  String get planLabel {
    switch (plan.trim().toUpperCase()) {
      case 'STARTER':
        return 'Cuenta básica';
      case 'PRO':
        return 'Cuenta activa';
      case 'GODS_AI':
        return 'Cuenta con IA';
      default:
        return plan;
    }
  }

  String get estadoLabel {
    switch (estado.trim().toUpperCase()) {
      case 'TRIAL':
        return 'En evaluación';
      case 'ACTIVE':
      case 'ACTIVO':
      case 'ACTIVA':
        return 'Activo';
      case 'EXPIRED':
      case 'VENCIDO':
      case 'EXPIRADO':
        return 'Vencido';
      case 'PAST_DUE':
      case 'PENDING_REVIEW':
        return 'Pendiente de revisión';
      case 'CANCELLED':
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}

class SubscriptionService {
  static const String baseUrl = "https://gods-saas-backend-production.up.railway.app";
  ///static const String baseUrl = "http://192.168.100.9:8081";
  ///static const String baseUrl = "http://192.168.0.169:8081";

  Future<Dio> _buildDio() async {
    final token = await SessionService.getToken();
    final tenantId = await SessionService.getTenantId();

    if (token == null || token.isEmpty) {
      throw Exception("Sesión expirada. Vuelve a iniciar sesión.");
    }
    if (tenantId == null) {
      throw Exception("No se encontró tenantId en sesión.");
    }

    return Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 20),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
          "X-Tenant-Id": tenantId.toString(),
        },
      ),
    );
  }

  Future<SubscriptionInfo> getCurrentSubscription() async {
    final dio = await _buildDio();
    final res = await dio.get("/api/subscription/current");
    final raw = res.data;

    if (raw is! Map) {
      throw Exception("La respuesta de la cuenta no es válida.");
    }

    return SubscriptionInfo.fromJson(Map<String, dynamic>.from(raw));
  }

}