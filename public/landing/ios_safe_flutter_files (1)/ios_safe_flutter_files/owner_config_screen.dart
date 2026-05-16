import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../services/session_service.dart';
import 'owner_admin_users_screen.dart';
import 'change_password_screen.dart';
import 'delete_internal_account_screen.dart';
import 'owner_barbers_screen.dart';
import 'owner_booking_payment_settings_screen.dart';
import 'owner_manual_points_screen.dart';
import 'owner_branches_screen.dart';
import 'owner_marketing_campaigns_screen.dart';
import 'owner_products_screen.dart';
import 'owner_services_screen.dart';
import 'owner_rewards_screen.dart';
import 'owner_promotions_screen.dart';
import 'owner_barber_schedule_screen.dart';

class OwnerConfigScreen extends StatelessWidget {
  final bool promotionsEnabled;

  const OwnerConfigScreen({
    super.key,
    required this.promotionsEnabled,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFFF8F9FC),
              Color(0xFFF3F5F9),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
            children: [
              _buildTopBanner(),
              const SizedBox(height: 22),

              _PremiumSectionCard(
                title: "Negocio",
                subtitle: "Controla la operación principal de tu barbería.",
                children: [
                  _PremiumActionTile(
                    icon: Icons.design_services_rounded,
                    iconBg: const Color(0xFFEAF2FF),
                    iconColor: const Color(0xFF2457D6),
                    title: "Servicios",
                    subtitle:
                    "Configura precios, duración y catálogo de servicios.",
                    badgeText: "CORE",
                    badgeBg: const Color(0xFFE8F0FF),
                    badgeColor: const Color(0xFF2457D6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerServicesScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.inventory_2_rounded,
                    iconBg: const Color(0xFFEAFBF3),
                    iconColor: const Color(0xFF0F9F6E),
                    title: "Productos",
                    subtitle:
                    "Crea, edita y controla stock de productos para vender en caja.",
                    badgeText: "VENTAS",
                    badgeBg: const Color(0xFFE7F8EF),
                    badgeColor: const Color(0xFF0F9F6E),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerProductsScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.storefront_rounded,
                    iconBg: const Color(0xFFFFF1E7),
                    iconColor: const Color(0xFFE06A1A),
                    title: "Sedes",
                    subtitle:
                    "Crea, edita y administra las sedes de tu barbería.",
                    badgeText: "MVP",
                    badgeBg: const Color(0xFFFFE8D6),
                    badgeColor: const Color(0xFFB45309),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerBranchesScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.content_cut_rounded,
                    iconBg: const Color(0xFFF1F3F7),
                    iconColor: const Color(0xFF1F2937),
                    title: "Barberos",
                    subtitle:
                    "Gestiona barberos, estado y asignación por sede.",
                    badgeText: "MVP",
                    badgeBg: const Color(0xFFE8EBF0),
                    badgeColor: const Color(0xFF4B5563),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerBarbersScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.schedule_rounded,
                    iconBg: const Color(0xFFEAFBF3),
                    iconColor: const Color(0xFF0F9F6E),
                    title: "Horarios de barberos",
                    subtitle:
                    "Define días de trabajo, horas disponibles y bloqueos por barbero.",
                    badgeText: "AGENDA",
                    badgeBg: const Color(0xFFE7F8EF),
                    badgeColor: const Color(0xFF0F9F6E),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerBarberScheduleScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.payments_rounded,
                    iconBg: const Color(0xFFFFF4D8),
                    iconColor: const Color(0xFFD49B00),
                    title: "Reservas y anticipos",
                    subtitle: "Configura anticipos para reservas de servicios presenciales.",
                    badgeText: "RESERVAS",
                    badgeBg: const Color(0xFFFFEDD2),
                    badgeColor: const Color(0xFFB86A00),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerBookingPaymentSettingsScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),

              const SizedBox(height: 18),

              _PremiumSectionCard(
                title: "Fidelización",
                subtitle:
                "Impulsa el retorno de clientes y mejora su experiencia.",
                children: [
                  _PremiumActionTile(
                    icon: Icons.redeem_rounded,
                    iconBg: const Color(0xFFFFF4D8),
                    iconColor: const Color(0xFFD49B00),
                    title: "Premios",
                    subtitle:
                    "Configura premios canjeables por puntos de tu barbería.",
                    badgeText: "AVANZADO",
                    badgeBg: const Color(0xFFFFEDD2),
                    badgeColor: const Color(0xFFB86A00),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerRewardsScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.local_offer_rounded,
                    iconBg: const Color(0xFFFFF7E8),
                    iconColor: const Color(0xFFD49B00),
                    title: "Promociones",
                    subtitle:
                    "Crea ofertas, campañas y promociones visibles para tus clientes.",
                    badgeText: "AVANZADO",
                    badgeBg: const Color(0xFFFFEDD2),
                    badgeColor: const Color(0xFFB86A00),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OwnerPromotionsScreen(
                            promotionsEnabled: promotionsEnabled,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.campaign_rounded,
                    iconBg: const Color(0xFFEAF2FF),
                    iconColor: const Color(0xFF2457D6),
                    title: "Campañas automáticas",
                    subtitle:
                    "Activa, edita y administra campañas para recuperar clientes y aumentar visitas.",
                    badgeText: "AVANZADO",
                    badgeBg: const Color(0xFFE8F0FF),
                    badgeColor: const Color(0xFF2457D6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerMarketingCampaignsScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.stars_rounded,
                    iconBg: const Color(0xFFEAF2FF),
                    iconColor: const Color(0xFF2457D6),
                    title: "Ajustar puntos",
                    subtitle: "Corrige puntos de clientes manualmente.",
                    badgeText: "MVP",
                    badgeBg: const Color(0xFFE8F0FF),
                    badgeColor: const Color(0xFF2457D6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const OwnerManualPointsScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),


              const SizedBox(height: 18),

              _PremiumSectionCard(
                title: "Seguridad",
                subtitle: "Protege el acceso y la configuración de tu negocio.",
                children: [
                  const _OwnerOnlyAdminUsersTile(),
                  SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.lock_reset_rounded,
                    iconBg: const Color(0xFFF4E8D7),
                    iconColor: const Color(0xFFAF8750),
                    title: "Cambiar contraseña",
                    subtitle: "Actualiza tu clave de acceso de forma segura.",
                    badgeText: "CUENTA",
                    badgeBg: const Color(0xFFFFF4E8),
                    badgeColor: const Color(0xFFAF8750),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ChangePasswordScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 14),
                  _PremiumActionTile(
                    icon: Icons.delete_forever_rounded,
                    iconBg: const Color(0xFFFFEAEA),
                    iconColor: const Color(0xFFB42318),
                    title: "Eliminar cuenta",
                    subtitle: "Desactiva tu acceso de forma permanente en la app.",
                    badgeText: "CUENTA",
                    badgeBg: const Color(0xFFFFE2E2),
                    badgeColor: const Color(0xFFB42318),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const DeleteInternalAccountScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBanner() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0F172A),
            Color(0xFF111827),
            Color(0xFF1F2937),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF111827).withOpacity(0.18),
            blurRadius: 30,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CircleIcon(
            icon: Icons.tune_rounded,
            bgColor: Color(0x1AFFFFFF),
            iconColor: Color(0xFFD4AF37),
          ),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Configuración del negocio",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.2,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  "Administra sedes, barberos, horarios, servicios, premios, promociones, campañas automáticas y puntos desde un solo lugar.",
                  style: TextStyle(
                    color: Color(0xFFD1D5DB),
                    fontSize: 12.8,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
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

class _PremiumSectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;

  const _PremiumSectionCard({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.88),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: const Color(0xFFE9EDF5),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF111827).withOpacity(0.05),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle(title, subtitle: subtitle),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  final String? subtitle;

  const _SectionTitle(this.text, {this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, right: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            text,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
              letterSpacing: 0.2,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: const TextStyle(
                fontSize: 12.5,
                height: 1.35,
                fontWeight: FontWeight.w500,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PremiumActionTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String badgeText;
  final Color badgeBg;
  final Color badgeColor;
  final VoidCallback onTap;

  const _PremiumActionTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.badgeText,
    required this.badgeBg,
    required this.badgeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Colors.white,
                Color(0xFFFBFCFE),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: const Color(0xFFE9ECF2),
              width: 1.1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF111827).withOpacity(0.05),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15.8,
                          height: 1.1,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                          letterSpacing: 0.1,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12.8,
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        color: badgeColor,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.45,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF6B7280),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
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
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(
          color: const Color(0x22FFFFFF),
        ),
      ),
      child: Icon(icon, color: iconColor, size: 24),
    );
  }
}

class _OwnerOnlyAdminUsersTile extends StatefulWidget {
  const _OwnerOnlyAdminUsersTile();

  @override
  State<_OwnerOnlyAdminUsersTile> createState() => _OwnerOnlyAdminUsersTileState();
}

class _OwnerOnlyAdminUsersTileState extends State<_OwnerOnlyAdminUsersTile> {
  bool _loading = true;
  bool _isOwner = false;

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final role = (await SessionService.getRole() ?? '').trim().toUpperCase();
    if (!mounted) return;
    setState(() {
      _isOwner = role == 'OWNER';
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || !_isOwner) return const SizedBox.shrink();

    return _PremiumActionTile(
      icon: Icons.admin_panel_settings_rounded,
      iconBg: const Color(0xFFEAF2FF),
      iconColor: const Color(0xFF2457D6),
      title: 'Usuarios administradores',
      subtitle: 'Crea administradores para operar caja sin permiso para editar o eliminar ventas.',
      badgeText: 'OWNER',
      badgeBg: const Color(0xFFE8F0FF),
      badgeColor: const Color(0xFF2457D6),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const OwnerAdminUsersScreen(),
          ),
        );
      },
    );
  }
}
