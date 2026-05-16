import 'dart:async';

import 'package:flutter/material.dart';
import '../../model/owner_cash_models.dart';
import '../../services/owner_cash_service.dart';
import '../../services/session_service.dart';
import 'owner_barber_payment_screen.dart';
import 'owner_cash_sale_create_screen.dart';
import 'owner_close_cash_screen.dart';
import 'owner_open_cash_screen.dart';
import 'owner_cash_movement_sheet.dart';
import 'owner_cash_history_screen.dart';

class OwnerCashScreen extends StatefulWidget {
  const OwnerCashScreen({super.key});

  @override
  State<OwnerCashScreen> createState() => _OwnerCashScreenState();
}

class _OwnerCashScreenState extends State<OwnerCashScreen> {
  final OwnerCashService _service = OwnerCashService();

  List<BranchOptionModel> _branches = [];
  int? _selectedBranchId;

  bool _loading = true;
  bool _navigating = false;
  bool _silentRefreshing = false;
  String? _error;
  CashRegisterModel? _cash;
  List<CashSaleModel> _sales = [];
  List<OwnerPaymentMethodModel> _paymentMethods =
  OwnerPaymentMethodModel.defaultPeruFallback();

  String _sessionRole = '';
  Timer? _autoRefreshTimer;
  DateTime? _lastUpdatedAt;

  bool get _canManageSales => _sessionRole.trim().toUpperCase() == 'OWNER';

  String _normalizePaymentMethod(String method) => normalizePaymentCode(method);

  double _sumSalesByPayment(Set<String> methods) {
    return _sales.fold<double>(0, (sum, sale) {
      final method = _normalizePaymentMethod(sale.metodoPago);
      return methods.contains(method) ? sum + sale.total : sum;
    });
  }

  int _countSalesByPayment(Set<String> methods) {
    return _sales.where((sale) {
      final method = _normalizePaymentMethod(sale.metodoPago);
      return methods.contains(method);
    }).length;
  }

  double get _yapeTotal => _sumSalesByPayment({'YAPE'});
  double get _plinTotal => _sumSalesByPayment({'PLIN'});
  double get _cardTotal => _sumSalesByPayment({'CARD', 'TARJETA', 'VISA', 'MASTERCARD'});

  int get _yapeCount => _countSalesByPayment({'YAPE'});
  int get _plinCount => _countSalesByPayment({'PLIN'});
  int get _cardCount => _countSalesByPayment({'CARD', 'TARJETA', 'VISA', 'MASTERCARD'});

  @override
  void initState() {
    super.initState();
    _boot();

    _autoRefreshTimer = Timer.periodic(
      const Duration(seconds: 10),
          (_) => _silentRefresh(),
    );
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _boot() async {
    final role = await SessionService.getRole();
    debugPrint('SESSION ROLE => $role');

    if (!mounted) return;
    setState(() {
      _sessionRole = (role ?? '').trim().toUpperCase();
    });
    await _initialize();
  }

  String get _selectedBranchName {
    final branchId = _selectedBranchId;
    if (branchId == null) return 'Sede';

    for (final b in _branches) {
      if (b.id == branchId) {
        final name = b.name.trim();
        return name.isEmpty ? 'Sede ${b.id}' : name;
      }
    }
    return 'Sede';
  }

  String _cleanError(Object e) {
    return e.toString().replaceFirst('Exception: ', '').trim();
  }

  bool _isNoOpenCashMessage(String message) {
    final text = message.toLowerCase();
    return text.contains('no hay una caja abierta en esta sede');
  }

  bool _isCashAlreadyClosedMessage(String message) {
    final text = message.toLowerCase();
    return text.contains('la caja ya no está abierta');
  }

  Future<void> _initialize() async {
    if (!mounted) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final branches = await _service.getOwnerBranches();
      final sessionBranchId = await SessionService.getBranchId();

      if (!mounted) return;

      if (branches.isEmpty) {
        setState(() {
          _branches = [];
          _selectedBranchId = null;
          _cash = null;
          _sales = [];
          _error = 'No tienes sedes registradas para este negocio.';
          _loading = false;
        });
        return;
      }

      final selected = _selectedBranchId != null &&
          branches.any((b) => b.id == _selectedBranchId)
          ? _selectedBranchId!
          : sessionBranchId != null && branches.any((b) => b.id == sessionBranchId)
          ? sessionBranchId
          : branches.first.id;

      final selectedBranch = branches.firstWhere(
            (b) => b.id == selected,
        orElse: () => branches.first,
      );

      await SessionService.saveBranch(
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
      );

      if (!mounted) return;

      setState(() {
        _branches = branches;
        _selectedBranchId = selectedBranch.id;
      });

      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _branches = [];
        _selectedBranchId = null;
        _cash = null;
        _sales = [];
        _error = _cleanError(e);
        _loading = false;
      });
    }
  }

  Future<void> _load() async {
    final branchId = _selectedBranchId;
    if (!mounted || branchId == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _service.getCurrentCashRegister(branchId),
        _service.getTodaySales(branchId),
        _service.getOwnerPaymentMethods(branchId),
      ]);

      final cash = results[0] as CashRegisterModel?;
      final sales = results[1] as List<CashSaleModel>;
      final methods = results[2] as List<OwnerPaymentMethodModel>;

      if (!mounted) return;
      setState(() {
        _cash = cash;
        _sales = sales;
        _paymentMethods = methods.isEmpty
            ? OwnerPaymentMethodModel.defaultPeruFallback()
            : methods;
        _error = null;
        _loading = false;
        _lastUpdatedAt = DateTime.now();
      });
    } catch (e) {
      final message = _cleanError(e);

      if (!mounted) return;

      if (_isNoOpenCashMessage(message) || _isCashAlreadyClosedMessage(message)) {
        setState(() {
          _cash = null;
          _sales = [];
          _error = null;
          _loading = false;
          _lastUpdatedAt = DateTime.now();
        });
        return;
      }

      setState(() {
        _cash = null;
        _sales = [];
        _error = message;
        _loading = false;
      });
    }
  }

  Future<void> _silentRefresh() async {
    if (!mounted || _loading || _navigating || _silentRefreshing) return;

    final branchId = _selectedBranchId;
    if (branchId == null) return;

    _silentRefreshing = true;

    try {
      final results = await Future.wait([
        _service.getCurrentCashRegister(branchId),
        _service.getTodaySales(branchId),
        _service.getOwnerPaymentMethods(branchId),
      ]);

      final cash = results[0] as CashRegisterModel?;
      final sales = results[1] as List<CashSaleModel>;
      final methods = results[2] as List<OwnerPaymentMethodModel>;

      if (!mounted) return;

      setState(() {
        _cash = cash;
        _sales = sales;
        _paymentMethods = methods.isEmpty
            ? OwnerPaymentMethodModel.defaultPeruFallback()
            : methods;
        _error = null;
        _lastUpdatedAt = DateTime.now();
      });
    } catch (e) {
      final message = _cleanError(e);

      if (!mounted) return;

      if (_isNoOpenCashMessage(message) || _isCashAlreadyClosedMessage(message)) {
        setState(() {
          _cash = null;
          _sales = [];
          _error = null;
          _lastUpdatedAt = DateTime.now();
        });
      }
    } finally {
      _silentRefreshing = false;
    }
  }

  Future<void> _changeBranch(int value) async {
    if (_selectedBranchId == value || _navigating) return;

    final branch = _branches.firstWhere(
          (b) => b.id == value,
      orElse: () => BranchOptionModel(id: value, name: ''),
    );

    await SessionService.saveBranch(
      branchId: branch.id,
      branchName: branch.name,
    );

    if (!mounted) return;

    setState(() {
      _selectedBranchId = value;
      _cash = null;
      _sales = [];
      _error = null;
      _lastUpdatedAt = null;
    });

    await _load();
  }

  Future<void> _runNavigation(Future<void> Function() action) async {
    if (_navigating) return;

    setState(() {
      _navigating = true;
    });

    try {
      await action();
    } finally {
      if (!mounted) return;
      setState(() {
        _navigating = false;
      });
    }
  }

  Future<void> _goOpenCash() async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    await _runNavigation(() async {
      await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => OwnerOpenCashScreen(
            branchId: branchId,
            branchName: _selectedBranchName,
          ),
        ),
      );

      if (!mounted) return;
      await _load();
    });
  }

  Future<void> _goCloseCash() async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    await _runNavigation(() async {
      await _load();

      if (!mounted) return;

      if (_cash == null) {
        _showInfo('La caja ya no está abierta en esta sede.');
        return;
      }

      await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => OwnerCloseCashScreen(
            cashRegister: _cash!,
            branchId: branchId,
            branchName: _selectedBranchName,
          ),
        ),
      );

      if (!mounted) return;
      await _load();
    });
  }

  Future<void> _goNewSale() async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    await _runNavigation(() async {
      await _load();

      if (!mounted) return;

      if (_cash == null) {
        _showInfo('Primero abre una caja en esta sede.');
        return;
      }

      await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => OwnerCashSaleCreateScreen(
            branchId: branchId,
            branchName: _selectedBranchName,
          ),
        ),
      );

      if (!mounted) return;
      await _load();
    });
  }

  Future<void> _showMovementSheet({CashMovementModel? movement}) async {
    final branchId = _selectedBranchId;
    final cash = _cash;
    if (branchId == null || cash == null) {
      _showInfo('Primero abre una caja en esta sede.');
      return;
    }

    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => OwnerCashMovementSheet(
        branchId: branchId,
        branchName: _selectedBranchName,
        cashRegisterId: cash.id,
        initialMovement: movement,
      ),
    );

    if (changed == true && mounted) {
      _showInfo(movement == null
          ? 'Movimiento registrado correctamente.'
          : 'Movimiento actualizado correctamente.');
      await _load();
    }
  }

  Future<void> _handleDeleteMovement(CashMovementModel movement) async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar movimiento'),
        content: Text(
          '¿Seguro que deseas eliminar "${movement.concept}"?\n\nEsta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _service.deleteCashMovement(
        branchId: branchId,
        movementId: movement.id,
      );
      if (!mounted) return;
      _showInfo('Movimiento eliminado correctamente.');
      await _load();
    } catch (e) {
      if (!mounted) return;
      _showInfo(_cleanError(e));
    }
  }

  void _showInfo(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(message),
      ),
    );
  }

  Future<void> _handleEditSale(CashSaleModel sale) async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    final metodoCtrl = TextEditingController(text: sale.metodoPago);
    final subtotalCtrl = TextEditingController(text: sale.subtotal.toStringAsFixed(2));
    final discountCtrl = TextEditingController(text: sale.discount.toStringAsFixed(2));
    final totalCtrl = TextEditingController(text: sale.total.toStringAsFixed(2));
    final cashReceivedCtrl = TextEditingController(text: sale.cashReceived.toStringAsFixed(2));
    final changeCtrl = TextEditingController(text: sale.changeAmount.toStringAsFixed(2));

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Editar venta'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: metodoCtrl, decoration: const InputDecoration(labelText: 'Método de pago')),
              TextField(controller: subtotalCtrl, decoration: const InputDecoration(labelText: 'Subtotal')),
              TextField(controller: discountCtrl, decoration: const InputDecoration(labelText: 'Descuento')),
              TextField(controller: totalCtrl, decoration: const InputDecoration(labelText: 'Total')),
              TextField(controller: cashReceivedCtrl, decoration: const InputDecoration(labelText: 'Recibido')),
              TextField(controller: changeCtrl, decoration: const InputDecoration(labelText: 'Vuelto')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Guardar')),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _service.updateSale(
        branchId: branchId,
        saleId: sale.saleId,
        metodoPago: metodoCtrl.text.trim(),
        subtotal: double.tryParse(subtotalCtrl.text.trim()) ?? sale.subtotal,
        discount: double.tryParse(discountCtrl.text.trim()) ?? sale.discount,
        total: double.tryParse(totalCtrl.text.trim()) ?? sale.total,
        cashReceived: double.tryParse(cashReceivedCtrl.text.trim()) ?? sale.cashReceived,
        changeAmount: double.tryParse(changeCtrl.text.trim()) ?? sale.changeAmount,
        customerId: sale.customerId,
      );

      if (!mounted) return;
      _showInfo('Venta actualizada correctamente.');
      await _load();
    } catch (e) {
      if (!mounted) return;
      _showInfo(_cleanError(e));
    }
  }

  Future<void> _handleDeleteSale(CashSaleModel sale) async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar venta'),
        content: const Text(
          '¿Seguro que deseas eliminar esta venta?\n\nEsta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _service.deleteSale(branchId: branchId, saleId: sale.saleId);

      if (!mounted) return;
      _showInfo('Venta eliminada correctamente.');
      await _load();
    } catch (e) {
      if (!mounted) return;
      _showInfo(_cleanError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    const gold = Color(0xFFD4AF37);
    const bg = Color(0xFFF6F3ED);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        title: const Text('Caja'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.6,
        actions: [
          IconButton(
            tooltip: 'Actualizar',
            onPressed: _loading || _navigating ? null : _load,
            icon: const Icon(Icons.sync_rounded),
          ),
          IconButton(
            tooltip: 'Historial',
            onPressed: _goCashHistory,
            icon: const Icon(Icons.history_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _initialize,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            if (_branches.isNotEmpty) ...[
              _BranchSelectorCard(
                branches: _branches,
                selectedBranchId: _selectedBranchId ?? _branches.first.id,
                onChanged: _navigating ? (_) {} : _changeBranch,
              ),
              const SizedBox(height: 12),
            ],
            _ErrorCard(message: _error!, onRetry: _initialize),
          ],
        )
            : _branches.isEmpty
            ? ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            _ErrorCard(
              message: 'No tienes sedes registradas para este negocio.',
              onRetry: _initialize,
            ),
          ],
        )
            : ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            _BranchSelectorCard(
              branches: _branches,
              selectedBranchId: _selectedBranchId ?? _branches.first.id,
              onChanged: _navigating ? (_) {} : _changeBranch,
            ),
            const SizedBox(height: 10),
            _LiveSyncChip(
              lastUpdatedAt: _lastUpdatedAt,
              refreshing: _silentRefreshing,
            ),
            const SizedBox(height: 14),
            _CashHeaderCard(cash: _cash, gold: gold, branchName: _selectedBranchName),
            const SizedBox(height: 14),
            _ActionGrid(
              cashOpened: _cash != null,
              busy: _navigating,
              onOpen: _goOpenCash,
              onClose: _goCloseCash,
              onSale: _goNewSale,
              onMovement: () => _showMovementSheet(),
              onBarberPayment: _goBarberPayment,
            ),
            const SizedBox(height: 18),
            if (_cash != null) ...[
              _SummarySection(cash: _cash!, gold: gold),
              const SizedBox(height: 12),
              _PaymentMethodBalancesCard(
                balances: _cash!.paymentMethodBalances.isNotEmpty
                    ? _cash!.paymentMethodBalances
                    : _cash!.paymentMethodsSummary,
                paymentMethods: _paymentMethods,
              ),
              const SizedBox(height: 18),
              _MovementSection(
                cash: _cash!,
                onAdd: () => _showMovementSheet(),
                onEdit: (movement) => _showMovementSheet(movement: movement),
                onDelete: _handleDeleteMovement,
              ),
              const SizedBox(height: 18),
              _SalesSection(
                sales: _sales,
                canManageSales: _canManageSales,
                onEditSale: _handleEditSale,
                onDeleteSale: _handleDeleteSale,
              ),
            ] else
              _EmptyCashSection(onOpen: _goOpenCash, branchName: _selectedBranchName),
          ],
        ),
      ),
    );
  }

  Future<void> _goCashHistory() async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OwnerCashHistoryScreen(
          branchId: branchId,
          branchName: _selectedBranchName,
        ),
      ),
    );

    if (!mounted) return;
    await _load();
  }

  Future<void> _goBarberPayment() async {
    final branchId = _selectedBranchId;
    if (branchId == null) return;

    await _runNavigation(() async {
      await _load();

      if (!mounted) return;

      if (_cash == null) {
        _showInfo('Primero abre una caja en esta sede.');
        return;
      }

      await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => OwnerBarberPaymentScreen(
            branchId: branchId,
            branchName: _selectedBranchName,
            cashRegisterId: _cash!.id,
          ),
        ),
      );

      if (!mounted) return;
      await _load();
    });
  }
}

class _LiveSyncChip extends StatelessWidget {
  final DateTime? lastUpdatedAt;
  final bool refreshing;

  const _LiveSyncChip({
    required this.lastUpdatedAt,
    required this.refreshing,
  });

  String _timeText() {
    final date = lastUpdatedAt;
    if (date == null) return 'Sincronizando';

    final hh = date.hour.toString().padLeft(2, '0');
    final mm = date.minute.toString().padLeft(2, '0');
    return 'Actualizado $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFEFFDF4),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFBBF7D0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: Color(0xFF16A34A),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 7),
              Text(
                'En vivo · ${refreshing ? 'Actualizando' : _timeText()}',
                style: const TextStyle(
                  color: Color(0xFF15803D),
                  fontWeight: FontWeight.w900,
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _BranchSelectorCard extends StatelessWidget {
  final List<BranchOptionModel> branches;
  final int selectedBranchId;
  final ValueChanged<int> onChanged;

  const _BranchSelectorCard({
    required this.branches,
    required this.selectedBranchId,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final selected = branches.firstWhere(
          (b) => b.id == selectedBranchId,
      orElse: () => BranchOptionModel(id: 0, name: 'Sede'),
    );

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEBDFAF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sede activa',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF9C8E6A),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F4EA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.storefront_outlined, color: Color(0xFF8B7A4E), size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  selected.name.trim().isEmpty ? 'Sede ${selected.id}' : selected.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1A1A1A),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              PopupMenuButton<int>(
                tooltip: 'Cambiar sede',
                onSelected: onChanged,
                itemBuilder: (_) => branches
                    .map(
                      (b) => PopupMenuItem<int>(
                    value: b.id,
                    child: Row(
                      children: [
                        Icon(
                          b.id == selectedBranchId ? Icons.check_circle_rounded : Icons.store_mall_directory_outlined,
                          size: 18,
                          color: b.id == selectedBranchId ? const Color(0xFFD4AF37) : const Color(0xFF667085),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            b.name.trim().isEmpty ? 'Sede ${b.id}' : b.name,
                            style: TextStyle(
                              fontWeight: b.id == selectedBranchId ? FontWeight.w800 : FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                    .toList(),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F4EA),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEBDFAF)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Cambiar',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF6B5B2A)),
                      ),
                      SizedBox(width: 6),
                      Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Color(0xFF6B5B2A)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CashHeaderCard extends StatelessWidget {
  final CashRegisterModel? cash;
  final Color gold;
  final String branchName;

  const _CashHeaderCard({
    required this.cash,
    required this.gold,
    required this.branchName,
  });

  @override
  Widget build(BuildContext context) {
    final isOpen = cash != null;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: isOpen ? [const Color(0xFF1F1A10), const Color(0xFF3A2F14)] : [const Color(0xFF3B3B3B), const Color(0xFF5A5A5A)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.10),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: gold,
            child: Icon(isOpen ? Icons.point_of_sale_rounded : Icons.lock_clock_rounded, color: Colors.black87),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOpen ? 'Caja abierta · $branchName' : 'Caja cerrada · $branchName',
                  style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  isOpen
                      ? 'Responsable: ${cash!.assignedUserName ?? cash!.openedByUserName ?? 'No asignado'}'
                      : 'Abre la caja para comenzar a cobrar en esta sede',
                  style: const TextStyle(color: Colors.white70, fontSize: 13.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionGrid extends StatelessWidget {
  final bool cashOpened;
  final bool busy;
  final VoidCallback onOpen;
  final VoidCallback onClose;
  final VoidCallback onSale;
  final VoidCallback onMovement;
  final VoidCallback onBarberPayment;

  const _ActionGrid({
    required this.cashOpened,
    required this.busy,
    required this.onOpen,
    required this.onClose,
    required this.onSale,
    required this.onMovement,
    required this.onBarberPayment,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        SizedBox(width: (MediaQuery.of(context).size.width - 42) / 2, child: _ActionButton(icon: Icons.lock_open_rounded, label: 'Abrir caja', enabled: !cashOpened && !busy, onTap: onOpen)),
        SizedBox(width: (MediaQuery.of(context).size.width - 42) / 2, child: _ActionButton(icon: Icons.add_shopping_cart_rounded, label: 'Nueva venta', enabled: cashOpened && !busy, onTap: onSale)),
        SizedBox(width: (MediaQuery.of(context).size.width - 42) / 2, child: _ActionButton(icon: Icons.receipt_long_rounded, label: 'Registrar movimiento', enabled: cashOpened && !busy, onTap: onMovement)),
        SizedBox(width: (MediaQuery.of(context).size.width - 42) / 2, child: _ActionButton(icon: Icons.task_alt_rounded, label: 'Cerrar caja', enabled: cashOpened && !busy, onTap: onClose)),
        SizedBox(width: (MediaQuery.of(context).size.width - 42) / 2, child: _ActionButton(icon: Icons.payments_rounded, label: 'Pagar barbero', enabled: cashOpened && !busy, onTap: onBarberPayment)),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const gold = Color(0xFFD4AF37);
    const border = Color(0xFFE8DEC7);

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: enabled ? const LinearGradient(colors: [Color(0xFF17131E), Color(0xFF2A2137)]) : null,
          color: enabled ? null : Colors.white,
          border: Border.all(color: enabled ? Colors.transparent : border),
          boxShadow: enabled
              ? [
            BoxShadow(color: Colors.black.withOpacity(0.10), blurRadius: 16, offset: const Offset(0, 7)),
          ]
              : [],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: enabled ? gold : const Color(0xFFB7B0BC), size: 22),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: enabled ? Colors.white : const Color(0xFFB7B0BC)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummarySection extends StatelessWidget {
  final CashRegisterModel cash;
  final Color gold;

  const _SummarySection({
    required this.cash,
    required this.gold,
  });

  @override
  Widget build(BuildContext context) {
    final expected = cash.closingAmountExpected;
    final isNegative = expected < 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (isNegative) ...[
          _NegativeCashAlert(
            cashSalesTotal: cash.cashSalesTotal,
            movementsExpense: cash.movementsExpense,
            expected: cash.closingAmountExpected,
          ),
          const SizedBox(height: 10),
        ],

        _CashQuickOverviewCard(
          expected: cash.closingAmountExpected,
          openingAmount: cash.openingAmount,
          cashSalesTotal: cash.cashSalesTotal,
          movementsIncome: cash.movementsIncome,
          movementsExpense: cash.movementsExpense,
          isNegative: isNegative,
        ),

        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: _CompactMetricCard(
                title: 'Ventas efectivo',
                value: 'S/ ${cash.cashSalesTotal.toStringAsFixed(2)}',
                icon: Icons.payments_rounded,
                valueColor: const Color(0xFF15803D),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _CompactMetricCard(
                title: 'Ingresos',
                value: 'S/ ${cash.movementsIncome.toStringAsFixed(2)}',
                icon: Icons.add_circle_outline_rounded,
                valueColor: const Color(0xFF15803D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _CompactMetricCard(
                title: 'Salidas',
                value: 'S/ ${cash.movementsExpense.toStringAsFixed(2)}',
                icon: Icons.remove_circle_outline_rounded,
                valueColor: const Color(0xFFC2410C),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _CompactMetricCard(
                title: 'Apertura',
                value: 'S/ ${cash.openingAmount.toStringAsFixed(2)}',
                icon: Icons.lock_open_rounded,
              ),
            ),
          ],
        ),

        const SizedBox(height: 10),

        _CashDetailsExpansion(cash: cash),
      ],
    );
  }
}

class _CashQuickOverviewCard extends StatelessWidget {
  final double expected;
  final double openingAmount;
  final double cashSalesTotal;
  final double movementsIncome;
  final double movementsExpense;
  final bool isNegative;

  const _CashQuickOverviewCard({
    required this.expected,
    required this.openingAmount,
    required this.cashSalesTotal,
    required this.movementsIncome,
    required this.movementsExpense,
    required this.isNegative,
  });

  @override
  Widget build(BuildContext context) {
    final expectedColor = isNegative
        ? const Color(0xFFFCA5A5)
        : const Color(0xFF86EFAC);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0F172A),
            Color(0xFF17131E),
            Color(0xFF241B2F),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.10),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.10),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  isNegative
                      ? Icons.warning_amber_rounded
                      : Icons.account_balance_wallet_rounded,
                  color: isNegative
                      ? const Color(0xFFFCA5A5)
                      : const Color(0xFFD4AF37),
                  size: 21,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Resumen rápido',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Caja física esperada ahora',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Color(0xFFCBD5E1),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'S/ ${expected.toStringAsFixed(2)}',
                style: TextStyle(
                  color: expectedColor,
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Text(
              'Apertura S/ ${openingAmount.toStringAsFixed(2)} + ventas efectivo S/ ${cashSalesTotal.toStringAsFixed(2)} + ingresos S/ ${movementsIncome.toStringAsFixed(2)} - salidas S/ ${movementsExpense.toStringAsFixed(2)}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFFE5E7EB),
                fontSize: 11.7,
                fontWeight: FontWeight.w800,
                height: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color? valueColor;

  const _CompactMetricCard({
    required this.title,
    required this.value,
    required this.icon,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF0E7D3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.035),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFFF8F4EA),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF8B7A4E),
              size: 18,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11.2,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF7A7282),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13.8,
                    fontWeight: FontWeight.w900,
                    color: valueColor ?? const Color(0xFF17131E),
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

class _CashDetailsExpansion extends StatelessWidget {
  final CashRegisterModel cash;

  const _CashDetailsExpansion({required this.cash});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF0E7D3)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          iconColor: const Color(0xFF17131E),
          collapsedIconColor: const Color(0xFF7A7282),
          title: const Text(
            'Ver desglose de salidas',
            style: TextStyle(
              fontSize: 12.8,
              fontWeight: FontWeight.w900,
              color: Color(0xFF17131E),
            ),
          ),
          subtitle: const Text(
            'Gastos, adelantos y pagos a barberos',
            style: TextStyle(
              fontSize: 11.3,
              fontWeight: FontWeight.w700,
              color: Color(0xFF7A7282),
            ),
          ),
          children: [
            Row(
              children: [
                Expanded(
                  child: _CompactBreakdownPill(
                    label: 'Gastos',
                    value: cash.movementsExpenseGeneral,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CompactBreakdownPill(
                    label: 'Adelantos',
                    value: cash.movementsAdvanceBarber,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _CompactBreakdownPill(
                    label: 'Pago barbero',
                    value: cash.movementsPaymentBarber,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CompactBreakdownPill(
                    label: 'Caja esperada',
                    value: cash.closingAmountExpected,
                    isExpected: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactBreakdownPill extends StatelessWidget {
  final String label;
  final double value;
  final bool isExpected;

  const _CompactBreakdownPill({
    required this.label,
    required this.value,
    this.isExpected = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isExpected
        ? (value < 0 ? const Color(0xFFB91C1C) : const Color(0xFF17131E))
        : const Color(0xFFC2410C);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isExpected ? const Color(0xFFFFFBEB) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isExpected ? const Color(0xFFFDE68A) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF7A7282),
              fontSize: 10.8,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'S/ ${value.toStringAsFixed(2)}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: color,
              fontSize: 12.8,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _NegativeCashAlert extends StatelessWidget {
  final double cashSalesTotal;
  final double movementsExpense;
  final double expected;

  const _NegativeCashAlert({
    required this.cashSalesTotal,
    required this.movementsExpense,
    required this.expected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: Color(0xFFB91C1C),
            size: 24,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Caja física esperada en negativo',
                  style: TextStyle(
                    color: Color(0xFF991B1B),
                    fontSize: 14.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Las salidas registradas superan el efectivo disponible. Revisa pagos a barberos, adelantos o gastos con método incorrecto.',
                  style: TextStyle(
                    color: Color(0xFFB91C1C),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'S/ ${cashSalesTotal.toStringAsFixed(2)} - S/ ${movementsExpense.toStringAsFixed(2)} = S/ ${expected.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Color(0xFF7F1D1D),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w900,
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

class _PaymentMethodBalancesCard extends StatelessWidget {
  final List<PaymentMethodSummaryModel> balances;
  final List<OwnerPaymentMethodModel> paymentMethods;

  const _PaymentMethodBalancesCard({
    required this.balances,
    required this.paymentMethods,
  });

  String _normalize(String value) => normalizePaymentCode(value);

  bool _isCash(String code) {
    final value = _normalize(code);
    return value == 'CASH' || value == 'EFECTIVO';
  }

  bool _isFree(String code) {
    final value = _normalize(code);
    return value == 'FREE' || value == 'GRATIS';
  }

  String _label(String code) {
    final normalized = _normalize(code);
    for (final method in paymentMethods) {
      if (_normalize(method.code) == normalized && method.displayName.trim().isNotEmpty) {
        return method.displayName.trim();
      }
    }

    switch (normalized) {
      case 'CASH':
      case 'EFECTIVO':
        return 'Efectivo';
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'TRANSFER':
      case 'TRANSFERENCIA':
        return 'Transferencia';
      case 'CARD':
      case 'TARJETA':
        return 'Tarjeta';
      case 'NEQUI':
        return 'Nequi';
      case 'DAVIPLATA':
        return 'Daviplata';
      case 'PAGO_MOVIL':
        return 'Pago móvil';
      case 'ZELLE':
        return 'Zelle';
      case 'QR':
        return 'QR';
      default:
        final clean = code.trim();
        if (clean.isEmpty) return 'Otro';
        return clean[0].toUpperCase() + clean.substring(1).toLowerCase();
    }
  }

  IconData _icon(String code) {
    switch (_normalize(code)) {
      case 'YAPE':
        return Icons.phone_iphone_rounded;
      case 'PLIN':
        return Icons.bolt_rounded;
      case 'TRANSFER':
      case 'TRANSFERENCIA':
        return Icons.account_balance_rounded;
      case 'CARD':
      case 'TARJETA':
        return Icons.credit_card_rounded;
      case 'NEQUI':
      case 'DAVIPLATA':
      case 'PAGO_MOVIL':
        return Icons.account_balance_wallet_rounded;
      case 'ZELLE':
        return Icons.public_rounded;
      case 'QR':
        return Icons.qr_code_2_rounded;
      default:
        return Icons.account_balance_wallet_rounded;
    }
  }

  Color _accent(String code) {
    switch (_normalize(code)) {
      case 'YAPE':
        return const Color(0xFF8B5CF6);
      case 'PLIN':
        return const Color(0xFF38BDF8);
      case 'TRANSFER':
      case 'TRANSFERENCIA':
        return const Color(0xFF60A5FA);
      case 'CARD':
      case 'TARJETA':
        return const Color(0xFFD4AF37);
      case 'NEQUI':
      case 'DAVIPLATA':
      case 'PAGO_MOVIL':
        return const Color(0xFF34D399);
      case 'ZELLE':
        return const Color(0xFFA78BFA);
      case 'QR':
        return const Color(0xFFFBBF24);
      default:
        return const Color(0xFFCBD5E1);
    }
  }

  String _money(double value) => 'S/ ${value.toStringAsFixed(2)}';

  List<PaymentMethodSummaryModel> _visibleBalances() {
    final map = <String, PaymentMethodSummaryModel>{};

    // 1) Mostrar los métodos configurados del dueño/sede aunque estén en S/ 0.00.
    final configuredCodes = paymentMethods
        .map((method) => _normalize(method.code))
        .where((code) => code.isNotEmpty && !_isCash(code) && !_isFree(code))
        .toList();

    for (final code in configuredCodes) {
      map[code] = PaymentMethodSummaryModel(
        paymentMethod: code,
        count: 0,
        totalAmount: 0,
      );
    }

    // 2) Sobrescribir/sumar los saldos reales que vienen del backend.
    for (final item in balances) {
      final code = _normalize(item.paymentMethod);
      if (code.isEmpty || _isCash(code) || _isFree(code)) continue;

      final normalizedCode = code == 'TRANSFERENCIA'
          ? 'TRANSFER'
          : code == 'TARJETA'
          ? 'CARD'
          : code;

      final current = map[normalizedCode];

      final mergedAmount = (current?.totalAmount ?? 0) + item.totalAmount;
      final mergedCount = (current?.count ?? 0) + item.count;

      map[normalizedCode] = PaymentMethodSummaryModel(
        paymentMethod: normalizedCode,
        count: mergedCount,
        totalAmount: mergedAmount.abs() < 0.01 ? 0 : mergedAmount,
      );
    }

    final order = [
      'YAPE',
      'PLIN',
      'TRANSFER',
      'CARD',
      'NEQUI',
      'DAVIPLATA',
      'PAGO_MOVIL',
      'ZELLE',
      'QR',
    ];

    final result = map.values.toList();
    result.sort((a, b) {
      final ai = order.indexOf(_normalize(a.paymentMethod));
      final bi = order.indexOf(_normalize(b.paymentMethod));
      final av = ai == -1 ? 999 : ai;
      final bv = bi == -1 ? 999 : bi;
      if (av != bv) return av.compareTo(bv);
      return _label(a.paymentMethod).compareTo(_label(b.paymentMethod));
    });

    return result;
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visibleBalances();
    final total = visible.fold<double>(0, (sum, item) => sum + item.totalAmount);
    final operations = visible.fold<int>(0, (sum, item) => sum + item.count);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF151827), Color(0xFF221A2F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.10),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.10),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.account_balance_wallet_rounded,
                  color: Color(0xFFD4AF37),
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Saldo actual por método',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Después de ventas, ingresos, salidas y traslados',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFCBD5E1),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                _money(total),
                style: const TextStyle(
                  color: Color(0xFF86EFAC),
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (visible.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: const Text(
                'Cuando tengas saldos en métodos digitales configurados, aparecerán aquí.',
                style: TextStyle(
                  color: Color(0xFFCBD5E1),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                ),
              ),
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final itemWidth = visible.length == 1
                    ? constraints.maxWidth
                    : (constraints.maxWidth - 8) / 2;

                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: visible
                      .map(
                        (item) => SizedBox(
                      width: itemWidth,
                      child: _PaymentBalancePill(
                        label: _label(item.paymentMethod),
                        value: _money(item.totalAmount),
                        rawValue: item.totalAmount,
                        count: item.count,
                        icon: _icon(item.paymentMethod),
                        accent: _accent(item.paymentMethod),
                      ),
                    ),
                  )
                      .toList(),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _PaymentBalancePill extends StatelessWidget {
  final String label;
  final String value;
  final double rawValue;
  final int count;
  final IconData icon;
  final Color accent;

  const _PaymentBalancePill({
    required this.label,
    required this.value,
    required this.rawValue,
    required this.count,
    required this.icon,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveAccent = rawValue < 0 ? const Color(0xFFFCA5A5) : accent;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: effectiveAccent, size: 17),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFFE5E7EB),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              maxLines: 1,
              style: TextStyle(
                color: effectiveAccent,
                fontSize: 14.5,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            '$count venta${count == 1 ? '' : 's'}',
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MovementSection extends StatelessWidget {
  final CashRegisterModel cash;
  final VoidCallback onAdd;
  final ValueChanged<CashMovementModel> onEdit;
  final ValueChanged<CashMovementModel> onDelete;

  const _MovementSection({required this.cash, required this.onAdd, required this.onEdit, required this.onDelete});

  IconData _iconForType(String type) {
    switch (type) {
      case 'INCOME':
        return Icons.add_card_rounded;
      case 'PAYMENT_METHOD_TRANSFER':
        return Icons.swap_horiz_rounded;
      case 'ADVANCE_BARBER':
        return Icons.front_hand_rounded;
      case 'PAYMENT_BARBER':
        return Icons.content_cut_rounded;
      default:
        return Icons.receipt_long_rounded;
    }
  }

  Color _chipColor(String type) {
    switch (type) {
      case 'INCOME':
        return const Color(0xFF15803D);
      case 'PAYMENT_METHOD_TRANSFER':
        return const Color(0xFF2563EB);
      case 'ADVANCE_BARBER':
        return const Color(0xFF7C3AED);
      case 'PAYMENT_BARBER':
        return const Color(0xFF0F766E);
      default:
        return const Color(0xFFC2410C);
    }
  }

  String _labelForType(String type) {
    switch (type) {
      case 'INCOME':
        return 'Ingreso';
      case 'PAYMENT_METHOD_TRANSFER':
        return 'Traslado';
      case 'ADVANCE_BARBER':
        return 'Adelanto';
      case 'PAYMENT_BARBER':
        return 'Pago barbero';
      default:
        return 'Gasto';
    }
  }

  String _methodLabel(String? code) {
    switch ((code ?? '').trim().toUpperCase()) {
      case 'CASH':
      case 'EFECTIVO':
        return 'Efectivo';
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'TRANSFER':
      case 'TRANSFERENCIA':
        return 'Transferencia';
      case 'CARD':
      case 'TARJETA':
        return 'Tarjeta';
      case 'NEQUI':
        return 'Nequi';
      case 'DAVIPLATA':
        return 'Daviplata';
      case 'PAGO_MOVIL':
        return 'Pago móvil';
      case 'ZELLE':
        return 'Zelle';
      case 'QR':
        return 'QR';
      default:
        final clean = (code ?? '').trim();
        if (clean.isEmpty) return 'Método';
        return clean[0].toUpperCase() + clean.substring(1).toLowerCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final movements = cash.movements;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(child: Text('Gastos, ingresos y salidas de caja', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF17131E)))),
            TextButton.icon(onPressed: onAdd, icon: const Icon(Icons.add_rounded), label: const Text('Registrar')),
          ],
        ),
        const SizedBox(height: 12),
        if (movements.isEmpty)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF0E7D3))),
            child: const Row(
              children: [
                Icon(Icons.inventory_2_outlined, color: Color(0xFFB4ACB9)),
                SizedBox(width: 10),
                Expanded(child: Text('Aún no registraste ingresos, gastos ni pagos de caja hoy.', style: TextStyle(color: Color(0xFF6E6676), fontSize: 13.5, fontWeight: FontWeight.w600))),
              ],
            ),
          )
        else
          ...movements.map((movement) {
            final color = _chipColor(movement.type);
            final barberName = movement.barberUserName?.trim();
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFF0E9D8)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.045), blurRadius: 12, offset: const Offset(0, 5))]),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 46, height: 46, decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(14)), child: Icon(_iconForType(movement.type), color: color)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(movement.concept, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF17131E)))),
                            Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: color.withOpacity(0.10), borderRadius: BorderRadius.circular(999)), child: Text(_labelForType(movement.type), style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11.5))),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          movement.isPaymentTransfer
                              ? '${_methodLabel(movement.fromPaymentMethod)} → ${_methodLabel(movement.toPaymentMethod)} · S/ ${movement.amount.toStringAsFixed(2)}'
                              : 'S/ ${movement.amount.toStringAsFixed(2)} • ${_methodLabel(movement.paymentMethod ?? 'CASH')}',
                          style: const TextStyle(
                            color: Color(0xFF7A7282),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (barberName != null && barberName.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text('Barbero: $barberName', style: const TextStyle(color: Color(0xFF7A7282), fontWeight: FontWeight.w700)),
                        ],
                        if ((movement.note ?? '').trim().isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(movement.note!.trim(), style: const TextStyle(color: Color(0xFF6E6676), fontSize: 13, fontWeight: FontWeight.w500)),
                        ],
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      PopupMenuButton<String>(
                        padding: EdgeInsets.zero,
                        tooltip: 'Acciones',
                        icon: const Icon(Icons.more_vert_rounded, size: 20, color: Color(0xFF667085)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        onSelected: (value) {
                          if (value == 'edit') {
                            onEdit(movement);
                          } else if (value == 'delete') {
                            onDelete(movement);
                          }
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem<String>(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18, color: Color(0xFF17131E)), SizedBox(width: 8), Text('Editar')])),
                          PopupMenuItem<String>(value: 'delete', child: Row(children: [Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFC84C4C)), SizedBox(width: 8), Text('Eliminar')])),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}

class _SalesSection extends StatelessWidget {
  final List<CashSaleModel> sales;
  final bool canManageSales;
  final ValueChanged<CashSaleModel> onEditSale;
  final ValueChanged<CashSaleModel> onDeleteSale;

  const _SalesSection({required this.sales, required this.canManageSales, required this.onEditSale, required this.onDeleteSale});

  Color _paymentColor(String method) {
    switch (method.trim().toUpperCase()) {
      case 'EFECTIVO':
        return const Color(0xFF16A34A);
      case 'YAPE':
        return const Color(0xFF7C3AED);
      case 'PLIN':
        return const Color(0xFF2563EB);
      case 'TARJETA':
        return const Color(0xFF0F172A);
      default:
        return const Color(0xFF667085);
    }
  }

  String _readBarberName(CashSaleModel sale) {
    final direct = sale.barberName?.trim();
    if (direct != null && direct.isNotEmpty) return direct;

    for (final item in sale.items) {
      final candidate = item.barberUserName?.trim();
      if (candidate != null && candidate.isNotEmpty) return candidate;
    }

    return 'Barbero no registrado';
  }

  String _saleDateText(CashSaleModel sale) {
    dynamic rawValue;

    try {
      final dynamic raw = sale;
      rawValue = raw.fechaCreacion;
    } catch (_) {}

    if (rawValue == null) {
      try {
        final dynamic raw = sale;
        rawValue = raw.saleDate;
      } catch (_) {}
    }

    if (rawValue == null) {
      try {
        final dynamic raw = sale;
        rawValue = raw.createdAt;
      } catch (_) {}
    }

    if (rawValue == null) return 'Fecha no disponible';

    DateTime? date;
    if (rawValue is DateTime) {
      date = rawValue;
    } else {
      date = DateTime.tryParse(rawValue.toString());
    }

    if (date == null) return rawValue.toString();

    final dd = date.day.toString().padLeft(2, '0');
    final mm = date.month.toString().padLeft(2, '0');
    final yyyy = date.year.toString();
    final hh = date.hour.toString().padLeft(2, '0');
    final min = date.minute.toString().padLeft(2, '0');

    return '$dd/$mm/$yyyy · $hh:$min';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ventas de hoy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF17131E), letterSpacing: 0.1)),
        const SizedBox(height: 12),
        if (sales.isEmpty)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF0E7D3)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 5))]),
            child: const Row(children: [Icon(Icons.receipt_long_outlined, color: Color(0xFFB4ACB9)), SizedBox(width: 10), Expanded(child: Text('Aún no hay ventas registradas hoy.', style: TextStyle(color: Color(0xFF6E6676), fontSize: 13.5, fontWeight: FontWeight.w600)))]),
          )
        else
          ...sales.map((sale) {
            final customerName = (sale.customerName != null && sale.customerName!.trim().isNotEmpty) ? sale.customerName!.trim() : 'Cliente ocasional';
            final paymentMethod = sale.metodoPago.trim().isEmpty ? 'Sin método' : sale.metodoPago.trim();
            final barberName = _readBarberName(sale);
            final saleDateText = _saleDateText(sale);
            final paymentSummary = _salePaymentSummary(sale);

            return InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () => _showSaleDetail(context, sale),
              child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFF0E9D8)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.045), blurRadius: 12, offset: const Offset(0, 5))]),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 46, height: 46, decoration: BoxDecoration(color: const Color(0xFFF6E9B8), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF3B2F14), size: 22)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(customerName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF17131E), height: 1.1)),
                        const SizedBox(height: 4),
                        Row(children: [const Icon(Icons.content_cut_rounded, size: 14, color: Color(0xFF8B7A4E)), const SizedBox(width: 4), Expanded(child: Text(barberName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.8, fontWeight: FontWeight.w700, color: Color(0xFF6B7280))))]),
                        const SizedBox(height: 6),
                        Wrap(spacing: 8, runSpacing: 6, children: [_SaleInfoChip(icon: Icons.payments_rounded, text: paymentSummary, color: _paymentColor(paymentMethod)), _SaleInfoChip(icon: Icons.shopping_bag_outlined, text: '${sale.items.length} item(s)', color: const Color(0xFF667085))]),
                        const SizedBox(height: 7),
                        Row(children: [const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF8B7A4E)), const SizedBox(width: 5), Expanded(child: Text(saleDateText, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.4, fontWeight: FontWeight.w800, color: Color(0xFF7A5A22))))]),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (canManageSales)
                        PopupMenuButton<String>(
                          padding: EdgeInsets.zero,
                          tooltip: 'Acciones',
                          icon: const Icon(Icons.more_vert_rounded, size: 18, color: Color(0xFF667085)),
                          onSelected: (value) {
                            if (value == 'view') {
                              _showSaleDetail(context, sale);
                            } else if (value == 'edit') {
                              onEditSale(sale);
                            } else if (value == 'delete') {
                              onDeleteSale(sale);
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem<String>(value: 'view', child: Row(children: [Icon(Icons.visibility_rounded, size: 18, color: Color(0xFF047857)), SizedBox(width: 8), Text('Ver detalle')])) ,
                            PopupMenuItem<String>(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18, color: Color(0xFF17131E)), SizedBox(width: 8), Text('Editar')])) ,
                            PopupMenuItem<String>(value: 'delete', child: Row(children: [Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFC84C4C)), SizedBox(width: 8), Text('Eliminar')])) ,
                          ],
                        ),
                      if (canManageSales) const SizedBox(height: 6),
                      Text('S/ ${sale.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF16A34A))),
                    ],
                  ),
                ],
              ),
              ),
            );
          }),
      ],
    );
  }

  String _methodLabel(String method) {
    switch (normalizePaymentCode(method)) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta';
      case 'TRANSFER':
        return 'Transferencia';
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'MIXED':
        return 'Pago mixto';
      case 'FREE':
        return 'Gratis';
      default:
        return method.trim().isEmpty ? 'Sin método' : method.trim();
    }
  }

  String _salePaymentSummary(CashSaleModel sale) {
    if (sale.payments.isEmpty) return _methodLabel(sale.metodoPago);
    return sale.payments
        .map((payment) => '${_methodLabel(payment.method)} S/ ${payment.amount.toStringAsFixed(2)}')
        .join(' + ');
  }

  void _showSaleDetail(BuildContext context, CashSaleModel sale) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SaleDetailSheet(
        sale: sale,
        barberName: _readBarberName(sale),
        saleDateText: _saleDateText(sale),
        paymentSummary: _salePaymentSummary(sale),
        methodLabel: _methodLabel,
      ),
    );
  }
}

class _SaleDetailSheet extends StatelessWidget {
  final CashSaleModel sale;
  final String barberName;
  final String saleDateText;
  final String paymentSummary;
  final String Function(String) methodLabel;

  const _SaleDetailSheet({
    required this.sale,
    required this.barberName,
    required this.saleDateText,
    required this.paymentSummary,
    required this.methodLabel,
  });

  String get _customerName {
    final value = sale.customerName?.trim();
    return value == null || value.isEmpty ? 'Cliente ocasional' : value;
  }

  Widget _infoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF7A7282),
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            flex: 2,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: valueColor ?? const Color(0xFF17131E),
                fontWeight: FontWeight.w900,
                fontSize: 13.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 17, color: const Color(0xFFD4AF37)),
        const SizedBox(width: 7),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF17131E),
            fontWeight: FontWeight.w900,
            fontSize: 15,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.82,
      minChildSize: 0.45,
      maxChildSize: 0.94,
      builder: (context, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFFF6F3ED),
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD8D2C7),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF6E9B8),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF3B2F14)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Detalle de venta',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF17131E)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Venta #${sale.saleId} · $saleDateText',
                          style: const TextStyle(color: Color(0xFF7A7282), fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF0E7D3)),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 14, offset: const Offset(0, 6))],
                ),
                child: Column(
                  children: [
                    _infoRow('Cliente', _customerName),
                    _infoRow('Barbero', barberName),
                    _infoRow('Método', paymentSummary),
                    if (sale.appointmentId != null) _infoRow('Cita', '#${sale.appointmentId}'),
                    _infoRow('Total', 'S/ ${sale.total.toStringAsFixed(2)}', valueColor: const Color(0xFF047857)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF0E7D3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('Servicios y productos', Icons.shopping_bag_outlined),
                    const SizedBox(height: 12),
                    if (sale.items.isEmpty)
                      const Text(
                        'Esta venta no tiene items detallados desde el backend.',
                        style: TextStyle(color: Color(0xFF7A7282), fontWeight: FontWeight.w700),
                      )
                    else
                      ...sale.items.map((item) {
                        final name = (item.serviceName?.trim().isNotEmpty == true)
                            ? item.serviceName!.trim()
                            : (item.productName?.trim().isNotEmpty == true)
                                ? item.productName!.trim()
                                : 'Item registrado';
                        final barber = item.barberUserName?.trim();
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF8F3),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF0E7D3)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF17131E))),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Cant. ${item.cantidad} · Unit. S/ ${item.precioUnitario.toStringAsFixed(2)}${barber != null && barber.isNotEmpty ? ' · $barber' : ''}',
                                      style: const TextStyle(color: Color(0xFF7A7282), fontWeight: FontWeight.w700, fontSize: 12.5),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                'S/ ${item.subtotal.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF17131E)),
                              ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF0E7D3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('Pagos y resumen', Icons.payments_rounded),
                    const SizedBox(height: 12),
                    if (sale.payments.isNotEmpty) ...[
                      ...sale.payments.map((payment) => _infoRow(methodLabel(payment.method), 'S/ ${payment.amount.toStringAsFixed(2)}')),
                      const Divider(height: 18),
                    ],
                    _infoRow('Subtotal', 'S/ ${sale.subtotal.toStringAsFixed(2)}'),
                    _infoRow('Descuento', 'S/ ${sale.discount.toStringAsFixed(2)}'),
                    _infoRow('Recibido', 'S/ ${sale.cashReceived.toStringAsFixed(2)}'),
                    _infoRow('Vuelto', 'S/ ${sale.changeAmount.toStringAsFixed(2)}'),
                    const Divider(height: 18),
                    _infoRow('Total final', 'S/ ${sale.total.toStringAsFixed(2)}', valueColor: const Color(0xFF047857)),
                    if (sale.puntosGanados > 0) _infoRow('Puntos ganados', '${sale.puntosGanados}'),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SaleInfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _SaleInfoChip({required this.icon, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(color: color.withOpacity(0.09), borderRadius: BorderRadius.circular(999), border: Border.all(color: color.withOpacity(0.16))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 13, color: color), const SizedBox(width: 4), Text(text, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w900))]),
    );
  }
}

class _EmptyCashSection extends StatelessWidget {
  final VoidCallback onOpen;
  final String branchName;

  const _EmptyCashSection({required this.onOpen, required this.branchName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22), border: Border.all(color: const Color(0xFFF0E7D3))),
      child: Column(
        children: [
          const Icon(Icons.storefront_rounded, size: 42),
          const SizedBox(height: 12),
          Text('No hay una caja abierta en $branchName', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          const Text('Abre la caja de esta sede para registrar ventas.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF7A7282))),
          const SizedBox(height: 16),
          ElevatedButton.icon(onPressed: onOpen, icon: const Icon(Icons.lock_open_rounded), label: const Text('Abrir caja')),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorCard({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF0E7D3))),
      child: Column(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 34),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF17131E), fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          OutlinedButton(onPressed: onRetry, child: const Text('Reintentar')),
        ],
      ),
    );
  }
}

class _MiniCard extends StatelessWidget {
  final String title;
  final String value;
  final Color? valueColor;
  final bool highlighted;

  const _MiniCard({
    required this.title,
    required this.value,
    this.valueColor,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: highlighted ? const Color(0xFFFFFBEB) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: highlighted
              ? const Color(0xFFFDE68A)
              : const Color(0xFFF0E7D3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF7A7282),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: valueColor ?? const Color(0xFF17131E),
            ),
          ),
        ],
      ),
    );
  }
}
