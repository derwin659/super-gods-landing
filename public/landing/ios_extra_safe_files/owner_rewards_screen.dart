import 'dart:io';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import '../../services/owner_rewards_service.dart';
import '../../model/reward_item_model.dart';

class OwnerRewardsScreen extends StatefulWidget {
  const OwnerRewardsScreen({super.key});

  @override
  State<OwnerRewardsScreen> createState() => _OwnerRewardsScreenState();
}

class _OwnerRewardsScreenState extends State<OwnerRewardsScreen> {
  final OwnerRewardsService _service = OwnerRewardsService();
  final ImagePicker _imagePicker = ImagePicker();

  File? _selectedImageFile;

  bool _loading = true;
  String? _error;
  List<RewardItemModel> _rewards = [];

  @override
  void initState() {
    super.initState();
    _loadRewards();
  }

  Future<void> _loadRewards() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _service.getRewards();
      if (!mounted) return;
      setState(() {
        _rewards = data;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _openRewardForm({RewardItemModel? reward}) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => OwnerRewardFormScreen(reward: reward),
      ),
    );

    if (changed == true) {
      await _loadRewards();
    }
  }

  Future<void> _deleteReward(RewardItemModel reward) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text("Eliminar premio"),
        content: Text("¿Deseas eliminar \"${reward.titulo}\"?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancelar"),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Eliminar"),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _service.deleteReward(reward.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Premio eliminado correctamente")),
      );
      await _loadRewards();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error al eliminar: $e")),
      );
    }
  }

  Widget _buildCard(RewardItemModel reward) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _RewardThumb(imageUrl: reward.imagenUrl),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reward.titulo,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    reward.descripcion.isEmpty
                        ? "Sin descripción"
                        : reward.descripcion,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      "${reward.costoPuntos} pts",
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              onSelected: (value) {
                if (value == 'edit') {
                  _openRewardForm(reward: reward);
                } else if (value == 'delete') {
                  _deleteReward(reward);
                }
              },
              itemBuilder: (_) => const [
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit_rounded, size: 18),
                      SizedBox(width: 8),
                      Text("Editar"),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_rounded, size: 18, color: Colors.red),
                      SizedBox(width: 8),
                      Text("Eliminar"),
                    ],
                  ),
                ),
              ],
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.more_vert_rounded,
                  color: Color(0xFF6B7280),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        title: const Text("Premios"),
        centerTitle: true,
        elevation: 0,
        backgroundColor: const Color(0xFFF6F7FB),
        foregroundColor: const Color(0xFF111827),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFD4AF37),
        foregroundColor: Colors.white,
        onPressed: () => _openRewardForm(),
        icon: const Icon(Icons.add_rounded),
        label: const Text("Nuevo premio"),
      ),
      body: RefreshIndicator(
        onRefresh: _loadRewards,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? ListView(
          children: [
            const SizedBox(height: 120),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ],
        )
            : _rewards.isEmpty
            ? ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 100),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: const Column(
                children: [
                  Icon(
                    Icons.card_giftcard_rounded,
                    size: 54,
                    color: Color(0xFFD4AF37),
                  ),
                  SizedBox(height: 14),
                  Text(
                    "Aún no tienes premios",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF111827),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    "Crea premios para que tus clientes puedan canjear sus puntos.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
          ],
        )
            : ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          itemCount: _rewards.length,
          separatorBuilder: (_, __) => const SizedBox(height: 14),
          itemBuilder: (_, i) => _buildCard(_rewards[i]),
        ),
      ),
    );
  }
}


class _RewardThumb extends StatelessWidget {
  final String? imageUrl;

  const _RewardThumb({this.imageUrl});

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim();

    if (url != null && url.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          width: 64,
          height: 64,
          child: Image.network(
            url,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallback(),
          ),
        ),
      );
    }

    return _fallback();
  }

  Widget _fallback() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: const Color(0xFFFBEFC7),
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Icon(
        Icons.redeem_rounded,
        color: Color(0xFFD88900),
        size: 28,
      ),
    );
  }
}

class _RewardImagePickerCard extends StatelessWidget {
  final File? selectedFile;
  final String imageUrl;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _RewardImagePickerCard({
    required this.selectedFile,
    required this.imageUrl,
    required this.onPick,
    required this.onRemove,
  });

  bool get _hasNetworkImage => imageUrl.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    Widget preview;

    if (selectedFile != null) {
      preview = Image.file(selectedFile!, fit: BoxFit.cover);
    } else if (_hasNetworkImage) {
      preview = Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    } else {
      preview = _placeholder();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Imagen del premio',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Container(
            height: 145,
            width: double.infinity,
            color: const Color(0xFFF3F4F6),
            child: preview,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onPick,
                icon: const Icon(Icons.photo_library_rounded),
                label: const Text('Elegir imagen'),
              ),
            ),
            const SizedBox(width: 10),
            IconButton.filledTonal(
              onPressed: (selectedFile != null || _hasNetworkImage) ? onRemove : null,
              icon: const Icon(Icons.delete_outline_rounded),
            ),
          ],
        ),
      ],
    );
  }

  Widget _placeholder() {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.image_outlined, color: Color(0xFF9CA3AF), size: 34),
        SizedBox(height: 8),
        Text(
          'Sin imagen seleccionada',
          style: TextStyle(
            color: Color(0xFF6B7280),
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class OwnerRewardFormScreen extends StatefulWidget {
  final RewardItemModel? reward;

  const OwnerRewardFormScreen({super.key, this.reward});

  @override
  State<OwnerRewardFormScreen> createState() => _OwnerRewardFormScreenState();
}

class _OwnerRewardFormScreenState extends State<OwnerRewardFormScreen> {
  final OwnerRewardsService _service = OwnerRewardsService();
  final ImagePicker _imagePicker = ImagePicker();

  File? _selectedImageFile;

  late final TextEditingController _nombreController;
  late final TextEditingController _descripcionController;
  late final TextEditingController _puntosController;
  late final TextEditingController _stockController;
  late final TextEditingController _imagenUrlController;

  bool _activo = true;
  bool _saving = false;

  bool get _isEdit => widget.reward != null;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(text: widget.reward?.titulo ?? '');
    _descripcionController = TextEditingController(
      text: widget.reward?.descripcion ?? '',
    );
    _puntosController = TextEditingController(
      text: widget.reward != null ? widget.reward!.costoPuntos.toString() : '',
    );
    _stockController = TextEditingController(
      text: widget.reward?.stock != null ? widget.reward!.stock.toString() : '',
    );
    _imagenUrlController = TextEditingController(
      text: widget.reward?.imagenUrl ?? '',
    );
    _activo = widget.reward?.activo ?? true;
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    _puntosController.dispose();
    _stockController.dispose();
    _imagenUrlController.dispose();
    super.dispose();
  }

  InputDecoration _decoration(String label, {String? hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      floatingLabelBehavior: FloatingLabelBehavior.always,
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelStyle: const TextStyle(
        color: Color(0xFF6B7280),
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      floatingLabelStyle: const TextStyle(
        color: Color(0xFFD4AF37),
        fontWeight: FontWeight.w800,
        fontSize: 13,
      ),
      hintStyle: const TextStyle(
        color: Color(0xFF9CA3AF),
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
      ),
    );
  }

  TextStyle get _inputTextStyle => const TextStyle(
    color: Color(0xFF111827),
    fontSize: 15,
    fontWeight: FontWeight.w600,
  );

  void _show(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }


  Future<void> _pickImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 82,
      maxWidth: 1400,
    );

    if (picked == null) return;

    setState(() {
      _selectedImageFile = File(picked.path);
    });
  }

  void _removeSelectedImage() {
    setState(() {
      _selectedImageFile = null;
      _imagenUrlController.clear();
    });
  }

  Future<void> _save() async {
    final nombre = _nombreController.text.trim();
    final descripcion = _descripcionController.text.trim();
    final puntos = int.tryParse(_puntosController.text.trim());
    final stock = _stockController.text.trim().isEmpty
        ? null
        : int.tryParse(_stockController.text.trim());
    final imagenUrl = _imagenUrlController.text.trim().isEmpty
        ? null
        : _imagenUrlController.text.trim();

    if (nombre.isEmpty) {
      _show("Ingresa el nombre del premio");
      return;
    }

    if (puntos == null || puntos <= 0) {
      _show("Ingresa puntos válidos");
      return;
    }

    if (stock != null && stock < 0) {
      _show("El stock no puede ser negativo");
      return;
    }

    setState(() => _saving = true);

    try {
      RewardItemModel saved;
      if (_isEdit) {
        saved = await _service.updateReward(
          id: widget.reward!.id,
          nombre: nombre,
          descripcion: descripcion,
          puntosRequeridos: puntos,
          stock: stock,
          imagenUrl: imagenUrl,
          activo: _activo,
        );
      } else {
        saved = await _service.createReward(
          nombre: nombre,
          descripcion: descripcion,
          puntosRequeridos: puntos,
          stock: stock,
          imagenUrl: imagenUrl,
          activo: _activo,
        );
      }

      final imageFile = _selectedImageFile;
      if (imageFile != null) {
        saved = await _service.uploadRewardImage(
          rewardId: saved.id,
          imagePath: imageFile.path,
        );
        _imagenUrlController.text = saved.imagenUrl ?? _imagenUrlController.text;
      }

      if (!mounted) return;
      Navigator.pop(context, true);
    } on DioException catch (e) {
      if (!mounted) return;

      final data = e.response?.data;
      String message = '';

      if (data is Map && data['message'] != null) {
        message = data['message'].toString();
      } else if (data != null) {
        message = data.toString();
      }

      if (message.contains("no permite crear") ||
          message.contains("acceso")) {
        _showUpgradeDialog();
        return;
      }

      _show(message.isNotEmpty ? message : "Error al guardar");
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        title: Text(_isEdit ? "Editar premio" : "Nuevo premio"),
        centerTitle: true,
        elevation: 0,
        backgroundColor: const Color(0xFFF6F7FB),
        foregroundColor: const Color(0xFF111827),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 18,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _nombreController,
                  cursorColor: const Color(0xFFD4AF37),
                  style: _inputTextStyle,
                  decoration: _decoration("Nombre del premio"),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _descripcionController,
                  maxLines: 3,
                  cursorColor: const Color(0xFFD4AF37),
                  style: _inputTextStyle,
                  decoration: _decoration("Descripción"),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _puntosController,
                  keyboardType: TextInputType.number,
                  cursorColor: const Color(0xFFD4AF37),
                  style: _inputTextStyle,
                  decoration: _decoration("Puntos requeridos"),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _stockController,
                  keyboardType: TextInputType.number,
                  cursorColor: const Color(0xFFD4AF37),
                  style: _inputTextStyle,
                  decoration: _decoration("Stock", hint: "Opcional"),
                ),
                const SizedBox(height: 14),
                _RewardImagePickerCard(
                  selectedFile: _selectedImageFile,
                  imageUrl: _imagenUrlController.text.trim(),
                  onPick: _pickImage,
                  onRemove: _removeSelectedImage,
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _imagenUrlController,
                  cursorColor: const Color(0xFFD4AF37),
                  style: _inputTextStyle,
                  decoration: _decoration(
                    "Imagen URL",
                    hint: "Se llena automáticamente al subir imagen",
                  ),
                ),
                const SizedBox(height: 10),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _activo,
                  activeColor: const Color(0xFFD4AF37),
                  title: const Text(
                    "Activo",
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFF111827),
                    ),
                  ),
                  subtitle: const Text(
                    "Disponible para canje",
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 13,
                    ),
                  ),
                  onChanged: (value) {
                    setState(() => _activo = value);
                  },
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                        : Text(_isEdit ? "Actualizar premio" : "Guardar premio"),
                  ),
                ),
              ],
            ),
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
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock, size: 40, color: Colors.orange),
              const SizedBox(height: 12),
              const Text(
                "Función no disponible",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Esta función no está disponible para esta cuenta. Contacta al administrador del negocio.",
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Entendido"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}