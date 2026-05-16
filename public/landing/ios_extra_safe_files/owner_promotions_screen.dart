import 'package:flutter/material.dart';
import '../../model/owner_promotion_model.dart';
import '../../services/owner_promotions_service.dart';
import 'owner_promotion_form_screen.dart';

class OwnerPromotionsScreen extends StatefulWidget {
  final bool promotionsEnabled;

  const OwnerPromotionsScreen({
    super.key,
    required this.promotionsEnabled,
  });

  @override
  State<OwnerPromotionsScreen> createState() => _OwnerPromotionsScreenState();
}

class _OwnerPromotionsScreenState extends State<OwnerPromotionsScreen> {
  final OwnerPromotionsService _service = OwnerPromotionsService();

  bool _loading = true;
  String? _error;
  List<OwnerPromotionModel> _items = [];

  bool get _isBlocked => !widget.promotionsEnabled;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _service.getPromotions();
      if (!mounted) return;
      setState(() {
        _items = data;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = _cleanError(e);
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _loading = false;
      });
    }
  }

  String _cleanError(Object e) {
    return e.toString().replaceFirst("Exception: ", "").trim();
  }

  bool _isPromotionPlanError(String message) {
    final text = message.toLowerCase();

    return text.contains('no permite gestionar promociones') ||
        text.contains('promocion') ||
        text.contains('promociones') ||
        text.contains('acceso');
  }

  void _showMsg(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(msg),
      ),
    );
  }

  void _showBusinessAccountInfo() {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text("Función no disponible"),
        content: const Text(
          "Esta función no está disponible para esta cuenta. "
          "Contacta al administrador del negocio.",
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF111827),
              foregroundColor: Colors.white,
            ),
            child: const Text("Entendido"),
          ),
        ],
      ),
    );
  }

  void _showUpgradeDialog() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 66,
                height: 66,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7E8),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.campaign_rounded,
                  size: 34,
                  color: Color(0xFFD49B00),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                "Promociones no disponibles",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                "Esta función no está disponible para esta cuenta. Contacta al administrador del negocio.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFD49B00),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                    _showBusinessAccountInfo();
                  },
                  child: const Text(
                    "Entendido",
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Ahora no"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openForm({OwnerPromotionModel? promotion}) async {
    if (_isBlocked) {
      _showUpgradeDialog();
      return;
    }

    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => OwnerPromotionFormScreen(promotion: promotion),
      ),
    );

    if (changed == true) {
      await _load();
    }
  }

  Future<void> _toggle(OwnerPromotionModel item) async {
    if (_isBlocked) {
      _showUpgradeDialog();
      return;
    }

    try {
      await _service.togglePromotion(item.id!);
      await _load();
    } catch (e) {
      final msg = _cleanError(e);
      if (_isPromotionPlanError(msg)) {
        _showUpgradeDialog();
        return;
      }
      _showMsg(msg);
    }
  }

  Future<void> _delete(OwnerPromotionModel item) async {
    if (_isBlocked) {
      _showUpgradeDialog();
      return;
    }

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
        ),
        title: const Text(
          "Eliminar promoción",
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        content: Text("¿Seguro que deseas eliminar '${item.titulo}'?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancelar"),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFD49B00),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Eliminar"),
          ),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _service.deletePromotion(item.id!);
      await _load();
      _showMsg("Promoción eliminada");
    } catch (e) {
      final msg = _cleanError(e);
      if (_isPromotionPlanError(msg)) {
        _showUpgradeDialog();
        return;
      }
      _showMsg(msg);
    }
  }

  Widget _buildBlockedView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 12),
        _buildHeader(),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: const Color(0xFFE9ECF2)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0D111827),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7E8),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Icon(
                  Icons.lock_rounded,
                  size: 34,
                  color: Color(0xFFD49B00),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Promociones no disponibles",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                "Crea ofertas, campañas y beneficios para atraer más clientes y destacar tus servicios.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13.5,
                  height: 1.45,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: const Column(
                  children: [
                    _BlockedFeatureRow(text: "Crear promociones personalizadas"),
                    SizedBox(height: 10),
                    _BlockedFeatureRow(text: "Activar o desactivar campañas"),
                    SizedBox(height: 10),
                    _BlockedFeatureRow(text: "Editar beneficios y redirecciones"),
                    SizedBox(height: 10),
                    _BlockedFeatureRow(text: "Gestionar ofertas destacadas"),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFD49B00),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _goToPlans,
                  icon: const Icon(Icons.lock_rounded),
                  label: const Text(
                    "Entendido",
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFFF6F7FB),
        foregroundColor: const Color(0xFF111827),
        title: const Text(
          "Promociones",
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFD49B00),
        foregroundColor: Colors.white,
        elevation: 10,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        onPressed: _isBlocked ? _showUpgradeDialog : () => _openForm(),
        icon: Icon(
          _isBlocked ? Icons.lock_outline_rounded : Icons.add_rounded,
        ),
        label: Text(
          _isBlocked ? "Cuenta" : "Nueva",
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      body: RefreshIndicator(
        color: const Color(0xFFD49B00),
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SizedBox(height: 12),
            _buildHeader(),
            const SizedBox(height: 18),
            _StateCard(
              icon: Icons.error_outline_rounded,
              title: "No se pudieron cargar las promociones",
              subtitle: _error!,
              buttonText: "Reintentar",
              onPressed: _load,
            ),
          ],
        )
            : _isBlocked
            ? _buildBlockedView()
            : _items.isEmpty
            ? ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SizedBox(height: 12),
            _buildHeader(),
            const SizedBox(height: 18),
            _StateCard(
              icon: Icons.local_offer_outlined,
              title: "Aún no tienes promociones",
              subtitle:
              "Crea tu primera promoción para mostrar ofertas, campañas o beneficios a tus clientes.",
              buttonText: "Crear promoción",
              onPressed: () => _openForm(),
            ),
          ],
        )
            : ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
          itemCount: _items.length + 1,
          separatorBuilder: (_, __) => const SizedBox(height: 14),
          itemBuilder: (_, i) {
            if (i == 0) return _buildHeader();

            final item = _items[i - 1];
            return _PromotionPremiumCard(
              item: item,
              blocked: _isBlocked,
              onEdit: () => _openForm(promotion: item),
              onDelete: () => _delete(item),
              onToggle: () => _toggle(item),
              onBlockedTap: _showUpgradeDialog,
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        gradient: const LinearGradient(
          colors: [
            Color(0xFF111827),
            Color(0xFF1F2937),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x16000000),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _HeaderIcon(),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Gestiona tus promociones',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Crea ofertas atractivas, activa o desactiva campañas y mantén visible solo lo mejor para tus clientes.',
                  style: TextStyle(
                    color: Color(0xFFD1D5DB),
                    fontSize: 12.5,
                    height: 1.4,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _PromotionPremiumCard extends StatelessWidget {
  final OwnerPromotionModel item;
  final bool blocked;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onToggle;
  final VoidCallback onBlockedTap;

  const _PromotionPremiumCard({
    required this.item,
    required this.blocked,
    required this.onEdit,
    required this.onDelete,
    required this.onToggle,
    required this.onBlockedTap,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: blocked ? 0.96 : 1,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: blocked
                ? const Color(0xFFF3D38A)
                : const Color(0xFFE9ECF2),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D111827),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if ((item.imageUrl ?? '').trim().isNotEmpty) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: AspectRatio(
                  aspectRatio: 16 / 8,
                  child: Image.network(
                    item.imageUrl!.trim(),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: const Color(0xFFF3F4F6),
                      child: const Center(
                        child: Icon(
                          Icons.broken_image_outlined,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.titulo,
                    style: const TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),
                if (blocked)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7E8),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFF3D38A)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.lock_outline_rounded,
                          size: 14,
                          color: Color(0xFF8A5A00),
                        ),
                        SizedBox(width: 5),
                        Text(
                          "Cuenta",
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF8A5A00),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                Switch(
                  value: item.activo,
                  activeColor: const Color(0xFFD49B00),
                  onChanged: (_) => blocked ? onBlockedTap() : onToggle(),
                ),
              ],
            ),
            if ((item.subtitulo ?? '').trim().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                item.subtitulo!,
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                  height: 1.35,
                ),
              ),
            ],
            if ((item.descripcion ?? '').trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                item.descripcion!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF4B5563),
                  fontSize: 12.8,
                  height: 1.45,
                ),
              ),
            ],
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _tag(_tipoLabel(item.tipo)),
                if (item.redirectType != 'NONE') _tag(_redirectLabel(item.redirectType)),
                if (item.destacado) _tag('Destacado'),
                if (_discountLabel(item) != null) _tag(_discountLabel(item)!),
                if (item.soloClientesConPuntos)
                  _tag('Puntos mín: ${item.puntosMinimos ?? 0}'),
                if ((item.badge ?? '').trim().isNotEmpty) _tag(item.badge!.trim()),
                _statusTag(item.activo ? 'Activa' : 'Inactiva', item.activo),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF111827),
                      side: const BorderSide(color: Color(0xFFE5E7EB)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: blocked ? onBlockedTap : onEdit,
                    icon: Icon(
                      blocked ? Icons.lock_outline_rounded : Icons.edit_outlined,
                      size: 18,
                    ),
                    label: Text(
                      blocked ? "No disponible" : "Editar",
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      foregroundColor: blocked
                          ? const Color(0xFF8A5A00)
                          : const Color(0xFFB42318),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: blocked ? onBlockedTap : onDelete,
                    icon: Icon(
                      blocked ? Icons.lock_outline_rounded : Icons.delete_outline_rounded,
                      size: 18,
                    ),
                    label: Text(
                      blocked ? "Bloqueado" : "Eliminar",
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _tag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7E8),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFF3D38A)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11.5,
          color: Color(0xFF8A5A00),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _statusTag(String text, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFECFDF3) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: active ? const Color(0xFFA6F4C5) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11.5,
          color: active ? const Color(0xFF027A48) : const Color(0xFF6B7280),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  String? _discountLabel(OwnerPromotionModel item) {
    final type = item.discountType?.trim().toUpperCase();
    final value = item.discountValue;

    if (type == null || type.isEmpty || value == null || value <= 0) {
      return null;
    }

    String cleanValue() {
      if (value == value.roundToDouble()) return value.toInt().toString();
      return value.toStringAsFixed(2);
    }

    switch (type) {
      case 'AMOUNT':
        return 'Descuento S/ ${value.toStringAsFixed(2)}';
      case 'PERCENT':
        return '${cleanValue()}% descuento';
      case 'FIXED_PRICE':
        return 'Precio S/ ${value.toStringAsFixed(2)}';
      default:
        return null;
    }
  }

  String _tipoLabel(String value) {
    switch (value) {
      case 'DISCOUNT':
        return 'Descuento';
      case 'COMBO':
        return 'Combo';
      case 'POINTS':
        return 'Puntos';
      case 'FIRST_VISIT':
        return 'Primera visita';
      case 'VIP':
        return 'VIP';
      case 'SPECIAL_PRICE':
        return 'Precio especial';
      default:
        return 'General';
    }
  }

  String _redirectLabel(String value) {
    switch (value) {
      case 'URL':
        return 'Enlace';
      case 'SERVICE':
        return 'Servicio';
      case 'WHATSAPP':
        return 'WhatsApp';
      case 'REWARD':
        return 'Premio';
      default:
        return value;
    }
  }
}

class _StateCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String buttonText;
  final VoidCallback onPressed;

  const _StateCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.buttonText,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE9ECF2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D111827),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7E8),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              icon,
              color: const Color(0xFFD49B00),
              size: 28,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              height: 1.45,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFD49B00),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            ),
            onPressed: onPressed,
            icon: const Icon(Icons.add_rounded),
            label: Text(
              buttonText,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class _BlockedFeatureRow extends StatelessWidget {
  final String text;

  const _BlockedFeatureRow({
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          Icons.check_circle_outline_rounded,
          size: 18,
          color: Color(0xFFD49B00),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF374151),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: const Color(0x1AFFFFFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(
        Icons.local_offer_rounded,
        color: Color(0xFFD4AF37),
        size: 24,
      ),
    );
  }
}