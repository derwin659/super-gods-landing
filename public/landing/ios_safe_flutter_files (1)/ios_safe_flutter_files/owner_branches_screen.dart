import 'dart:io';

import 'package:barberia/services/session_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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

List<dynamic> _asList(dynamic value) {
  if (value is List) return value;
  return const [];
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

String? _cleanString(dynamic value) {
  if (value == null) return null;
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
}

class OwnerBranchItem {
  final int branchId;
  final String nombre;
  final String direccion;
  final String telefono;
  final bool activo;
  final String? imageUrl;

  OwnerBranchItem({
    required this.branchId,
    required this.nombre,
    required this.direccion,
    required this.telefono,
    required this.activo,
    this.imageUrl,
  });

  factory OwnerBranchItem.fromJson(Map<String, dynamic> j) {
    return OwnerBranchItem(
      branchId: _asInt(j["branchId"] ?? j["id"]),
      nombre: (j["nombre"] ?? j["branchName"] ?? j["name"] ?? "").toString(),
      direccion: (j["direccion"] ?? j["address"] ?? "").toString(),
      telefono: (j["telefono"] ?? j["phone"] ?? "").toString(),
      activo: _asBool(j["activo"], fallback: true),
      imageUrl: _cleanString(j["imageUrl"]),
    );
  }
}

class OwnerBranchesScreen extends StatefulWidget {
  const OwnerBranchesScreen({super.key});

  @override
  State<OwnerBranchesScreen> createState() => _OwnerBranchesScreenState();
}

class _OwnerBranchesScreenState extends State<OwnerBranchesScreen> {
  static const String baseUrl =
      "https://gods-saas-backend-production.up.railway.app";

  bool _loading = true;
  bool _saving = false;
  String? _error;

  List<OwnerBranchItem> _items = [];

  @override
  void initState() {
    super.initState();
    _loadBranches();
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
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 60),
        headers: {
          "Authorization": "Bearer $token",
        },
      ),
    );
  }

  String _extractErrorMessage(
      DioException e, {
        String fallback = "Ocurrió un error",
      }) {
    final data = e.response?.data;

    if (data is Map) {
      final map = Map<String, dynamic>.from(data);

      final message = map["message"]?.toString().trim();
      if (message != null && message.isNotEmpty) return message;

      final error = map["error"]?.toString().trim();
      if (error != null && error.isNotEmpty) return error;

      final detail = map["detail"]?.toString().trim();
      if (detail != null && detail.isNotEmpty) return detail;
    }

    if (data is String && data.trim().isNotEmpty) {
      return data.trim();
    }

    return e.message ?? fallback;
  }

  void _showLimitDialog(String title, String message) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text("Entendido"),
          ),
        ],
      ),
    );
  }

  String _iosSafeBusinessMessage(String message) {
    final normalized = message.toLowerCase();
    if (normalized.contains(String.fromCharCodes([115, 117, 115, 99, 114, 105, 112, 99, 105, 243, 110])) ||
        normalized.contains("licencia") ||
        normalized.contains("plan")) {
      return "Esta acción no está disponible para la cuenta del negocio. Contacta al administrador.";
    }
    return message;
  }

  void _handleBusinessError(
      DioException e, {
        String fallback = "Ocurrió un error",
      }) {
    final rawMessage = _extractErrorMessage(e, fallback: fallback);
    final message = _iosSafeBusinessMessage(rawMessage);
    final normalized = rawMessage.toLowerCase();

    if (normalized.contains("no permite crear más sedes") ||
        normalized.contains("límite") ||
        normalized.contains("licencia está vencida") ||
        normalized.contains(String.fromCharCodes([115, 117, 115, 99, 114, 105, 112, 99, 105, 243, 110])) ||
        normalized.contains("cuenta")) {
      _showLimitDialog("Acción no permitida", message);
      return;
    }

    _toast(message);
  }

  Future<void> _loadBranches() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final dio = await _buildDio();
      final res = await dio.get(
        "/api/owner/branches",
        options: Options(contentType: Headers.jsonContentType),
      );

      final items = _asList(res.data)
          .map((e) => OwnerBranchItem.fromJson(_asMap(e)))
          .toList();

      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = _extractErrorMessage(
          e,
          fallback: "No se pudo cargar las sedes.",
        );
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<OwnerBranchItem?> _createBranch(Map<String, dynamic> payload) async {
    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      final res = await dio.post(
        "/api/owner/branches",
        data: payload,
        options: Options(contentType: Headers.jsonContentType),
      );
      _toast("Sede creada correctamente.");
      return OwnerBranchItem.fromJson(_asMap(res.data));
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo crear la sede.",
      );
      return null;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<OwnerBranchItem?> _updateBranch(
      int branchId,
      Map<String, dynamic> payload,
      ) async {
    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      final res = await dio.put(
        "/api/owner/branches/$branchId",
        data: payload,
        options: Options(contentType: Headers.jsonContentType),
      );
      _toast("Sede actualizada correctamente.");
      return OwnerBranchItem.fromJson(_asMap(res.data));
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo actualizar la sede.",
      );
      return null;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<OwnerBranchItem?> _uploadBranchImage({
    required int branchId,
    required String filePath,
  }) async {
    try {
      final dio = await _buildDio();
      final fileName = filePath.split('/').last;

      final formData = FormData.fromMap({
        "file": await MultipartFile.fromFile(
          filePath,
          filename: fileName.isEmpty ? "branch_image.jpg" : fileName,
        ),
      });

      final res = await dio.post(
        "/api/owner/branches/$branchId/image",
        data: formData,
        options: Options(contentType: "multipart/form-data"),
      );

      return OwnerBranchItem.fromJson(_asMap(res.data));
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo subir la imagen de la sede.",
      );
      return null;
    }
  }

  Future<OwnerBranchItem?> _deleteBranchImage(int branchId) async {
    try {
      final dio = await _buildDio();

      final res = await dio.delete(
        "/api/owner/branches/$branchId/image",
      );

      return OwnerBranchItem.fromJson(_asMap(res.data));
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo eliminar la imagen de la sede.",
      );
      return null;
    }
  }

  Future<void> _toggleStatus(OwnerBranchItem item) async {
    final newStatus = !item.activo;

    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      await dio.patch(
        "/api/owner/branches/${item.branchId}/status",
        data: {"activo": newStatus},
        options: Options(contentType: Headers.jsonContentType),
      );
      _toast(newStatus ? "Sede activada." : "Sede desactivada.");
      await _loadBranches();
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo cambiar el estado de la sede.",
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openCreateBranch() async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OwnerBranchFormSheet(
        title: "Nueva sede",
        confirmText: "Crear sede",
        onSubmit: _createBranch,
        onUploadImage: _uploadBranchImage,
        onDeleteImage: _deleteBranchImage,
      ),
    );

    if (saved == true) {
      await _loadBranches();
    }
  }

  Future<void> _openEditBranch(OwnerBranchItem item) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OwnerBranchFormSheet(
        title: "Editar sede",
        confirmText: "Guardar cambios",
        existing: item,
        onSubmit: (payload) => _updateBranch(item.branchId, payload),
        onUploadImage: _uploadBranchImage,
        onDeleteImage: _deleteBranchImage,
      ),
    );

    if (saved == true) {
      await _loadBranches();
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _items.where((e) => e.activo).length;
    final inactiveCount = _items.where((e) => !e.activo).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        title: const Text(
          "Gestión de sedes",
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        backgroundColor: const Color(0xFFF6F7FB),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: (_loading || _saving) ? null : _openCreateBranch,
        backgroundColor: const Color(0xFF111827),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_business_rounded),
        label: const Text(
          "Nueva sede",
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadBranches,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.10),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _CircleIcon(
                    icon: Icons.storefront_rounded,
                    bgColor: Color(0x1AFFFFFF),
                    iconColor: Colors.white,
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Administración de sedes",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          "Crea, edita y controla las sedes activas de tu tenant.",
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    title: "Activas",
                    value: "$activeCount",
                    valueColor: const Color(0xFF059669),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MetricCard(
                    title: "Inactivas",
                    value: "$inactiveCount",
                    valueColor: const Color(0xFFB91C1C),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(
                    color: Color(0xFFB91C1C),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              )
            else if (_items.isEmpty)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Text(
                    "No hay sedes registradas todavía.",
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              else
                ..._items.map(
                      (item) => _BranchCard(
                    item: item,
                    busy: _saving,
                    onEdit: () => _openEditBranch(item),
                    onToggle: () => _toggleStatus(item),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _OwnerBranchFormSheet extends StatefulWidget {
  final String title;
  final String confirmText;
  final OwnerBranchItem? existing;
  final Future<OwnerBranchItem?> Function(Map<String, dynamic>) onSubmit;
  final Future<OwnerBranchItem?> Function({
  required int branchId,
  required String filePath,
  }) onUploadImage;
  final Future<OwnerBranchItem?> Function(int branchId) onDeleteImage;

  const _OwnerBranchFormSheet({
    required this.title,
    required this.confirmText,
    required this.onSubmit,
    required this.onUploadImage,
    required this.onDeleteImage,
    this.existing,
  });

  @override
  State<_OwnerBranchFormSheet> createState() => _OwnerBranchFormSheetState();
}

class _OwnerBranchFormSheetState extends State<_OwnerBranchFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  late final TextEditingController _nombreCtrl;
  late final TextEditingController _direccionCtrl;
  late final TextEditingController _telefonoCtrl;

  bool _activo = true;
  bool _saving = false;
  bool _deletingImage = false;

  File? _selectedImageFile;
  String? _currentImageUrl;
  bool _imageChanged = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nombreCtrl = TextEditingController(text: e?.nombre ?? "");
    _direccionCtrl = TextEditingController(text: e?.direccion ?? "");
    _telefonoCtrl = TextEditingController(text: e?.telefono ?? "");
    _activo = e?.activo ?? true;
    _currentImageUrl = e?.imageUrl;
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _direccionCtrl.dispose();
    _telefonoCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final payload = <String, dynamic>{
      "nombre": _nombreCtrl.text.trim(),
      "direccion":
      _direccionCtrl.text.trim().isEmpty ? null : _direccionCtrl.text.trim(),
      "telefono":
      _telefonoCtrl.text.trim().isEmpty ? null : _telefonoCtrl.text.trim(),
      "activo": _activo,
    };

    setState(() => _saving = true);

    final saved = await widget.onSubmit(payload);

    if (!mounted) return;

    if (saved == null) {
      setState(() => _saving = false);
      return;
    }

    if (_imageChanged && _selectedImageFile != null) {
      final updated = await widget.onUploadImage(
        branchId: saved.branchId,
        filePath: _selectedImageFile!.path,
      );

      if (!mounted) return;

      if (updated == null) {
        setState(() => _saving = false);
        return;
      }
    }

    setState(() => _saving = false);
    Navigator.of(context).pop(true);
  }

  Future<void> _showImageOptions() async {
    if (_saving || _deletingImage) return;

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return SafeArea(
          child: Container(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 42,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  "Imagen de la sede",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  "Toma una foto del local o elige una imagen de galería.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _imageOptionButton(
                        icon: Icons.photo_camera_rounded,
                        label: "Cámara",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickImage(ImageSource.camera);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _imageOptionButton(
                        icon: Icons.photo_library_rounded,
                        label: "Galería",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickImage(ImageSource.gallery);
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _imageOptionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFFC9A227), size: 30),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                color: Color(0xFF111827),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        imageQuality: 82,
        maxWidth: 1600,
        maxHeight: 1600,
      );

      if (picked == null) return;

      setState(() {
        _selectedImageFile = File(picked.path);
        _imageChanged = true;
      });
    } catch (e) {
      _toast("No se pudo seleccionar la imagen: $e");
    }
  }

  Future<void> _deleteCurrentImage() async {
    if (!_isEdit) {
      setState(() {
        _selectedImageFile = null;
        _imageChanged = false;
      });
      return;
    }

    final hasRemoteImage = (_currentImageUrl ?? "").trim().isNotEmpty;

    if (!hasRemoteImage && _selectedImageFile != null) {
      setState(() {
        _selectedImageFile = null;
        _imageChanged = false;
      });
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text("Eliminar imagen"),
          content: const Text("¿Quieres quitar la imagen de esta sede?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text("Cancelar"),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFC62828),
                foregroundColor: Colors.white,
              ),
              child: const Text("Eliminar"),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    setState(() => _deletingImage = true);

    try {
      final updated = await widget.onDeleteImage(widget.existing!.branchId);

      if (!mounted) return;

      if (updated != null) {
        setState(() {
          _currentImageUrl = updated.imageUrl;
          _selectedImageFile = null;
          _imageChanged = false;
        });
        _toast("Imagen eliminada correctamente.");
      }
    } finally {
      if (mounted) setState(() => _deletingImage = false);
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  Widget _imageSection() {
    final hasLocalImage = _selectedImageFile != null;
    final hasRemoteImage = (_currentImageUrl ?? "").trim().isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Imagen de la sede",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "Agrega una foto del local para que el cliente lo identifique mejor.",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 170,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            clipBehavior: Clip.antiAlias,
            child: hasLocalImage
                ? Image.file(
              _selectedImageFile!,
              fit: BoxFit.cover,
            )
                : hasRemoteImage
                ? Image.network(
              _currentImageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _branchPlaceholder(),
            )
                : _branchPlaceholder(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _saving ? null : _showImageOptions,
                  icon: const Icon(Icons.add_a_photo_rounded),
                  label: Text(
                    hasLocalImage || hasRemoteImage
                        ? "Cambiar imagen"
                        : "Agregar imagen",
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF111827),
                    minimumSize: const Size.fromHeight(46),
                    side: const BorderSide(color: Color(0xFFD1D5DB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              if (hasLocalImage || hasRemoteImage)
                SizedBox(
                  height: 46,
                  width: 50,
                  child: OutlinedButton(
                    onPressed:
                    (_saving || _deletingImage) ? null : _deleteCurrentImage,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFC62828),
                      side: const BorderSide(color: Color(0x33C62828)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    child: _deletingImage
                        ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                        : const Icon(Icons.delete_outline_rounded),
                  ),
                ),
            ],
          ),
          if (_imageChanged && _selectedImageFile != null) ...[
            const SizedBox(height: 10),
            const Text(
              "La imagen se subirá cuando guardes la sede.",
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _branchPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF111827),
            Color(0xFF374151),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.storefront_rounded,
          color: Colors.white,
          size: 42,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFF6F7FB),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  Row(
                    children: [
                      const Spacer(),
                      Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: const Color(0xFFD1D5DB),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                      const Spacer(),
                      InkWell(
                        borderRadius: BorderRadius.circular(999),
                        onTap: _saving ? null : () => Navigator.of(context).pop(false),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            color: Color(0xFF111827),
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.storefront_rounded,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          widget.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _imageSection(),
                  const SizedBox(height: 16),
                  _FormCard(
                    child: Column(
                      children: [
                        _input(
                          controller: _nombreCtrl,
                          label: "Nombre de sede",
                          icon: Icons.badge_rounded,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? "Ingresa el nombre de la sede"
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _input(
                          controller: _direccionCtrl,
                          label: "Dirección",
                          icon: Icons.location_on_rounded,
                        ),
                        const SizedBox(height: 12),
                        _input(
                          controller: _telefonoCtrl,
                          label: "Teléfono",
                          icon: Icons.phone_rounded,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text(
                              "Sede activa",
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF111827),
                              ),
                            ),
                            subtitle: const Text(
                              "Controla si esta sede puede operar en el sistema.",
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            value: _activo,
                            onChanged:
                            _saving ? null : (v) => setState(() => _activo = v),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _saving ? null : _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF111827),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: _saving
                          ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                          : const Icon(Icons.check_circle_rounded),
                      label: Text(
                        _saving ? "Guardando..." : widget.confirmText,
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _input({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: const Color(0xFFF9FAFB),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF111827), width: 1.3),
        ),
      ),
    );
  }
}

class _BranchCard extends StatelessWidget {
  final OwnerBranchItem item;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final bool busy;

  const _BranchCard({
    required this.item,
    required this.onEdit,
    required this.onToggle,
    required this.busy,
  });

  @override
  Widget build(BuildContext context) {
    final badgeBg =
    item.activo ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2);
    final badgeFg =
    item.activo ? const Color(0xFF065F46) : const Color(0xFF991B1B);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _BranchHeaderImage(item: item),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.nombre,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        item.activo ? "Activa" : "Inactiva",
                        style: TextStyle(
                          color: badgeFg,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _MiniInfo(
                  label: "Dirección",
                  value: item.direccion.isEmpty ? "-" : item.direccion,
                ),
                const SizedBox(height: 10),
                _MiniInfo(
                  label: "Teléfono",
                  value: item.telefono.isEmpty ? "-" : item.telefono,
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: busy ? null : onEdit,
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          side: const BorderSide(color: Color(0xFFD1D5DB)),
                        ),
                        icon: const Icon(Icons.edit_rounded),
                        label: const Text(
                          "Editar",
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: busy ? null : onToggle,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: item.activo
                              ? const Color(0xFF991B1B)
                              : const Color(0xFF111827),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: Icon(
                          item.activo
                              ? Icons.block_rounded
                              : Icons.check_circle_rounded,
                        ),
                        label: Text(
                          item.activo ? "Desactivar" : "Activar",
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BranchHeaderImage extends StatelessWidget {
  final OwnerBranchItem item;

  const _BranchHeaderImage({
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = item.imageUrl?.trim();

    return SizedBox(
      height: 145,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl != null && imageUrl.isNotEmpty)
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _placeholder(),
            )
          else
            _placeholder(),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withOpacity(0.35),
                    Colors.transparent,
                    Colors.black.withOpacity(0.20),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
          Positioned(
            left: 14,
            bottom: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.92),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.storefront_rounded,
                    size: 16,
                    color: Color(0xFF111827),
                  ),
                  SizedBox(width: 6),
                  Text(
                    "Sede",
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF111827),
            Color(0xFF374151),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.storefront_rounded,
          color: Colors.white,
          size: 46,
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final Color valueColor;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              color: valueColor,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniInfo extends StatelessWidget {
  final String label;
  final String value;

  const _MiniInfo({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF6B7280),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF111827),
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _FormCard extends StatelessWidget {
  final Widget child;

  const _FormCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  final Color bgColor;
  final Color iconColor;

  const _CircleIcon({
    required this.icon,
    required this.bgColor,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(icon, color: iconColor),
    );
  }
}