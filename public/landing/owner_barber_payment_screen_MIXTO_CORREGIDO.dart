import 'package:flutter/material.dart';
import '../../model/owner_barber_payment_models.dart';
import '../../model/owner_cash_models.dart';
import '../../model/owner_sale_catalog_models.dart';
import '../../services/owner_barber_payment_service.dart';
import '../../services/owner_cash_service.dart';
import '../../services/owner_sale_catalog_service.dart';


class _PaymentSplitDraft {
  _PaymentSplitDraft({required this.method, double amount = 0})
      : amountController = TextEditingController(
          text: amount > 0 ? amount.toStringAsFixed(2) : '',
        );

  String method;
  final TextEditingController amountController;

  double get amount {
    final text = amountController.text.trim().replaceAll(',', '.');
    return double.tryParse(text) ?? 0;
  }

  void dispose() {
    amountController.dispose();
  }

  Map<String, dynamic> toJson() => {
        'method': method,
        'amount': amount,
      };
}

class OwnerBarberPaymentScreen extends StatefulWidget {
  final int branchId;
  final String branchName;
  final int cashRegisterId;

  const OwnerBarberPaymentScreen({
    super.key,
    required this.branchId,
    required this.branchName,
    required this.cashRegisterId,
  });

  @override
  State<OwnerBarberPaymentScreen> createState() =>
      _OwnerBarberPaymentScreenState();
}

class _OwnerBarberPaymentScreenState extends State<OwnerBarberPaymentScreen> {
  final OwnerBarberPaymentService _service = OwnerBarberPaymentService();
  final OwnerCashService _cashService = OwnerCashService();
  final OwnerSaleCatalogService _catalogService = OwnerSaleCatalogService();

  static const _bg = Color(0xFFF6F3ED);
  static const _surface = Colors.white;
  static const _dark = Color(0xFF17131E);
  static const _dark2 = Color(0xFF241C31);
  static const _gold = Color(0xFFD4AF37);
  static const _goldSoft = Color(0xFFF4E6B7);
  static const _border = Color(0xFFE7DCC8);
  static const _textSoft = Color(0xFF7B746C);
  static const _success = Color(0xFF1F8B4D);

  bool _loading = true;
  bool _loadingPreview = false;
  bool _saving = false;

  List<SaleBarberModel> _barbers = [];
  int? _selectedBarberId;

  DateTime _from = DateTime.now().subtract(const Duration(days: 6));
  DateTime _to = DateTime.now();

  BarberPaymentPreviewModel? _preview;

  final TextEditingController _amountCtrl = TextEditingController();
  final TextEditingController _noteCtrl = TextEditingController();

  List<_PaymentSplitDraft> _paymentSplits = [];

  List<OwnerPaymentMethodModel> _paymentMethods =
      OwnerPaymentMethodModel.defaultPeruFallback();

  List<DropdownMenuItem<String>> get _paymentMethodItems => _paymentMethods
      .where((method) => normalizePaymentCode(method.code).isNotEmpty)
      .map(
        (method) => DropdownMenuItem<String>(
      value: normalizePaymentCode(method.code),
      child: Text(method.displayName),
    ),
  )
      .toList();

  @override
  void initState() {
    super.initState();
    _boot();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    for (final split in _paymentSplits) {
      split.dispose();
    }
    super.dispose();
  }

  Future<void> _boot() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _catalogService.getBarbers(branchId: widget.branchId),
        _cashService.getOwnerPaymentMethods(widget.branchId),
      ]);

      if (!mounted) return;

      final barbers = results[0] as List<SaleBarberModel>;
      final methods = results[1] as List<OwnerPaymentMethodModel>;

      setState(() {
        _barbers = barbers;
        _paymentMethods = methods.isEmpty
            ? OwnerPaymentMethodModel.defaultPeruFallback()
            : methods;
        _resetPaymentSplits(amount: _currentAmountToPay());
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _showError(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _loadPreview() async {
    if (_selectedBarberId == null) return;

    setState(() => _loadingPreview = true);

    try {
      final preview = await _service.getPreview(
        branchId: widget.branchId,
        barberUserId: _selectedBarberId!,
        from: _from,
        to: _to,
      );

      if (!mounted) return;
      setState(() {
        _preview = preview;
        _amountCtrl.text = preview.pendingAmount.toStringAsFixed(2);
        _resetPaymentSplits(amount: preview.pendingAmount);
        _loadingPreview = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingPreview = false);
      _showError(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _pickFrom() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _from,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      helpText: 'Selecciona la fecha inicial',
    );

    if (picked != null) {
      setState(() => _from = picked);
      if (_selectedBarberId != null) {
        await _loadPreview();
      }
    }
  }

  Future<void> _pickTo() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _to,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      helpText: 'Selecciona la fecha final',
    );

    if (picked != null) {
      setState(() => _to = picked);
      if (_selectedBarberId != null) {
        await _loadPreview();
      }
    }
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (_selectedBarberId == null) {
      _showError('Selecciona un barbero.');
      return;
    }

    final amount = _currentAmountToPay();

    if (amount <= 0) {
      _showError('Ingresa un monto válido.');
      return;
    }

    final payments = _validPaymentSplits();
    if (payments.isEmpty) {
      _showError('Agrega al menos un método de pago.');
      return;
    }

    final distributed = _paymentsTotal(payments);
    if ((distributed - amount).abs() > 0.009) {
      _showError('La suma por métodos debe ser igual al monto a pagar.');
      return;
    }

    setState(() => _saving = true);

    try {
      await _service.createPayment(
        branchId: widget.branchId,
        cashRegisterId: widget.cashRegisterId,
        barberUserId: _selectedBarberId!,
        from: _from,
        to: _to,
        amountPaid: amount,
        paymentMethod: payments.length > 1 ? 'MIXED' : payments.first['method'].toString(),
        payments: payments,
        note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: _success,
          content: Text('Pago registrado correctamente.'),
        ),
      );

      await Future.delayed(const Duration(milliseconds: 700));

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      _showError(e.toString().replaceFirst('Exception: ', ''));
    }
  }


  double _currentAmountToPay() {
    final text = _amountCtrl.text.trim().replaceAll(',', '.');
    return double.tryParse(text) ?? 0;
  }

  String _defaultPaymentMethod() {
    final codes = _paymentMethods
        .map((e) => normalizePaymentCode(e.code))
        .where((code) => code.isNotEmpty)
        .toSet();

    if (codes.contains('CASH')) return 'CASH';
    return codes.isEmpty ? 'CASH' : codes.first;
  }

  void _disposePaymentSplits() {
    for (final split in _paymentSplits) {
      split.dispose();
    }
  }

  void _resetPaymentSplits({double amount = 0}) {
    _disposePaymentSplits();
    _paymentSplits = [
      _PaymentSplitDraft(
        method: _defaultPaymentMethod(),
        amount: amount,
      ),
    ];
  }

  void _handleAmountChanged(String value) {
    if (_paymentSplits.length == 1) {
      final amount = _currentAmountToPay();
      _paymentSplits.first.amountController.text = amount > 0 ? amount.toStringAsFixed(2) : '';
    }
    setState(() {});
  }

  void _addPaymentSplit() {
    final used = _paymentSplits.map((e) => normalizePaymentCode(e.method)).toSet();
    final options = _paymentMethodItems.map((e) => e.value ?? '').where((e) => e.isNotEmpty).toList();
    final nextMethod = options.firstWhere(
      (code) => !used.contains(normalizePaymentCode(code)),
      orElse: () => options.isNotEmpty ? options.first : 'CASH',
    );

    final remaining = _remainingToDistribute();

    setState(() {
      _paymentSplits.add(
        _PaymentSplitDraft(
          method: nextMethod,
          amount: remaining > 0 ? remaining : 0,
        ),
      );
    });
  }

  void _removePaymentSplit(int index) {
    if (_paymentSplits.length <= 1) return;

    setState(() {
      final removed = _paymentSplits.removeAt(index);
      removed.dispose();
    });
  }

  List<Map<String, dynamic>> _validPaymentSplits() {
    return _paymentSplits
        .map((split) => split.toJson())
        .where((item) =>
            normalizePaymentCode(item['method']?.toString() ?? '').isNotEmpty &&
            ((item['amount'] as double?) ?? 0) > 0)
        .map((item) => {
              'method': normalizePaymentCode(item['method'].toString()),
              'amount': item['amount'],
            })
        .toList();
  }

  double _paymentsTotal([List<Map<String, dynamic>>? items]) {
    final source = items ?? _validPaymentSplits();
    return source.fold<double>(
      0,
      (sum, item) => sum + (double.tryParse(item['amount'].toString()) ?? 0),
    );
  }

  double _remainingToDistribute() {
    return _currentAmountToPay() - _paymentsTotal();
  }

  String _paymentMethodLabel(String code) {
    final normalized = normalizePaymentCode(code);
    for (final method in _paymentMethods) {
      if (normalizePaymentCode(method.code) == normalized) {
        return method.displayName;
      }
    }

    switch (normalized) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta';
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'TRANSFER':
        return 'Transferencia';
      default:
        return normalized.isEmpty ? 'Método' : normalized;
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(message),
      ),
    );
  }

  String _money(double value) => 'S/ ${value.toStringAsFixed(2)}';

  String _fmtDate(DateTime d) {
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    final yyyy = d.year.toString();
    return '$dd/$mm/$yyyy';
  }

  InputDecoration _inputDecoration(String label, {String? prefixText}) {
    return InputDecoration(
      labelText: label,
      prefixText: prefixText,
      filled: true,
      fillColor: const Color(0xFFFFFCF7),
      labelStyle: const TextStyle(
        color: _textSoft,
        fontWeight: FontWeight.w700,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _border, width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _gold, width: 1.8),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        foregroundColor: _dark,
        title: const Text(
          'Pagar barbero',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _HeroCard(
            branchName: widget.branchName,
            cashRegisterId: widget.cashRegisterId,
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Selecciona el barbero y rango',
            child: Column(
              children: [
                DropdownButtonFormField<int>(
                  value: _selectedBarberId,
                  decoration: _inputDecoration('Barbero'),
                  dropdownColor: Colors.white,
                  icon: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: _dark,
                  ),
                  style: const TextStyle(
                    color: _dark,
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                  ),
                  items: _barbers.map((b) {
                    return DropdownMenuItem<int>(
                      value: b.id,
                      child: Text(b.nombre),
                    );
                  }).toList(),
                  onChanged: (value) async {
                    setState(() {
                      _selectedBarberId = value;
                      _preview = null;
                    });
                    await _loadPreview();
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _DateButton(
                        label: 'Desde',
                        value: _fmtDate(_from),
                        onTap: _pickFrom,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _DateButton(
                        label: 'Hasta',
                        value: _fmtDate(_to),
                        onTap: _pickTo,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_loadingPreview)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_preview != null)
            _PreviewCard(preview: _preview!, money: _money),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Registrar pago',
            child: Column(
              children: [
                TextFormField(
                  controller: _amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: _handleAmountChanged,
                  style: const TextStyle(
                    color: _dark,
                    fontWeight: FontWeight.w800,
                  ),
                  decoration:
                  _inputDecoration('Monto a pagar', prefixText: 'S/ '),
                ),
                const SizedBox(height: 12),
                _PaymentDistributionCard(
                  splits: _paymentSplits,
                  paymentMethodItems: _paymentMethodItems,
                  inputDecoration: _inputDecoration,
                  money: _money,
                  amountToPay: _currentAmountToPay(),
                  totalDistributed: _paymentsTotal(),
                  remaining: _remainingToDistribute(),
                  paymentMethodLabel: _paymentMethodLabel,
                  onAdd: _addPaymentSplit,
                  onRemove: _removePaymentSplit,
                  onChanged: () => setState(() {}),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _noteCtrl,
                  maxLines: 4,
                  style: const TextStyle(
                    color: _dark,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: _inputDecoration('Observación'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 56,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: const LinearGradient(
                  colors: [_dark, _dark2],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.18),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _saving ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  disabledBackgroundColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: Text(
                  _saving ? 'Registrando pago...' : 'Confirmar pago',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


class _PaymentDistributionCard extends StatelessWidget {
  final List<_PaymentSplitDraft> splits;
  final List<DropdownMenuItem<String>> paymentMethodItems;
  final InputDecoration Function(String label, {String? prefixText}) inputDecoration;
  final String Function(double value) money;
  final double amountToPay;
  final double totalDistributed;
  final double remaining;
  final String Function(String code) paymentMethodLabel;
  final VoidCallback onAdd;
  final void Function(int index) onRemove;
  final VoidCallback onChanged;

  const _PaymentDistributionCard({
    required this.splits,
    required this.paymentMethodItems,
    required this.inputDecoration,
    required this.money,
    required this.amountToPay,
    required this.totalDistributed,
    required this.remaining,
    required this.paymentMethodLabel,
    required this.onAdd,
    required this.onRemove,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final ok = remaining.abs() <= 0.009 && amountToPay > 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE7DCC8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Distribuir por método de pago',
                      style: TextStyle(
                        color: _OwnerBarberPaymentScreenState._dark,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Puedes pagar una parte en efectivo y otra en Yape, Plin o tarjeta.',
                      style: TextStyle(
                        color: _OwnerBarberPaymentScreenState._textSoft,
                        fontSize: 12.2,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              IconButton.filledTonal(
                onPressed: onAdd,
                icon: const Icon(Icons.add_rounded),
                tooltip: 'Agregar método',
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...List.generate(splits.length, (index) {
            final split = splits[index];

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE7DCC8)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Método ${index + 1}',
                          style: const TextStyle(
                            color: _OwnerBarberPaymentScreenState._textSoft,
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      if (splits.length > 1)
                        IconButton(
                          onPressed: () => onRemove(index),
                          icon: const Icon(Icons.delete_outline_rounded),
                          color: Colors.redAccent,
                          tooltip: 'Quitar',
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: split.method,
                    decoration: inputDecoration('Método'),
                    dropdownColor: Colors.white,
                    icon: const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: _OwnerBarberPaymentScreenState._dark,
                    ),
                    style: const TextStyle(
                      color: _OwnerBarberPaymentScreenState._dark,
                      fontSize: 15.5,
                      fontWeight: FontWeight.w800,
                    ),
                    items: paymentMethodItems,
                    onChanged: (value) {
                      if (value == null) return;
                      split.method = value;
                      onChanged();
                    },
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: split.amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => onChanged(),
                    style: const TextStyle(
                      color: _OwnerBarberPaymentScreenState._dark,
                      fontWeight: FontWeight.w800,
                    ),
                    decoration: inputDecoration('Monto', prefixText: 'S/ '),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _PaymentSummaryPill(
                  label: 'Monto a pagar',
                  value: money(amountToPay),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _PaymentSummaryPill(
                  label: 'Distribuido',
                  value: money(totalDistributed),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: ok ? const Color(0xFFEAFBF1) : const Color(0xFFFFF4D6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: ok ? const Color(0xFFB9F2D0) : const Color(0xFFE7C86F),
              ),
            ),
            child: Text(
              ok
                  ? 'Listo: la distribución coincide con el monto a pagar.'
                  : remaining >= 0
                      ? 'Falta distribuir ${money(remaining.abs())}.'
                      : 'Hay un exceso de ${money(remaining.abs())}.',
              style: TextStyle(
                color: ok ? const Color(0xFF166534) : const Color(0xFF7A5A22),
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentSummaryPill extends StatelessWidget {
  final String label;
  final String value;

  const _PaymentSummaryPill({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7DCC8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: _OwnerBarberPaymentScreenState._textSoft,
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: _OwnerBarberPaymentScreenState._dark,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final String branchName;
  final int cashRegisterId;

  const _HeroCard({
    required this.branchName,
    required this.cashRegisterId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF17131E), Color(0xFF2A2137)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.14),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF2C7),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.payments_rounded,
              color: Color(0xFF6A5312),
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  branchName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Caja activa #$cashRegisterId · Pago asistido de barbero',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _OwnerBarberPaymentScreenState._surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _OwnerBarberPaymentScreenState._border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.045),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: _OwnerBarberPaymentScreenState._dark,
              fontSize: 16.5,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _DateButton extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _DateButton({
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFFFCF7),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _OwnerBarberPaymentScreenState._border,
              width: 1.2,
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_month_rounded,
                color: Color(0xFF7A5A22),
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: '$label: ',
                        style: const TextStyle(
                          color: _OwnerBarberPaymentScreenState._textSoft,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      TextSpan(
                        text: value,
                        style: const TextStyle(
                          color: _OwnerBarberPaymentScreenState._dark,
                          fontWeight: FontWeight.w900,
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PreviewCard extends StatelessWidget {
  final BarberPaymentPreviewModel preview;
  final String Function(double) money;

  const _PreviewCard({
    required this.preview,
    required this.money,
  });

  @override
  Widget build(BuildContext context) {
    final isSalary = preview.paymentMode == 'SALARY';
    final serviceCommission = preview.serviceCommissionAmount;
    final productCommission = preview.productCommissionAmount;
    final tips = preview.tipsAmount;
    final generatedTotal = preview.grossAmount > 0
        ? preview.grossAmount
        : (isSalary
        ? preview.salaryAmount + productCommission + tips
        : serviceCommission + productCommission + tips);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE7DCC8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF4D6),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: Color(0xFF7A5A22),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      preview.barberName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF17131E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isSalary
                          ? 'Resumen inteligente · Sueldo fijo'
                          : 'Resumen inteligente · Comisión',
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF7B746C),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!isSalary) ...[
            _previewRow('Ventas servicios', money(preview.baseSales)),
            _previewRow(
              'Porcentaje servicios',
              '${preview.percentageApplied.toStringAsFixed(2)}%',
            ),
            _previewRow('Comisión servicios', money(serviceCommission)),
          ] else ...[
            _previewRow('Sueldo del periodo', money(preview.salaryAmount)),
          ],
          if (productCommission > 0)
            _previewRow('Comisión productos', money(productCommission)),
          if (tips > 0)
            _previewRow('Propinas', money(tips)),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(color: Color(0xFFE8DEC7), height: 1),
          ),
          _previewRow('Total generado', money(generatedTotal), strong: true),
          const SizedBox(height: 4),
          _previewRow('Adelantos', money(preview.advancesApplied)),
          _previewRow('Pagos previos', money(preview.previousPaymentsApplied)),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: Color(0xFFE8DEC7), height: 1),
          ),
          _previewRow(
            'Pendiente actual',
            money(preview.pendingAmount),
            strong: true,
            highlight: true,
          ),
        ],
      ),
    );
  }

  Widget _previewRow(
      String label,
      String value, {
        bool strong = false,
        bool highlight = false,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: strong ? const Color(0xFF17131E) : const Color(0xFF5F5952),
                fontWeight: strong ? FontWeight.w900 : FontWeight.w700,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: highlight
                  ? const Color(0xFF7A5A22)
                  : const Color(0xFF17131E),
              fontWeight: strong ? FontWeight.w900 : FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
