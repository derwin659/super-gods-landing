import 'package:dio/dio.dart';
import '../model/owner_barber_payment_models.dart';
import 'session_service.dart';

class OwnerBarberPaymentService {
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ),
    );
  }

  String _dateOnly(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  String _prettyError(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    if (data is Map && data['error'] != null) {
      return data['error'].toString();
    }
    if (data != null) return data.toString();
    return e.message ?? 'Error inesperado';
  }

  Future<BarberPaymentPreviewModel> getPreview({
    required int branchId,
    required int barberUserId,
    required DateTime from,
    required DateTime to,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/barber-payments/preview',
        queryParameters: {
          'branchId': branchId,
          'barberUserId': barberUserId,
          'periodFrom': _dateOnly(from),
          'periodTo': _dateOnly(to),
        },
      );

      return BarberPaymentPreviewModel.fromJson(
        Map<String, dynamic>.from(res.data),
      );
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<BarberPaymentModel> createPayment({
    required int branchId,
    required int cashRegisterId,
    required int barberUserId,
    required DateTime from,
    required DateTime to,
    required double amountPaid,
    required String paymentMethod,
    List<Map<String, dynamic>> payments = const [],
    String? note,
  }) async {
    final dio = await _dio();

    final normalizedPayments = payments
        .map((payment) {
          final method = (payment['method'] ?? payment['paymentMethod'] ?? '')
              .toString()
              .trim()
              .toUpperCase();
          final amount = double.tryParse('${payment['amount'] ?? 0}') ?? 0;

          return {
            'method': method,
            'amount': amount,
          };
        })
        .where((payment) =>
            (payment['method'] as String).isNotEmpty &&
            (payment['amount'] as double) > 0)
        .toList();

    final totalPaid = normalizedPayments.isEmpty
        ? amountPaid
        : normalizedPayments.fold<double>(
            0,
            (sum, payment) => sum + (payment['amount'] as double),
          );

    final resolvedPaymentMethod = normalizedPayments.length > 1
        ? 'MIXED'
        : normalizedPayments.length == 1
            ? normalizedPayments.first['method'].toString()
            : paymentMethod;

    try {
      final res = await dio.post(
        '/api/owner/cash-registers/$cashRegisterId/barber-payments',
        queryParameters: {'branchId': branchId},
        data: {
          'barberUserId': barberUserId,
          'periodFrom': _dateOnly(from),
          'periodTo': _dateOnly(to),
          'amountPaid': totalPaid,
          'paymentMethod': resolvedPaymentMethod,
          'payments': normalizedPayments,
          'note': note,
        },
      );

      return BarberPaymentModel.fromJson(
        Map<String, dynamic>.from(res.data),
      );
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }

  Future<List<BarberPaymentModel>> getHistory({
    required int branchId,
    required int barberUserId,
  }) async {
    final dio = await _dio();

    try {
      final res = await dio.get(
        '/api/owner/barber-payments/history',
        queryParameters: {
          'branchId': branchId,
          'barberUserId': barberUserId,
        },
      );

      return (res.data as List<dynamic>)
          .map((e) => BarberPaymentModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_prettyError(e));
    }
  }
}
