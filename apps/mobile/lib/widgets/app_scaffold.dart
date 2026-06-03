import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/app.dart';
import 'package:toolsight/repositories/audit_repository.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/parcell_header.dart';

class AppScaffold extends StatefulWidget {
  final Widget child;
  final bool allowBack;
  final bool allowLogout;

  // Used for discarding at-will audit
  final String? toolboxId;

  const AppScaffold({
    super.key,
    required this.child,
    this.allowBack = true,
    this.allowLogout = true,
    this.toolboxId,
  });

  @override
  State<AppScaffold> createState() => _AppScaffoldState();
}

class _AppScaffoldState extends State<AppScaffold> {
  @override
  Widget build(BuildContext context) {
    const padding = 25.0;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: ParcellHeader(),
        centerTitle: true,
        leading: widget.allowBack
            ? Padding(
                padding: const EdgeInsets.only(left: padding - 8),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
              )
            : null,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: padding - 8),
            child: PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'toggle_theme') {
                  themeNotifier.value = themeNotifier.value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
                } else if (value == 'logout') {
                  await FirebaseAuth.instance.signOut();
                  if (context.mounted) context.goNamed(AppRoute.login.name);
                } else if (value == 'discard_audit') {
                  try {
                    await AuditRepository().discardActiveAudit(widget.toolboxId!);
                  } on StateError catch (e) {
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
                  }
                }
              },
              itemBuilder: (context) => [
                if (widget.toolboxId != null)
                  const PopupMenuItem(
                    value: 'discard_audit',
                    child: Row(
                      spacing: 8,
                      children: [
                        Icon(Icons.delete_outline),
                        Text('Discard Audit'),
                      ],
                    ),
                  ),
                const PopupMenuItem(
                  value: 'toggle_theme',
                  child: Row(
                    spacing: 8,
                    children: [
                      Icon(Icons.palette_outlined),
                      Text('Toggle Theme'),
                    ],
                  ),
                ),
                if (widget.allowLogout)
                  const PopupMenuItem<String>(
                    value: 'logout',
                    child: Row(
                      spacing: 8,
                      children: [
                        Icon(Icons.logout, color: Colors.redAccent),
                        Text('Logout', style: TextStyle(color: Colors.redAccent)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: padding, vertical: padding),
          child: widget.child,
        ),
      ),
    );
  }
}
