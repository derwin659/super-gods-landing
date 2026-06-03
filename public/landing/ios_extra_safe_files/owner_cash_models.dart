class BranchOptionModel {
  final int id;
  final String name;

  BranchOptionModel({
    required this.id,
    required this.name,
  });

  factory BranchOptionModel.fromJson(Map<String, dynamic> json) {
    return BranchOptionModel(
      id: _asInt(json['branchId'] ?? json['id']),
      name: (json['branchName'] ?? json['name'] ?? json['nombre'] ?? 'Sede')
          .toString(),
    );
  }
}

class OwnerCashBarberOptionModel {
  final int id;
  final String name;
  final bool isOwner;

  OwnerCashBarberOptionModel({
    required this.id,
    required this.name,
    this.isOwner = false,
  });

  factory OwnerCashBarberOptionModel.fromJson(Map<String, dynamic> json) {
    return OwnerCashBarberOptionModel(
      id: _asInt(json['id'] ?? json['userId'] ?? json['barberUserId']),
      name: (json['nombre'] ??
              json['name'] ??
              json['fullName'] ??
              json['nombreCompleto'] ??
              'Barbero')
          .toString(),
      isOwner: json['isOwner'] == true || json['owner'] == true,
    );
  }
}

class CashMovementModel {
  final int id;
  final String type;
  final String? paymentMethod;
  final String? fromPaymentMethod;
  final String? toPaymentMethod;
  final double amount;
  final String concept;
  final String? note;
  final String? movementDate;
  final int? userId;
  final String? userName;
  final int? barberUserId;
  final String? barberUserName;

  CashMovementModel({
    required this.id,
    required this.type,
    required this.paymentMethod,
    required this.fromPaymentMethod,
    required this.toPaymentMethod,
    required this.amount,
    required this.concept,
    required this.note,
    required this.movementDate,
    required this.userId,
    required this.userName,
    required this.barberUserId,
    required this.barberUserName,
  });

  bool get isExpenseLike =>
      type == 'EXPENSE' ||
          type == 'ADVANCE_BARBER' ||
          type == 'PAYMENT_BARBER';

  bool get isPaymentTransfer => type == 'PAYMENT_METHOD_TRANSFER';

  factory CashMovementModel.fromJson(Map<String, dynamic> json) {
    return CashMovementModel(
      id: _asInt(json['id']),
      type: (json['type'] ?? 'EXPENSE').toString(),
      paymentMethod: json['paymentMethod']?.toString(),
      fromPaymentMethod: json['fromPaymentMethod']?.toString(),
      toPaymentMethod: json['toPaymentMethod']?.toString(),
      amount: _asDouble(json['amount']),
      concept: (json['concept'] ?? 'Movimiento').toString(),
      note: json['note']?.toString(),
      movementDate: json['movementDate']?.toString(),
      userId: _asNullableInt(json['userId']),
      userName: json['userName']?.toString(),
      barberUserId: _asNullableInt(json['barberUserId']),
      barberUserName: json['barberUserName']?.toString(),
    );
  }
}

class PaymentMethodSummaryModel {
  final String paymentMethod;
  final int count;
  final double totalAmount;

  PaymentMethodSummaryModel({
    required this.paymentMethod,
    required this.count,
    required this.totalAmount,
  });

  factory PaymentMethodSummaryModel.fromJson(Map<String, dynamic> json) {
    return PaymentMethodSummaryModel(
      paymentMethod: (json['paymentMethod'] ?? json['method'] ?? '').toString(),
      count: _asInt(json['count']),
      totalAmount: _asDouble(
        json['totalAmount'] ?? json['amount'] ?? json['total'],
      ),
    );
  }
}


class OwnerPaymentMethodModel {
  final int? id;
  final String code;
  final String displayName;
  final String countryCode;
  final bool active;
  final int sortOrder;

  const OwnerPaymentMethodModel({
    this.id,
    required this.code,
    required this.displayName,
    this.countryCode = '',
    this.active = true,
    this.sortOrder = 0,
  });

  factory OwnerPaymentMethodModel.fromJson(Map<String, dynamic> json) {
    final rawCode = (json['code'] ?? json['method'] ?? json['paymentMethod'] ?? '').toString();
    final code = normalizePaymentCode(rawCode);

    return OwnerPaymentMethodModel(
      id: _asNullableInt(json['id'] ?? json['paymentMethodId']),
      code: code,
      displayName: (json['displayName'] ?? json['name'] ?? json['label'] ?? code).toString(),
      countryCode: (json['countryCode'] ?? '').toString(),
      active: json['active'] != false,
      sortOrder: _asInt(json['sortOrder']),
    );
  }

  static List<OwnerPaymentMethodModel> defaultPeruFallback() => const [
    OwnerPaymentMethodModel(code: 'CASH', displayName: 'Efectivo', countryCode: 'PE', sortOrder: 1),
    OwnerPaymentMethodModel(code: 'CARD', displayName: 'Tarjeta', countryCode: 'PE', sortOrder: 2),
    OwnerPaymentMethodModel(code: 'TRANSFER', displayName: 'Transferencia', countryCode: 'PE', sortOrder: 3),
    OwnerPaymentMethodModel(code: 'YAPE', displayName: 'Yape', countryCode: 'PE', sortOrder: 4),
    OwnerPaymentMethodModel(code: 'PLIN', displayName: 'Plin', countryCode: 'PE', sortOrder: 5),
  ];
}

String normalizePaymentCode(String? value) {
  final code = (value ?? '')
      .trim()
      .toUpperCase()
      .replaceAll('Á', 'A')
      .replaceAll('É', 'E')
      .replaceAll('Í', 'I')
      .replaceAll('Ó', 'O')
      .replaceAll('Ú', 'U')
      .replaceAll(' ', '_');

  switch (code) {
    case 'EFECTIVO':
      return 'CASH';
    case 'TARJETA':
      return 'CARD';
    case 'TRANSFERENCIA':
      return 'TRANSFER';
    case 'GRATIS':
      return 'FREE';
    default:
      return code;
  }
}

class CashRegisterModel {
  final int id;
  final String status;
  final int? branchId;
  final String? branchName;
  final int? openedByUserId;
  final String? openedByUserName;
  final int? assignedUserId;
  final String? assignedUserName;
  final double openingAmount;
  final double closingAmountExpected;
  final double closingAmountCounted;
  final double differenceAmount;
  final String? openedAt;
  final String? closedAt;
  final String? openingNote;
  final String? closingNote;
  final double salesTotal;
  final double cashSalesTotal;
  final double movementsIncome;
  final double movementsExpense;
  final double movementsExpenseGeneral;
  final double movementsAdvanceBarber;
  final double movementsPaymentBarber;
  final List<PaymentMethodSummaryModel> paymentMethodsSummary;
  final List<PaymentMethodSummaryModel> paymentMethodBalances;
  final List<CashMovementModel> movements;

  CashRegisterModel({
    required this.id,
    required this.status,
    required this.branchId,
    required this.branchName,
    required this.openedByUserId,
    required this.openedByUserName,
    required this.assignedUserId,
    required this.assignedUserName,
    required this.openingAmount,
    required this.closingAmountExpected,
    required this.closingAmountCounted,
    required this.differenceAmount,
    required this.openedAt,
    required this.closedAt,
    required this.openingNote,
    required this.closingNote,
    required this.salesTotal,
    required this.cashSalesTotal,
    required this.movementsIncome,
    required this.movementsExpense,
    required this.movementsExpenseGeneral,
    required this.movementsAdvanceBarber,
    required this.movementsPaymentBarber,
    required this.paymentMethodsSummary,
    required this.paymentMethodBalances,
    required this.movements,
  });

  factory CashRegisterModel.fromJson(Map<String, dynamic> json) {
    final rawMovements = (json['movements'] as List?) ?? const [];
    final rawPaymentSummary =
        (json['paymentMethodsSummary'] as List?) ??
            (json['paymentMethodSummary'] as List?) ??
            (json['paymentsSummary'] as List?) ??
            const [];

    final rawPaymentBalances =
        (json['paymentMethodBalances'] as List?) ??
            (json['paymentMethodsBalances'] as List?) ??
            (json['balancesByPaymentMethod'] as List?) ??
            const [];

    return CashRegisterModel(
      id: _asInt(json['id']),
      status: (json['status'] ?? '').toString(),
      branchId: _asNullableInt(json['branchId']),
      branchName: json['branchName']?.toString(),
      openedByUserId: _asNullableInt(json['openedByUserId']),
      openedByUserName: json['openedByUserName']?.toString(),
      assignedUserId: _asNullableInt(json['assignedUserId']),
      assignedUserName: json['assignedUserName']?.toString(),
      openingAmount: _asDouble(json['openingAmount']),
      closingAmountExpected: _asDouble(json['closingAmountExpected']),
      closingAmountCounted: _asDouble(json['closingAmountCounted']),
      differenceAmount: _asDouble(json['differenceAmount']),
      openedAt: json['openedAt']?.toString(),
      closedAt: json['closedAt']?.toString(),
      openingNote: json['openingNote']?.toString(),
      closingNote: json['closingNote']?.toString(),
      salesTotal: _asDouble(json['salesTotal']),
      cashSalesTotal: _asDouble(json['cashSalesTotal']),
      movementsIncome: _asDouble(json['movementsIncome']),
      movementsExpense: _asDouble(json['movementsExpense']),
      movementsExpenseGeneral: _asDouble(json['movementsExpenseGeneral']),
      movementsAdvanceBarber: _asDouble(json['movementsAdvanceBarber']),
      movementsPaymentBarber: _asDouble(json['movementsPaymentBarber']),
      paymentMethodsSummary: rawPaymentSummary
          .map(
            (e) => PaymentMethodSummaryModel.fromJson(
          Map<String, dynamic>.from(e),
        ),
      )
          .where((e) => e.totalAmount > 0)
          .toList(),
      paymentMethodBalances: rawPaymentBalances
          .map(
            (e) => PaymentMethodSummaryModel.fromJson(
          Map<String, dynamic>.from(e),
        ),
      )
          .toList(),
      movements: rawMovements
          .map(
            (e) => CashMovementModel.fromJson(Map<String, dynamic>.from(e)),
      )
          .toList(),
    );
  }
}

class CashSaleItemModel {
  final int saleItemId;
  final int? serviceId;
  final String? serviceName;
  final int? productId;
  final String? productName;
  final int? barberUserId;
  final String? barberUserName;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;

  CashSaleItemModel({
    required this.saleItemId,
    required this.serviceId,
    required this.serviceName,
    required this.productId,
    required this.productName,
    required this.barberUserId,
    required this.barberUserName,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory CashSaleItemModel.fromJson(Map<String, dynamic> json) {
    return CashSaleItemModel(
      saleItemId: _asInt(json['saleItemId']),
      serviceId: _asNullableInt(json['serviceId']),
      serviceName: json['serviceName']?.toString(),
      productId: _asNullableInt(json['productId']),
      productName: json['productName']?.toString(),
      barberUserId: _asNullableInt(json['barberUserId']),
      barberUserName: json['barberUserName']?.toString(),
      cantidad: _asInt(json['cantidad'], fallback: 1),
      precioUnitario: _asDouble(json['precioUnitario']),
      subtotal: _asDouble(json['subtotal']),
    );
  }
}

class CashSalePaymentModel {
  final String method;
  final double amount;

  CashSalePaymentModel({
    required this.method,
    required this.amount,
  });

  factory CashSalePaymentModel.fromJson(Map<String, dynamic> json) {
    return CashSalePaymentModel(
      method: (json['method'] ?? json['paymentMethod'] ?? json['metodoPago'] ?? '')
          .toString(),
      amount: _asDouble(json['amount'] ?? json['totalAmount'] ?? json['total']),
    );
  }
}

class CashSaleModel {
  final int saleId;
  final int? cashRegisterId;
  final int? customerId;
  final String? customerName;
  final int? appointmentId;
  final String metodoPago;
  final double subtotal;
  final double discount;
  final double total;
  final double cashReceived;
  final double changeAmount;
  final String? fechaCreacion;
  final int puntosGanados;
  final String? barberName;
  final List<CashSaleItemModel> items;
  final List<CashSalePaymentModel> payments;

  CashSaleModel({
    required this.saleId,
    required this.cashRegisterId,
    required this.customerId,
    required this.customerName,
    required this.appointmentId,
    required this.metodoPago,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.cashReceived,
    required this.changeAmount,
    required this.fechaCreacion,
    required this.puntosGanados,
    required this.barberName,
    required this.items,
    required this.payments,
  });

  factory CashSaleModel.fromJson(Map<String, dynamic> json) {
    final rawItems = (json['items'] as List?) ?? [];
    final rawPayments =
        (json['payments'] as List?) ??
            (json['salePayments'] as List?) ??
            (json['paymentDetails'] as List?) ??
            const [];

    final items = rawItems
        .map((e) => CashSaleItemModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();

    final payments = rawPayments
        .map(
          (e) => CashSalePaymentModel.fromJson(Map<String, dynamic>.from(e)),
    )
        .where((e) => e.method.trim().isNotEmpty && e.amount > 0)
        .toList();

    String? resolvedBarberName = json['barberName']?.toString();

    if (resolvedBarberName == null || resolvedBarberName.trim().isEmpty) {
      for (final item in items) {
        final candidate = item.barberUserName?.trim();
        if (candidate != null && candidate.isNotEmpty) {
          resolvedBarberName = candidate;
          break;
        }
      }
    }

    return CashSaleModel(
      saleId: _asInt(json['saleId']),
      cashRegisterId: _asNullableInt(json['cashRegisterId']),
      customerId: _asNullableInt(json['customerId']),
      customerName: json['customerName']?.toString(),
      appointmentId: _asNullableInt(json['appointmentId']),
      metodoPago: (json['metodoPago'] ?? 'CASH').toString(),
      subtotal: _asDouble(json['subtotal']),
      discount: _asDouble(json['discount']),
      total: _asDouble(json['total']),
      cashReceived: _asDouble(json['cashReceived']),
      changeAmount: _asDouble(json['changeAmount']),
      fechaCreacion: json['fechaCreacion']?.toString(),
      puntosGanados: _asInt(json['puntosGanados']),
      barberName: resolvedBarberName,
      items: items,
      payments: payments,
    );
  }
}

class CashSaleItemPayload {
  final int? serviceId;
  final int? productId;
  final int? barberUserId;
  final int cantidad;
  final double? precioUnitario;

  CashSaleItemPayload({
    this.serviceId,
    this.productId,
    this.barberUserId,
    required this.cantidad,
    this.precioUnitario,
  });

  Map<String, dynamic> toJson() {
    return {
      'serviceId': serviceId,
      'productId': productId,
      'barberUserId': barberUserId,
      'cantidad': cantidad,
      'precioUnitario': precioUnitario,
    };
  }
}


class CashSalePaymentPayload {
  final String method;
  final double amount;

  CashSalePaymentPayload({
    required this.method,
    required this.amount,
  });

  Map<String, dynamic> toJson() {
    return {
      'method': method,
      'amount': amount,
    };
  }
}

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

int? _asNullableInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim());
  return null;
}
