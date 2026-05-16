import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';
import '../model/owner_cash_models.dart';
import 'session_service.dart';

class OwnerCashService {
  static const String baseUrl = SessionService.baseUrl;

  Future<Dio> _dio() async {
    final token = await SessionService.getToken();

    if (token == null || token.isEmpty) {
      throw Exception('Sesión expirada. Vuelve a iniciar sesión.');
    }

    return Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 25),
        sendTimeout: const Duration(seconds: 25),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ),
    );
  }

  Future<List<BranchOptionModel>> getOwnerBranches() async {
    final dio = await _dio();

    try {
      final res = await dio.get('/api/owner/home/dashboard');
      final map = Map<String, dynamic>.from(res.data as Map);
      final raw = (map['branches'] as List?) ?? [];

      return raw
          .map((e) => BranchOptionModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashRegisterModel?> getCurrentCashRegister(int branchId) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/cash-registers/current',
        queryParameters: {'branchId': branchId},
      );
      return CashRegisterModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      final msg = _prettyError(e).toLowerCase();

      if (e.response?.statusCode == 404 ||
          msg.contains('no hay una caja abierta')) {
        return null;
      }

      throw Exception(_prettyError(e));
    }
  }

  Future<List<CashRegisterModel>> getCashHistory({
    required int branchId,
    required DateTime from,
    required DateTime to,
  }) async {
    final dio = await _dio();

    String dateOnly(DateTime d) {
      final yyyy = d.year.toString().padLeft(4, '0');
      final mm = d.month.toString().padLeft(2, '0');
      final dd = d.day.toString().padLeft(2, '0');
      return '$yyyy-$mm-$dd';
    }

    try {
      final res = await dio.get(
        '/api/owner/cash-registers/history',
        queryParameters: {
          'branchId': branchId,
          'from': dateOnly(from),
          'to': dateOnly(to),
        },
      );

      final raw = (res.data as List?) ?? const [];

      return raw
          .map((e) => CashRegisterModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashRegisterModel> openCashRegister({
    required int branchId,
    int? assignedUserId,
    required double openingAmount,
    String? openingNote,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.post(
        '/api/owner/cash-registers/open',
        queryParameters: {'branchId': branchId},
        data: {
          'assignedUserId': assignedUserId,
          'openingAmount': openingAmount,
          'openingNote': openingNote,
        },
      );

      return CashRegisterModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashRegisterModel> closeCashRegister({
    required int branchId,
    required int cashRegisterId,
    required double closingAmountCounted,
    String? closingNote,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.post(
        '/api/owner/cash-registers/$cashRegisterId/close',
        queryParameters: {'branchId': branchId},
        data: {
          'closingAmountCounted': closingAmountCounted,
          'closingNote': closingNote,
        },
      );

      return CashRegisterModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<List<CashMovementModel>> getCashMovements({
    required int branchId,
    required int cashRegisterId,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/cash-registers/$cashRegisterId/movements',
        queryParameters: {'branchId': branchId},
      );

      final raw = (res.data as List?) ?? const [];
      return raw
          .map((e) => CashMovementModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashMovementModel> createCashMovement({
    required int branchId,
    required int cashRegisterId,
    required String type,
    required double amount,
    String? concept,
    String? note,
    int? barberUserId,
    String paymentMethod = 'CASH',
    String? fromPaymentMethod,
    String? toPaymentMethod,
    String? movementDate,
  }) async {
    final dio = await _dio();

    final payload = {
      'type': type,
      'amount': amount,
      'concept': concept,
      'note': note,
      'barberUserId': barberUserId,
      'paymentMethod': paymentMethod,
      'fromPaymentMethod': fromPaymentMethod,
      'toPaymentMethod': toPaymentMethod,
      if (movementDate != null && movementDate.trim().isNotEmpty)
        'movementDate': movementDate,
    };

    try {
      debugPrint(
          'CREATE MOVEMENT URL => /api/owner/cash-registers/$cashRegisterId/movements');
      debugPrint('CREATE MOVEMENT PAYLOAD => $payload');

      final res = await dio.post(
        '/api/owner/cash-registers/$cashRegisterId/movements',
        queryParameters: {'branchId': branchId},
        data: payload,
      );

      debugPrint('CREATE MOVEMENT STATUS => ${res.statusCode}');
      debugPrint('CREATE MOVEMENT DATA => ${res.data}');

      return CashMovementModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      debugPrint('CREATE MOVEMENT DIO STATUS => ${e.response?.statusCode}');
      debugPrint('CREATE MOVEMENT DIO DATA => ${e.response?.data}');
      debugPrint('CREATE MOVEMENT DIO ERROR => ${e.message}');
      throw Exception(_prettyError(e));
    }
  }

  Future<CashMovementModel> updateCashMovement({
    required int branchId,
    required int movementId,
    required String type,
    required double amount,
    String? concept,
    String? note,
    int? barberUserId,
    String paymentMethod = 'CASH',
    String? fromPaymentMethod,
    String? toPaymentMethod,
    String? movementDate,
  }) async {
    final dio = await _dio();

    final payload = {
      'type': type,
      'amount': amount,
      'concept': concept,
      'note': note,
      'barberUserId': barberUserId,
      'paymentMethod': paymentMethod,
      'fromPaymentMethod': fromPaymentMethod,
      'toPaymentMethod': toPaymentMethod,
      if (movementDate != null && movementDate.trim().isNotEmpty)
        'movementDate': movementDate,
    };

    try {
      debugPrint(
          'UPDATE MOVEMENT URL => /api/owner/cash-registers/movements/$movementId');
      debugPrint('UPDATE MOVEMENT PAYLOAD => $payload');

      final res = await dio.put(
        '/api/owner/cash-registers/movements/$movementId',
        queryParameters: {'branchId': branchId},
        data: payload,
      );

      debugPrint('UPDATE MOVEMENT STATUS => ${res.statusCode}');
      debugPrint('UPDATE MOVEMENT DATA => ${res.data}');

      return CashMovementModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      debugPrint('UPDATE MOVEMENT DIO STATUS => ${e.response?.statusCode}');
      debugPrint('UPDATE MOVEMENT DIO DATA => ${e.response?.data}');
      debugPrint('UPDATE MOVEMENT DIO ERROR => ${e.message}');
      throw Exception(_prettyError(e));
    }
  }

  Future<void> deleteCashMovement({
    required int branchId,
    required int movementId,
  }) async {
    final dio = await _dio();

    try {
      debugPrint(
          'DELETE MOVEMENT URL => /api/owner/cash-registers/movements/$movementId');

      final res = await dio.delete(
        '/api/owner/cash-registers/movements/$movementId',
        queryParameters: {'branchId': branchId},
      );

      debugPrint('DELETE MOVEMENT STATUS => ${res.statusCode}');
      debugPrint('DELETE MOVEMENT DATA => ${res.data}');
    } on DioException catch (e) {
      debugPrint('DELETE MOVEMENT DIO STATUS => ${e.response?.statusCode}');
      debugPrint('DELETE MOVEMENT DIO DATA => ${e.response?.data}');
      debugPrint('DELETE MOVEMENT DIO ERROR => ${e.message}');
      throw Exception(_prettyError(e));
    }
  }

  Future<List<CashSaleModel>> getTodaySales(int branchId) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/cash-sales/today',
        queryParameters: {'branchId': branchId},
      );

      final rawList = _extractList(res.data);

      return rawList
          .map((e) => CashSaleModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<List<CashSaleModel>> getSalesByCashRegister({
    required int branchId,
    required int cashRegisterId,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/cash-sales/by-cash-register/$cashRegisterId',
        queryParameters: {'branchId': branchId},
      );

      final rawList = _extractList(res.data);

      return rawList
          .map((e) => CashSaleModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<void> deleteSale({
    required int branchId,
    required int saleId,
  }) async {
    final dio = await _dio();

    try {
      await dio.delete(
        '/api/owner/cash-sales/$saleId',
        queryParameters: {'branchId': branchId},
      );
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashSaleModel> updateSale({
    required int branchId,
    required int saleId,
    required String metodoPago,
    required double subtotal,
    required double discount,
    required double total,
    required double cashReceived,
    required double changeAmount,
    int? customerId,
    List<CashSalePaymentPayload>? payments,
  }) async {
    final dio = await _dio();

    try {
      final payload = {
        'customerId': customerId,
        'metodoPago': metodoPago,
        'subtotal': subtotal,
        'discount': discount,
        'total': total,
        'cashReceived': cashReceived,
        'changeAmount': changeAmount,
        if (payments != null)
          'payments': payments.map((e) => e.toJson()).toList(),
      };

      final res = await dio.put(
        '/api/owner/cash-sales/$saleId',
        queryParameters: {'branchId': branchId},
        data: payload,
      );

      return CashSaleModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<CashSaleModel> createCashSale({
    required int branchId,
    int? customerId,
    int? appointmentId,
    String? saleDate,
    required String metodoPago,
    required double discount,
    required double cashReceived,
    double tipAmount = 0,
    int? tipBarberUserId,
    List<CashSalePaymentPayload> payments = const [],
    required List<CashSaleItemPayload> items,
    String? cutType,
    String? cutDetail,
    String? cutObservations,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.post(
        '/api/owner/cash-sales',
        queryParameters: {'branchId': branchId},
        data: {
          'customerId': customerId,
          'appointmentId': appointmentId,
          if (saleDate != null && saleDate.trim().isNotEmpty)
            'saleDate': saleDate,
          'metodoPago': metodoPago,
          'discount': discount,
          'cashReceived': cashReceived,
          'tipAmount': tipAmount,
          'tipBarberUserId': tipBarberUserId,
          'payments': payments.map((e) => e.toJson()).toList(),
          'cutType': cutType,
          'cutDetail': cutDetail,
          'cutObservations': cutObservations,
          'items': items.map((e) => e.toJson()).toList(),
        },
      );

      return CashSaleModel.fromJson(Map<String, dynamic>.from(res.data));
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<List<OwnerPaymentMethodModel>> getOwnerPaymentMethods(int branchId) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/payment-methods',
        queryParameters: {'branchId': branchId},
      );

      final rawList = _extractList(res.data);
      final methods = rawList
          .map((e) => OwnerPaymentMethodModel.fromJson(Map<String, dynamic>.from(e)))
          .where((e) => e.code.trim().isNotEmpty && e.active)
          .toList()
        ..sort((a, b) {
          final order = a.sortOrder.compareTo(b.sortOrder);
          return order != 0 ? order : a.displayName.compareTo(b.displayName);
        });

      return methods.isEmpty ? OwnerPaymentMethodModel.defaultPeruFallback() : methods;
    } on DioException catch (_) {
      return OwnerPaymentMethodModel.defaultPeruFallback();
    } catch (_) {
      return OwnerPaymentMethodModel.defaultPeruFallback();
    }
  }


  Future<Map<String, dynamic>> getBarberPaymentPreview({
    required int branchId,
    required int barberUserId,
    required String periodFrom,
    required String periodTo,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/barber-payments/preview',
        queryParameters: {
          'branchId': branchId,
          'barberUserId': barberUserId,
          'periodFrom': periodFrom,
          'periodTo': periodTo,
        },
      );

      return Map<String, dynamic>.from(res.data as Map);
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<Map<String, dynamic>> createBarberPayment({
    required int branchId,
    required int cashRegisterId,
    required int barberUserId,
    required String periodFrom,
    required String periodTo,
    required double amountPaid,
    String paymentMethod = 'CASH',
    List<Map<String, dynamic>> payments = const [],
    String? note,
  }) async {
    final dio = await _dio();

    final normalizedPayments = payments
        .map((item) => {
              'method': (item['method'] ?? item['paymentMethod'] ?? '').toString().trim(),
              'amount': _toDouble(item['amount']),
            })
        .where((item) => item['method'].toString().isNotEmpty && (item['amount'] as double) > 0)
        .toList();

    final payload = <String, dynamic>{
      'barberUserId': barberUserId,
      'periodFrom': periodFrom,
      'periodTo': periodTo,
      'note': note,
    };

    if (normalizedPayments.isNotEmpty) {
      final total = normalizedPayments.fold<double>(
        0,
        (sum, item) => sum + (item['amount'] as double),
      );
      payload['payments'] = normalizedPayments;
      payload['amountPaid'] = total;
      payload['paymentMethod'] = normalizedPayments.length > 1
          ? 'MIXED'
          : normalizedPayments.first['method'];
    } else {
      payload['amountPaid'] = amountPaid;
      payload['paymentMethod'] = paymentMethod;
    }

    try {
      final res = await dio.post(
        '/api/owner/cash-registers/$cashRegisterId/barber-payments',
        queryParameters: {'branchId': branchId},
        data: payload,
      );

      return Map<String, dynamic>.from(res.data as Map);
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString().replaceAll(',', '').trim()) ?? 0;
  }

  List<dynamic> _extractList(dynamic data) {
    if (data == null) return [];

    if (data is List) {
      return data;
    }

    if (data is Map) {
      final map = Map<String, dynamic>.from(data);

      const possibleKeys = [
        'data',
        'content',
        'sales',
        'items',
        'results',
        'rows',
      ];

      for (final key in possibleKeys) {
        final value = map[key];
        if (value is List) {
          return value;
        }
      }
    }

    return [];
  }

  String _prettyError(DioException e) {
    final data = e.response?.data;

    if (data is Map<String, dynamic>) {
      if (data['message'] != null) return data['message'].toString();
      if (data['error'] != null) return data['error'].toString();
    }

    if (data is String && data.trim().isNotEmpty) {
      return data;
    }

    return e.message ?? 'Ocurrió un error inesperado.';
  }
}
