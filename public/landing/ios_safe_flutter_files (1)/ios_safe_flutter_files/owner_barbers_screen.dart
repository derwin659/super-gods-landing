import 'dart:io';

import 'package:barberia/services/session_service.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

int _asInt(dynamic value, {int fallback = 0}) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim()) ?? fallback;
  return fallback;
}

double _asDouble(dynamic value, {double fallback = 0}) {
  if (value == null) return fallback;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is num) return value.toDouble();
  if (value is String) {
    return double.tryParse(value.trim().replaceAll(',', '.')) ?? fallback;
  }
  return fallback;
}

bool _asBool(dynamic value, {bool fallback = false}) {
  if (value == null) return fallback;
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final v = value.trim().toLowerCase();
    if (v == 'true' || v == '1') return true;
    if (v == 'false' || v == '0' || v.isEmpty) return false;
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

class BranchOption {
  final int id;
  final String nombre;

  BranchOption({
    required this.id,
    required this.nombre,
  });

  factory BranchOption.fromJson(Map<String, dynamic> j) {
    return BranchOption(
      id: _asInt(j["branchId"] ?? j["id"]),
      nombre: (j["branchName"] ?? j["nombre"] ?? j["name"] ?? "").toString(),
    );
  }
}

class BarberOwnerItem {
  final int userId;
  final String nombre;
  final String apellido;
  final String email;
  final String phone;
  final String rol;
  final bool activo;
  final int? branchId;
  final String? branchNombre;
  final String? photoUrl;

  final bool salaryMode;
  final double commissionPercentage;
  final double fixedSalaryAmount;
  final String? salaryFrequency;
  final String? salaryStartDate;

  BarberOwnerItem({
    required this.userId,
    required this.nombre,
    required this.apellido,
    required this.email,
    required this.phone,
    required this.rol,
    required this.activo,
    required this.branchId,
    required this.branchNombre,
    required this.photoUrl,
    required this.salaryMode,
    required this.commissionPercentage,
    required this.fixedSalaryAmount,
    required this.salaryFrequency,
    required this.salaryStartDate,
  });

  String get fullName => "$nombre $apellido".trim();

  String get compensationLabel {
    if (salaryMode) {
      final freq = switch (salaryFrequency) {
        'WEEKLY' => 'Semanal',
        'BIWEEKLY' => 'Quincenal',
        'MONTHLY' => 'Mensual',
        _ => 'Sueldo fijo',
      };
      return '$freq · S/ ${fixedSalaryAmount.toStringAsFixed(2)}';
    }
    return 'Porcentaje · ${commissionPercentage.toStringAsFixed(2)}%';
  }

  factory BarberOwnerItem.fromJson(Map<String, dynamic> j) {
    return BarberOwnerItem(
      userId: _asInt(j["userId"]),
      nombre: (j["nombre"] ?? "").toString(),
      apellido: (j["apellido"] ?? "").toString(),
      email: (j["email"] ?? "").toString(),
      phone: (j["phone"] ?? "").toString(),
      rol: (j["rol"] ?? "BARBER").toString(),
      activo: _asBool(j["activo"], fallback: true),
      branchId: j["branchId"] == null ? null : _asInt(j["branchId"]),
      branchNombre: j["branchNombre"]?.toString(),
      photoUrl: _cleanString(j["photoUrl"]),
      salaryMode: _asBool(j["salaryMode"], fallback: false),
      commissionPercentage: _asDouble(j["commissionPercentage"]),
      fixedSalaryAmount: _asDouble(j["fixedSalaryAmount"]),
      salaryFrequency: j["salaryFrequency"]?.toString(),
      salaryStartDate: j["salaryStartDate"]?.toString(),
    );
  }
}

class OwnerBarbersScreen extends StatefulWidget {
  const OwnerBarbersScreen({super.key});

  @override
  State<OwnerBarbersScreen> createState() => _OwnerBarbersScreenState();
}

class _OwnerBarbersScreenState extends State<OwnerBarbersScreen> {
  static const String baseUrl =
      "https://gods-saas-backend-production.up.railway.app";

  static const _bg = Color(0xFFF6F3ED);
  static const _dark = Color(0xFF17131E);
  static const _dark2 = Color(0xFF241C31);
  static const _gold = Color(0xFFD4AF37);
  static const _border = Color(0xFFE7DCC8);
  static const _soft = Color(0xFF7B746C);

  bool _loading = true;
  bool _saving = false;
  String? _error;

  List<BarberOwnerItem> _allItems = [];
  List<BarberOwnerItem> _items = [];
  List<BranchOption> _branches = [];

  int? _selectedBranchFilterId;
  bool _showInactive = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
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

    if (normalized.contains("no permite crear más barberos") ||
        normalized.contains("límite") ||
        normalized.contains("licencia está vencida") ||
        normalized.contains(String.fromCharCodes([115, 117, 115, 99, 114, 105, 112, 99, 105, 243, 110])) ||
        normalized.contains("cuenta")) {
      _showLimitDialog("Acción no permitida", message);
      return;
    }

    _toast(message);
  }

  List<BarberOwnerItem> _branchOnlyItems(List<BarberOwnerItem> source) {
    if (_selectedBranchFilterId == null) {
      return List<BarberOwnerItem>.from(source);
    }

    return source
        .where((item) => item.branchId == _selectedBranchFilterId)
        .toList();
  }

  List<BarberOwnerItem> _applyBranchFilter(List<BarberOwnerItem> source) {
    Iterable<BarberOwnerItem> result = source;

    if (_selectedBranchFilterId != null) {
      result = result.where((item) => item.branchId == _selectedBranchFilterId);
    }

    if (!_showInactive) {
      result = result.where((item) => item.activo);
    }

    return result.toList();
  }

  void _applyFilter() {
    setState(() {
      _items = _applyBranchFilter(_allItems);
    });
  }

  Future<void> _loadInitialData() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final dio = await _buildDio();

      final responses = await Future.wait([
        dio.get("/api/owner/barbers"),
        dio.get("/api/owner/branches"),
      ]);

      final barbersRaw = responses[0].data;
      final branchesRaw = responses[1].data;

      final all = _asList(barbersRaw)
          .map((e) => BarberOwnerItem.fromJson(_asMap(e)))
          .toList();

      final branches = _asList(branchesRaw)
          .map((e) => BranchOption.fromJson(_asMap(e)))
          .where((e) => e.id > 0 && e.nombre.trim().isNotEmpty)
          .toList();

      if (!mounted) return;

      setState(() {
        _branches = branches;
        _allItems = all;
        _items = _applyBranchFilter(all);
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = _extractErrorMessage(
          e,
          fallback: "Error cargando información",
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

  Future<void> _loadBarbers() async {
    try {
      final dio = await _buildDio();
      final res = await dio.get("/api/owner/barbers");

      final all = _asList(res.data)
          .map((e) => BarberOwnerItem.fromJson(_asMap(e)))
          .toList();

      if (!mounted) return;
      setState(() {
        _allItems = all;
        _items = _applyBranchFilter(all);
      });
    } on DioException catch (e) {
      if (!mounted) return;
      _handleBusinessError(
        e,
        fallback: "Error cargando barberos",
      );
    } catch (e) {
      if (!mounted) return;
      _toast(e.toString());
    }
  }

  Future<void> _openCreateBarber() async {
    if (_branches.isEmpty) {
      _toast("No hay sedes registradas para este tenant.");
      return;
    }

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OwnerBarberFormSheet(
        title: "Nuevo barbero",
        confirmText: "Crear barbero",
        branches: _branches,
        initialBranchId: _selectedBranchFilterId,
        onSubmit: _createBarber,
      ),
    );

    if (saved == true) {
      await _loadBarbers();
    }
  }

  Future<void> _openEditBarber(BarberOwnerItem item) async {
    if (_branches.isEmpty) {
      _toast("No hay sedes registradas para este tenant.");
      return;
    }

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OwnerBarberFormSheet(
        title: "Editar barbero",
        confirmText: "Guardar cambios",
        existing: item,
        branches: _branches,
        initialBranchId: item.branchId,
        onSubmit: (payload) => _updateBarber(item.userId, payload),
      ),
    );

    if (saved == true) {
      await _loadBarbers();
    }
  }

  Future<bool> _createBarber(Map<String, dynamic> payload) async {
    final photoPath = payload.remove("__photoPath")?.toString();

    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      final res = await dio.post("/api/owner/barbers", data: payload);

      final createdId = _extractCreatedBarberId(res.data);

      if (photoPath != null && photoPath.trim().isNotEmpty) {
        if (createdId == null || createdId <= 0) {
          _toast("Barbero creado, pero no se pudo identificar el ID para subir la foto.");
        } else {
          await _uploadBarberPhotoById(
            dio: dio,
            barberId: createdId,
            filePath: photoPath,
          );
        }
      }

      _toast("Barbero creado correctamente.");
      return true;
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo crear el barbero.",
      );
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<bool> _updateBarber(int barberId, Map<String, dynamic> payload) async {
    final photoPath = payload.remove("__photoPath")?.toString();

    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      await dio.put("/api/owner/barbers/$barberId", data: payload);

      if (photoPath != null && photoPath.trim().isNotEmpty) {
        await _uploadBarberPhotoById(
          dio: dio,
          barberId: barberId,
          filePath: photoPath,
        );
      }

      _toast("Barbero actualizado correctamente.");
      return true;
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo actualizar el barbero.",
      );
      return false;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  int? _extractCreatedBarberId(dynamic data) {
    final map = _asMap(data);
    final direct = _asInt(
      map["userId"] ?? map["id"] ?? map["barberId"] ?? map["barberUserId"],
    );
    if (direct > 0) return direct;

    final user = _asMap(map["user"] ?? map["barber"] ?? map["data"]);
    final nested = _asInt(
      user["userId"] ?? user["id"] ?? user["barberId"] ?? user["barberUserId"],
    );
    return nested > 0 ? nested : null;
  }

  Future<void> _uploadBarberPhotoById({
    required Dio dio,
    required int barberId,
    required String filePath,
  }) async {
    final fileName = filePath.split('/').last;

    final formData = FormData.fromMap({
      "file": await MultipartFile.fromFile(
        filePath,
        filename: fileName.isEmpty ? "barber_photo.jpg" : fileName,
      ),
    });

    await dio.post(
      "/api/owner/barbers/$barberId/photo",
      data: formData,
      options: Options(contentType: "multipart/form-data"),
    );
  }

  Future<void> _toggleStatus(BarberOwnerItem item) async {
    final newStatus = !item.activo;

    setState(() => _saving = true);
    try {
      final dio = await _buildDio();
      await dio.patch(
        "/api/owner/barbers/${item.userId}/status",
        data: {"activo": newStatus},
      );
      _toast(newStatus ? "Barbero activado." : "Barbero desactivado.");
      await _loadBarbers();
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo actualizar el estado del barbero.",
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _softDeleteBarber(BarberOwnerItem item) async {
    if (!item.activo) {
      _toast("Este barbero ya está desactivado.");
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
        ),
        title: const Text("Eliminar barbero"),
        content: Text(
          "Por seguridad, ${item.fullName} no se eliminará definitivamente. "
              "Solo quedará desactivado y no podrá operar en el sistema.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancelar"),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF991B1B),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.delete_outline_rounded),
            label: const Text(
              "Desactivar",
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _saving = true);

    try {
      final dio = await _buildDio();

      await dio.patch(
        "/api/owner/barbers/${item.userId}/status",
        data: {"activo": false},
      );

      _toast("Barbero desactivado correctamente.");
      await _loadBarbers();
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo desactivar el barbero.",
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }


  Future<void> _showPhotoOptions(BarberOwnerItem item) async {
    if (_saving) return;

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
                Text(
                  item.fullName.isEmpty ? "Foto del barbero" : item.fullName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  "Toma una foto o elige una imagen desde galería.",
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
                      child: _PhotoActionButton(
                        icon: Icons.photo_camera_rounded,
                        label: "Cámara",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickAndUploadBarberPhoto(item, ImageSource.camera);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _PhotoActionButton(
                        icon: Icons.photo_library_rounded,
                        label: "Galería",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickAndUploadBarberPhoto(item, ImageSource.gallery);
                        },
                      ),
                    ),
                  ],
                ),
                if ((item.photoUrl ?? '').trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        Navigator.pop(context);
                        await _deleteBarberPhoto(item);
                      },
                      icon: const Icon(Icons.delete_outline_rounded),
                      label: const Text(
                        "Eliminar foto",
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF991B1B),
                        side: const BorderSide(color: Color(0xFFF3C7C7)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickAndUploadBarberPhoto(
      BarberOwnerItem item,
      ImageSource source,
      ) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        imageQuality: 82,
        maxWidth: 1600,
        maxHeight: 1600,
      );

      if (picked == null) return;

      setState(() => _saving = true);

      final dio = await _buildDio();
      final fileName = picked.path.split('/').last;

      final formData = FormData.fromMap({
        "file": await MultipartFile.fromFile(
          picked.path,
          filename: fileName.isEmpty ? "barber_photo.jpg" : fileName,
        ),
      });

      await dio.post(
        "/api/owner/barbers/${item.userId}/photo",
        data: formData,
        options: Options(contentType: "multipart/form-data"),
      );

      _toast("Foto del barbero actualizada.");
      await _loadBarbers();
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo subir la foto del barbero.",
      );
    } catch (e) {
      _toast("No se pudo subir la foto: $e");
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteBarberPhoto(BarberOwnerItem item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("Eliminar foto"),
        content: Text("¿Quieres quitar la foto de ${item.fullName}?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancelar"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF991B1B),
              foregroundColor: Colors.white,
            ),
            child: const Text("Eliminar"),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _saving = true);

    try {
      final dio = await _buildDio();
      await dio.delete("/api/owner/barbers/${item.userId}/photo");
      _toast("Foto eliminada correctamente.");
      await _loadBarbers();
    } on DioException catch (e) {
      _handleBusinessError(
        e,
        fallback: "No se pudo eliminar la foto del barbero.",
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final metricItems = _branchOnlyItems(_allItems);
    final activeCount = metricItems.where((e) => e.activo).length;
    final inactiveCount = metricItems.where((e) => !e.activo).length;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        foregroundColor: _dark,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: const Text(
          "Barberos",
          style: TextStyle(
            color: _dark,
            fontWeight: FontWeight.w900,
          ),
        ),
        actions: [
          IconButton(
            onPressed: (_loading || _saving) ? null : _loadInitialData,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: (_loading || _saving) ? null : _openCreateBarber,
        backgroundColor: _dark,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text(
          "Nuevo barbero",
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadInitialData,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  colors: [_dark, _dark2],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _OwnerBarbersCircleIcon(
                    icon: Icons.content_cut_rounded,
                    bgColor: Color(0x1AFFFFFF),
                    iconColor: Colors.white,
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Gestión de barberos",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          "Crea, edita y define el modelo de pago de cada barbero por sede.",
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
                  child: _OwnerMetricCard(
                    title: "Activos",
                    value: "$activeCount",
                    valueColor: const Color(0xFF059669),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _OwnerMetricCard(
                    title: "Inactivos",
                    value: "$inactiveCount",
                    valueColor: const Color(0xFFB91C1C),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: _border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 14,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Filtro por sede",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: _dark,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "Por defecto se muestran solo barberos activos. Puedes activar la opción para ver antiguos o desactivados.",
                    style: TextStyle(
                      fontSize: 12,
                      color: _soft,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<int?>(
                    value: _selectedBranchFilterId,
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text("Todas las sedes"),
                      ),
                      ..._branches.map(
                            (b) => DropdownMenuItem<int?>(
                          value: b.id,
                          child: Text(b.nombre),
                        ),
                      ),
                    ],
                    onChanged: _loading
                        ? null
                        : (value) {
                      setState(() {
                        _selectedBranchFilterId = value;
                        _items = _applyBranchFilter(_allItems);
                      });
                    },
                    decoration: _fieldDecoration(
                      label: "Sede",
                      icon: Icons.storefront_rounded,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _showInactive,
                    activeColor: _gold,
                    title: const Text(
                      "Ver barberos inactivos",
                      style: TextStyle(
                        color: _dark,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    subtitle: const Text(
                      "Muestra barberos antiguos o desactivados.",
                      style: TextStyle(
                        color: _soft,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    onChanged: _loading
                        ? null
                        : (value) {
                      setState(() {
                        _showInactive = value;
                        _items = _applyBranchFilter(_allItems);
                      });
                    },
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : _applyFilter,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _dark,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          icon: const Icon(Icons.search_rounded),
                          label: const Text(
                            "Aplicar filtro",
                            style: TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _loading
                              ? null
                              : () {
                            setState(() {
                              _selectedBranchFilterId = null;
                              _showInactive = false;
                              _items = _applyBranchFilter(_allItems);
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            side: const BorderSide(color: Color(0xFFD1D5DB)),
                          ),
                          child: const Text(
                            "Ver activos",
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
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
                    border: Border.all(color: _border),
                  ),
                  child: Text(
                    _showInactive
                        ? "No hay barberos registrados para este filtro."
                        : "No hay barberos activos para este filtro.",
                    style: const TextStyle(
                      color: _soft,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              else
                ..._items.map(
                      (item) => _OwnerBarberCard(
                    item: item,
                    busy: _saving,
                    onEdit: () => _openEditBarber(item),
                    onToggle: () => _toggleStatus(item),
                    onDelete: () => _softDeleteBarber(item),
                    onPhoto: () => _showPhotoOptions(item),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  static InputDecoration _fieldDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      filled: true,
      fillColor: const Color(0xFFFFFCF7),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _gold, width: 1.4),
      ),
      labelStyle: const TextStyle(
        color: _soft,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _OwnerBarberFormSheet extends StatefulWidget {
  final String title;
  final String confirmText;
  final BarberOwnerItem? existing;
  final int? initialBranchId;
  final List<BranchOption> branches;
  final Future<bool> Function(Map<String, dynamic>) onSubmit;

  const _OwnerBarberFormSheet({
    required this.title,
    required this.confirmText,
    required this.onSubmit,
    required this.branches,
    this.existing,
    this.initialBranchId,
  });

  @override
  State<_OwnerBarberFormSheet> createState() => _OwnerBarberFormSheetState();
}

class _OwnerBarberFormSheetState extends State<_OwnerBarberFormSheet> {
  static const _dark = Color(0xFF17131E);
  static const _dark2 = Color(0xFF241C31);
  static const _gold = Color(0xFFD4AF37);
  static const _border = Color(0xFFE7DCC8);
  static const _soft = Color(0xFF7B746C);

  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nombreCtrl;
  late final TextEditingController _apellidoCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _passwordCtrl;
  late final TextEditingController _commissionCtrl;
  late final TextEditingController _fixedSalaryCtrl;

  bool _activo = true;
  bool _saving = false;
  bool _salaryMode = false;
  int? _selectedBranchId;
  String? _salaryFrequency;
  XFile? _selectedPhoto;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;

    _nombreCtrl = TextEditingController(text: e?.nombre ?? "");
    _apellidoCtrl = TextEditingController(text: e?.apellido ?? "");
    _emailCtrl = TextEditingController(text: e?.email ?? "");
    _phoneCtrl = TextEditingController(text: e?.phone ?? "");
    _passwordCtrl = TextEditingController();

    _commissionCtrl = TextEditingController(
      text: (e?.commissionPercentage ?? 0) > 0
          ? e!.commissionPercentage.toStringAsFixed(2)
          : '',
    );

    _fixedSalaryCtrl = TextEditingController(
      text: (e?.fixedSalaryAmount ?? 0) > 0
          ? e!.fixedSalaryAmount.toStringAsFixed(2)
          : '',
    );

    _activo = e?.activo ?? true;
    _selectedBranchId = e?.branchId ?? widget.initialBranchId;
    _salaryMode = e?.salaryMode ?? false;
    _salaryFrequency = e?.salaryFrequency;
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _apellidoCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _commissionCtrl.dispose();
    _fixedSalaryCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedBranchId == null || _selectedBranchId! <= 0) {
      _snack("Selecciona una sede.");
      return;
    }

    final payload = <String, dynamic>{
      "nombre": _nombreCtrl.text.trim(),
      "apellido": _apellidoCtrl.text.trim(),
      "email": _emailCtrl.text.trim(),
      "phone": _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      "branchId": _selectedBranchId,
      "activo": _activo,
      "salaryMode": _salaryMode,
      "commissionPercentage": !_salaryMode
          ? double.tryParse(_commissionCtrl.text.trim().replaceAll(',', '.'))
          : null,
      "fixedSalaryAmount": _salaryMode
          ? double.tryParse(_fixedSalaryCtrl.text.trim().replaceAll(',', '.'))
          : null,
      "salaryFrequency": _salaryMode ? _salaryFrequency : null,
      "salaryStartDate": null,
    };

    if (!_isEdit) {
      if (_passwordCtrl.text.trim().isEmpty) {
        _snack("Ingresa una contraseña inicial.");
        return;
      }
      payload["password"] = _passwordCtrl.text.trim();
    }

    if (_selectedPhoto != null) {
      payload["__photoPath"] = _selectedPhoto!.path;
    }

    setState(() => _saving = true);
    final ok = await widget.onSubmit(payload);
    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Datos guardados correctamente."),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;
      Navigator.of(context).pop(true);
    }
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        imageQuality: 82,
        maxWidth: 1600,
        maxHeight: 1600,
      );

      if (picked == null || !mounted) return;

      setState(() {
        _selectedPhoto = picked;
      });
    } catch (e) {
      _snack("No se pudo seleccionar la imagen: $e");
    }
  }

  Future<void> _showPhotoPickerOptions() async {
    await showModalBottomSheet<void>(
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
                    color: Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  "Foto del barbero",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  "Toma una foto o selecciona una imagen desde galería.",
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
                      child: _PhotoActionButton(
                        icon: Icons.photo_camera_rounded,
                        label: "Cámara",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickPhoto(ImageSource.camera);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _PhotoActionButton(
                        icon: Icons.photo_library_rounded,
                        label: "Galería",
                        onTap: () async {
                          Navigator.pop(context);
                          await _pickPhoto(ImageSource.gallery);
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

  Widget _photoFormCard() {
    final existingUrl = widget.existing?.photoUrl?.trim();
    final hasExisting = existingUrl != null && existingUrl.isNotEmpty;
    final hasLocal = _selectedPhoto != null;

    Widget imageWidget;

    if (hasLocal) {
      imageWidget = Image.file(
        File(_selectedPhoto!.path),
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Icon(
          Icons.person_rounded,
          color: Color(0xFF8A6A16),
          size: 34,
        ),
      );
    } else if (hasExisting) {
      imageWidget = Image.network(
        existingUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Icon(
          Icons.person_rounded,
          color: Color(0xFF8A6A16),
          size: 34,
        ),
      );
    } else {
      imageWidget = const Icon(
        Icons.person_rounded,
        color: Color(0xFF8A6A16),
        size: 34,
      );
    }

    return _OwnerFormCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Foto del barbero",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: _dark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _isEdit
                ? "Puedes actualizar la imagen que verá el dueño y el cliente."
                : "Agrega una foto para identificarlo rápido en agenda, ventas y reservas.",
            style: const TextStyle(
              fontSize: 12,
              color: _soft,
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF4D6),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: _border),
                ),
                clipBehavior: Clip.antiAlias,
                child: imageWidget,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hasLocal
                          ? "Nueva foto seleccionada"
                          : hasExisting
                          ? "Foto actual"
                          : "Sin foto todavía",
                      style: const TextStyle(
                        color: _dark,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      hasLocal
                          ? "Se subirá al guardar los cambios."
                          : "Puedes tomar una foto o elegir desde galería.",
                      style: const TextStyle(
                        color: _soft,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _saving ? null : _showPhotoPickerOptions,
                            icon: const Icon(Icons.add_a_photo_rounded, size: 18),
                            label: Text(
                              hasLocal || hasExisting ? "Cambiar" : "Agregar",
                              style: const TextStyle(fontWeight: FontWeight.w900),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: _dark,
                              side: const BorderSide(color: _border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                        if (hasLocal) ...[
                          const SizedBox(width: 8),
                          IconButton(
                            tooltip: "Quitar selección",
                            onPressed: _saving
                                ? null
                                : () => setState(() => _selectedPhoto = null),
                            icon: const Icon(
                              Icons.close_rounded,
                              color: Color(0xFF991B1B),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  InputDecoration _decoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      floatingLabelBehavior: FloatingLabelBehavior.always,
      prefixIcon: Icon(icon, color: const Color(0xFF8B847B)),
      filled: true,
      fillColor: const Color(0xFFFFFCF7),
      hintStyle: const TextStyle(
        color: Color(0xFFB1AAA1),
        fontWeight: FontWeight.w600,
      ),
      labelStyle: const TextStyle(
        color: _soft,
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      floatingLabelStyle: const TextStyle(
        color: Color(0xFF8A6A16),
        fontWeight: FontWeight.w800,
        fontSize: 13,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _gold, width: 1.6),
      ),
    );
  }

  Widget _input({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      cursorColor: _gold,
      style: const TextStyle(
        color: _dark,
        fontWeight: FontWeight.w800,
        fontSize: 15.5,
      ),
      decoration: _decoration(label, icon),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFF6F3ED),
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
                        onTap: _saving
                            ? null
                            : () => Navigator.of(context).pop(false),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: _border),
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
                            color: _dark,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      gradient: const LinearGradient(
                        colors: [_dark, _dark2],
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: const Color(0x1AFFFFFF),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.content_cut_rounded,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.title,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _isEdit
                                    ? "Actualiza sus datos, sede y forma de pago."
                                    : "Define sus datos, sede y modelo de pago.",
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _photoFormCard(),
                  const SizedBox(height: 16),
                  _OwnerFormCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Datos personales",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: _dark,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _input(
                          controller: _nombreCtrl,
                          label: "Nombres",
                          icon: Icons.person_rounded,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? "Ingresa los nombres"
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _input(
                          controller: _apellidoCtrl,
                          label: "Apellidos",
                          icon: Icons.badge_rounded,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? "Ingresa los apellidos"
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _input(
                          controller: _emailCtrl,
                          label: "Correo",
                          icon: Icons.email_rounded,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => (v == null || !v.contains("@"))
                              ? "Ingresa un correo válido"
                              : null,
                        ),
                        const SizedBox(height: 12),
                        _input(
                          controller: _phoneCtrl,
                          label: "Teléfono",
                          icon: Icons.phone_rounded,
                          keyboardType: TextInputType.phone,
                        ),
                        if (!_isEdit) ...[
                          const SizedBox(height: 12),
                          _input(
                            controller: _passwordCtrl,
                            label: "Contraseña inicial",
                            icon: Icons.lock_rounded,
                            obscureText: true,
                            validator: (v) => (v == null || v.trim().length < 4)
                                ? "Ingresa una contraseña válida"
                                : null,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _OwnerFormCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Asignación",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: _dark,
                          ),
                        ),
                        const SizedBox(height: 14),
                        DropdownButtonFormField<int>(
                          value: _selectedBranchId,
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
                          items: widget.branches
                              .map(
                                (b) => DropdownMenuItem<int>(
                              value: b.id,
                              child: Text(b.nombre),
                            ),
                          )
                              .toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedBranchId = value;
                            });
                          },
                          validator: (value) =>
                          value == null ? "Selecciona una sede" : null,
                          decoration: _decoration(
                            "Sede",
                            Icons.storefront_rounded,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFCF7),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: _border),
                          ),
                          child: SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text(
                              "Barbero activo",
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: _dark,
                              ),
                            ),
                            subtitle: const Text(
                              "Controla si puede seguir operando en el sistema.",
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: _soft,
                              ),
                            ),
                            value: _activo,
                            activeColor: _gold,
                            onChanged: (v) => setState(() => _activo = v),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _OwnerFormCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Modelo de pago",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: _dark,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          "Selecciona una sola opción. El sistema usará esto para calcular pagos y utilidad.",
                          style: TextStyle(
                            fontSize: 12,
                            color: _soft,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: _CompensationOptionCard(
                                title: "Porcentaje",
                                subtitle: "Gana comisión según sus ventas",
                                selected: !_salaryMode,
                                icon: Icons.percent_rounded,
                                onTap: () {
                                  setState(() {
                                    _salaryMode = false;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _CompensationOptionCard(
                                title: "Sueldo fijo",
                                subtitle: "Pago semanal, quincenal o mensual",
                                selected: _salaryMode,
                                icon: Icons.payments_rounded,
                                onTap: () {
                                  setState(() {
                                    _salaryMode = true;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        if (!_salaryMode) ...[
                          _input(
                            controller: _commissionCtrl,
                            label: "Porcentaje de comisión",
                            icon: Icons.percent_rounded,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            validator: (v) {
                              if (_salaryMode) return null;
                              final value = double.tryParse(
                                (v ?? '').trim().replaceAll(',', '.'),
                              );
                              if (value == null || value <= 0) {
                                return "Ingresa un porcentaje válido";
                              }
                              return null;
                            },
                          ),
                        ] else ...[
                          _input(
                            controller: _fixedSalaryCtrl,
                            label: "Sueldo fijo",
                            icon: Icons.attach_money_rounded,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            validator: (v) {
                              if (!_salaryMode) return null;
                              final value = double.tryParse(
                                (v ?? '').trim().replaceAll(',', '.'),
                              );
                              if (value == null || value <= 0) {
                                return "Ingresa un sueldo válido";
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: _salaryFrequency,
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
                            items: const [
                              DropdownMenuItem(
                                value: 'WEEKLY',
                                child: Text('Semanal'),
                              ),
                              DropdownMenuItem(
                                value: 'BIWEEKLY',
                                child: Text('Quincenal'),
                              ),
                              DropdownMenuItem(
                                value: 'MONTHLY',
                                child: Text('Mensual'),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _salaryFrequency = value;
                              });
                            },
                            validator: (value) {
                              if (_salaryMode &&
                                  (value == null || value.isEmpty)) {
                                return "Selecciona la periodicidad";
                              }
                              return null;
                            },
                            decoration: _decoration(
                              "Periodicidad del sueldo",
                              Icons.calendar_month_rounded,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [_dark, _dark2],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ElevatedButton.icon(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shadowColor: Colors.transparent,
                          disabledBackgroundColor: Colors.transparent,
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
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OwnerBarberCard extends StatelessWidget {
  final BarberOwnerItem item;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onPhoto;
  final bool busy;

  const _OwnerBarberCard({
    required this.item,
    required this.onEdit,
    required this.onToggle,
    required this.onDelete,
    required this.onPhoto,
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE7DCC8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              _BarberAvatar(
                fullName: item.fullName,
                photoUrl: item.photoUrl,
                onTap: busy ? null : onPhoto,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.fullName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.email,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  item.activo ? "Activo" : "Inactivo",
                  style: TextStyle(
                    color: badgeFg,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _OwnerMiniInfo(
                  label: "Teléfono",
                  value: item.phone.isEmpty ? "-" : item.phone,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _OwnerMiniInfo(
                  label: "Sede",
                  value: item.branchNombre?.isNotEmpty == true
                      ? item.branchNombre!
                      : (item.branchId?.toString() ?? "-"),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _OwnerMiniInfo(
            label: "Modelo de pago",
            value: item.compensationLabel,
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: busy ? null : onPhoto,
              icon: const Icon(Icons.add_a_photo_rounded),
              label: Text(
                (item.photoUrl ?? '').trim().isEmpty ? "Agregar foto" : "Cambiar foto",
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF17131E),
                side: const BorderSide(color: Color(0xFFD1D5DB)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 10),
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
          if (item.activo) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: busy ? null : onDelete,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF991B1B),
                  side: const BorderSide(color: Color(0xFFF3C7C7)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.delete_outline_rounded),
                label: const Text(
                  "Eliminar barbero",
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CompensationOptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool selected;
  final IconData icon;
  final VoidCallback onTap;

  const _CompensationOptionCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor =
    selected ? const Color(0xFFD4AF37) : const Color(0xFFE5E7EB);
    final bgColor =
    selected ? const Color(0xFFFFF8E7) : const Color(0xFFF9FAFB);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor, width: selected ? 1.5 : 1),
          boxShadow: selected
              ? [
            BoxShadow(
              color: const Color(0xFFD4AF37).withOpacity(0.10),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              color:
              selected ? const Color(0xFF8A6A16) : const Color(0xFF6B7280),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: selected
                    ? const Color(0xFF111827)
                    : const Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF6B7280),
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnerMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final Color valueColor;

  const _OwnerMetricCard({
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
        border: Border.all(color: const Color(0xFFE7DCC8)),
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

class _OwnerMiniInfo extends StatelessWidget {
  final String label;
  final String value;

  const _OwnerMiniInfo({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7DCC8)),
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
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
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

class _OwnerFormCard extends StatelessWidget {
  final Widget child;

  const _OwnerFormCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE7DCC8)),
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

class _OwnerBarbersCircleIcon extends StatelessWidget {
  final IconData icon;
  final Color bgColor;
  final Color iconColor;

  const _OwnerBarbersCircleIcon({
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

class _BarberAvatar extends StatelessWidget {
  final String fullName;
  final String? photoUrl;
  final VoidCallback? onTap;

  const _BarberAvatar({
    required this.fullName,
    required this.photoUrl,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final image = photoUrl?.trim();
    final initial = fullName.trim().isNotEmpty
        ? fullName.trim().substring(0, 1).toUpperCase()
        : "B";

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFFFFF4D6),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE7DCC8)),
        ),
        clipBehavior: Clip.antiAlias,
        child: image != null && image.isNotEmpty
            ? Image.network(
          image,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _initial(initial),
        )
            : _initial(initial),
      ),
    );
  }

  Widget _initial(String text) {
    return Center(
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w900,
          color: Color(0xFF6A5312),
        ),
      ),
    );
  }
}

class _PhotoActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _PhotoActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
            Icon(icon, color: const Color(0xFFD4AF37), size: 30),
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
}
