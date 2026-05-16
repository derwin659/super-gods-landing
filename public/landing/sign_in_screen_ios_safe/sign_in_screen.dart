import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:barberia/services/role_intent_service.dart';
import 'package:barberia/screens/supergods/role_select_screen.dart';

import 'package:barberia/services/auth_api.dart';
import 'package:barberia/services/session_service.dart';
import 'package:barberia/utils/role_router.dart';

import 'forgot_password_screen.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({Key? key}) : super(key: key);

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  String? _roleIntent; // BARBER | OWNER | CLIENT
  bool _loading = false;
  bool _obscurePassword = true;

  final TextEditingController _passwordTextController = TextEditingController();
  final TextEditingController _emailTextController = TextEditingController();

  static const String baseUrl =
      "https://gods-saas-backend-production.up.railway.app";
  /// static const String baseUrl = "http://192.168.100.9:8081";

  @override
  void initState() {
    super.initState();
    _loadRoleIntent();
  }

  Future<void> _loadRoleIntent() async {
    final intent = RoleIntentService();
    final r = await intent.getRoleIntent();
    final clean = (r ?? '').toUpperCase();

    // iOS/App Store safe:
    // Super Admin debe usarse solo desde el panel web.
    if (clean == 'SUPER_ADMIN') {
      await intent.clear();

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const RoleSelectScreen(),
        ),
      );
      return;
    }

    if (!mounted) return;
    setState(() => _roleIntent = r);
  }

  String get _modeLabel {
    final r = (_roleIntent ?? "").toUpperCase();

    if (r == "OWNER" || r == "ADMIN") return "Modo Dueño / Admin";
    if (r == "BARBER") return "Modo Barbero";
    if (r == "CLIENT") return "Modo Cliente";

    return "Iniciar sesión";
  }

  String get _subtitle {
    final r = (_roleIntent ?? "").toUpperCase();

    if (r == "OWNER" || r == "ADMIN") {
      return "Gestiona tu barbería, ventas, caja y reportes.";
    }

    if (r == "BARBER") {
      return "Atiende clientes, revisa tu agenda y registra servicios.";
    }

    if (r == "CLIENT") {
      return "Reserva, revisa puntos y vive la experiencia Gods.";
    }

    return "Ingresa para continuar.";
  }

  Color get _accentColor {
    final r = (_roleIntent ?? "").toUpperCase();

    if (r == "OWNER" || r == "ADMIN") return const Color(0xFF111827);
    if (r == "BARBER") return const Color(0xFF0F172A);
    if (r == "CLIENT") return const Color(0xFF1F2937);

    return const Color(0xFF111827);
  }

  @override
  void dispose() {
    _passwordTextController.dispose();
    _emailTextController.dispose();
    super.dispose();
  }

  Future<void> _loginJava() async {
    final email = _emailTextController.text.trim();
    final password = _passwordTextController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError("Ingresa correo y contraseña.");
      return;
    }

    debugPrint("=======================================");
    debugPrint("🔐 INICIO LOGIN");
    debugPrint("EMAIL => $email");
    debugPrint("ROLE INTENT (ANTES) => $_roleIntent");

    setState(() => _loading = true);

    try {
      final api = AuthApi(baseUrl);

      final basic = await api.loginBasic(email, password);

      debugPrint("=======================================");
      debugPrint("📦 LOGIN BASIC RESPONSE");
      debugPrint("userId => ${basic.userId}");
      debugPrint("nombre => ${basic.nombre}");
      debugPrint("globalRole => ${basic.globalRole}");
      debugPrint("tenants size => ${basic.tenants.length}");

      final intentRole = (_roleIntent ?? "").toUpperCase();
      final globalRole = (basic.globalRole ?? "").toUpperCase();

      debugPrint("=======================================");
      debugPrint("🎯 VALIDACIÓN DE ROLES");
      debugPrint("intentRole => $intentRole");
      debugPrint("globalRole => $globalRole");

      final isSuperAdmin =
          globalRole == "SUPER_ADMIN" || intentRole == "SUPER_ADMIN";

      // iOS/App Store safe:
      // No permitir acceso ni sesión Super Admin desde la app móvil.
      // El panel Super Admin debe usarse solo desde la web.
      if (isSuperAdmin) {
        await RoleIntentService().clear();

        if (!mounted) return;

        _showError(
          "El panel Super Admin está disponible solo desde la web. Ingresa desde supergodsapp.com/login.",
        );

        return;
      }

      debugPrint("👤 ENTRANDO COMO USUARIO CON TENANT");

      if (basic.tenants.isEmpty) {
        debugPrint("❌ ERROR: tenants vacío");
        throw Exception("Este usuario no tiene barberías (tenants) asignadas.");
      }

      final selected = basic.tenants.first;

      debugPrint("TENANT SELECCIONADO => ${selected.tenantId}");
      debugPrint("ROLE EN TENANT => ${selected.role}");

      if (intentRole == "BARBER" &&
          selected.role.toUpperCase() != "BARBER") {
        throw Exception(
          "Modo BARBER inválido. Rol real: ${selected.role}",
        );
      }

      if ((intentRole == "OWNER" || intentRole == "ADMIN") &&
          selected.role.toUpperCase() != "OWNER" &&
          selected.role.toUpperCase() != "ADMIN") {
        throw Exception(
          "Modo OWNER/ADMIN inválido. Rol real: ${selected.role}",
        );
      }

      final finalRes = await api.loginFinal(
        userId: basic.userId,
        tenantId: selected.tenantId,
        mode: "TENANT",
      );

      debugPrint("=======================================");
      debugPrint("✅ LOGIN FINAL TENANT");
      debugPrint("token => ${finalRes.token}");
      debugPrint("tenantId => ${finalRes.tenantId}");
      debugPrint("role => ${finalRes.role}");

      await SessionService.saveSession(
        token: finalRes.token,
        tenantId: finalRes.tenantId,
        tenantName: finalRes.tenantName,
        userId: finalRes.userId,
        userName: finalRes.nombre,
        role: finalRes.role,
        branchId: finalRes.branchId,
        branchName: finalRes.branchName,
        userEmail: finalRes.email,
      );

      await RoleIntentService().clear();

      if (!mounted) return;
      goHomeByRole(context, finalRes.role);
    } on DioException catch (e) {
      debugPrint("=======================================");
      debugPrint("❌ ERROR DIO");
      debugPrint("status => ${e.response?.statusCode}");
      debugPrint("data => ${e.response?.data}");

      final data = e.response?.data;
      String msg = "Error de login";

      if (data is Map<String, dynamic>) {
        msg = data["message"]?.toString() ??
            data["error"]?.toString() ??
            e.message ??
            "Error de login";
      } else {
        msg = e.message ?? "Error de login";
      }

      _showError(msg);
    } catch (e) {
      debugPrint("=======================================");
      debugPrint("❌ ERROR GENERAL");
      debugPrint(e.toString());

      final clean = e.toString().replaceFirst("Exception: ", "");
      _showError(clean);
    } finally {
      debugPrint("=======================================");
      debugPrint("🏁 FIN LOGIN");
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 28),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x16000000),
                blurRadius: 28,
                offset: Offset(0, 16),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 66,
                height: 66,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  color: const Color(0xFFFFF1F1),
                ),
                child: const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFD35D5D),
                  size: 34,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _modeLabel,
                textAlign: TextAlign.center,
                style: GoogleFonts.montserrat(
                  color: const Color(0xFF111827),
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                msg,
                textAlign: TextAlign.center,
                style: GoogleFonts.montserrat(
                  color: const Color(0xFF374151),
                  fontWeight: FontWeight.w500,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _accentColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    "Aceptar",
                    style: GoogleFonts.montserrat(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onForgotPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const ForgotPasswordScreen(
          baseUrl: baseUrl,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                runSpacing: 10,
                children: [
                  _ModeChip(
                    label: _modeLabel,
                    accentColor: _accentColor,
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      await RoleIntentService().clear();
                      if (!mounted) return;
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const RoleSelectScreen(),
                        ),
                      );
                    },
                    icon: const Icon(
                      Icons.swap_horiz_rounded,
                      size: 18,
                      color: Color(0xFF111827),
                    ),
                    label: Text(
                      "Cambiar modo",
                      style: GoogleFonts.montserrat(
                        color: const Color(0xFF111827),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
                decoration: BoxDecoration(
                  color: _accentColor,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.10),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.10),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(0.18),
                        ),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/icons/app_icon.png',
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) {
                            return Center(
                              child: Text(
                                "G",
                                style: GoogleFonts.montserrat(
                                  color: Colors.white,
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      "Bienvenido a GODS",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.montserrat(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _subtitle,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        height: 1.45,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 18,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Inicia sesión",
                      style: GoogleFonts.montserrat(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Accede con tu correo y contraseña para continuar.",
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        color: const Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 18),
                    _NiceField(
                      controller: _emailTextController,
                      hint: "Correo electrónico",
                      icon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 12),
                    _NiceField(
                      controller: _passwordTextController,
                      hint: "Contraseña",
                      icon: Icons.lock_outline_rounded,
                      obscureText: _obscurePassword,
                      suffixIcon: IconButton(
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _onForgotPassword,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 0,
                            vertical: 6,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          "¿Olvidaste tu contraseña?",
                          style: GoogleFonts.montserrat(
                            color: const Color(0xFFAF8750),
                            fontWeight: FontWeight.w800,
                            fontSize: 12.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _loginJava,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _accentColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: _loading
                            ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                            : Text(
                          "Ingresar",
                          style: GoogleFonts.montserrat(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF7E8),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.verified_user_rounded,
                              color: Color(0xFFAF8750),
                              size: 19,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "¿No tienes acceso?",
                                  style: GoogleFonts.montserrat(
                                    color: const Color(0xFF111827),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "Las cuentas profesionales son creadas por el administrador de tu barbería o por el equipo Super Gods.",
                                  style: GoogleFonts.montserrat(
                                    color: const Color(0xFF6B7280),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12.2,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Center(
                child: Text(
                  "Gods Technology • Super App GODS",
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: const Color(0xFF9CA3AF),
                    fontWeight: FontWeight.w600,
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

class _ModeChip extends StatelessWidget {
  final String label;
  final Color accentColor;

  const _ModeChip({
    required this.label,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.verified_user_rounded, color: accentColor, size: 17),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.montserrat(
              color: const Color(0xFF111827),
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _NiceField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;

  const _NiceField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscureText = false,
    this.keyboardType,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: GoogleFonts.montserrat(
        color: const Color(0xFF111827),
        fontWeight: FontWeight.w700,
        fontSize: 15.5,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.montserrat(
          color: const Color(0xFF9CA3AF),
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: Icon(icon, color: const Color(0xFF6B7280)),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: const Color(0xFFF9FAFB),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFF111827), width: 1.3),
        ),
      ),
    );
  }
}