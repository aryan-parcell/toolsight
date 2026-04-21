import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/app.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/parcell_header.dart';

class AppScaffold extends StatefulWidget {
  final Widget child;
  final bool allowBack;
  final bool allowLogout;

  const AppScaffold({
    super.key,
    required this.child,
    this.allowBack = true,
    this.allowLogout = true,
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
        title: GestureDetector(
          onLongPress: () {
            themeNotifier.value = themeNotifier.value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
          },
          child: ParcellHeader(),
        ),
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
          if (widget.allowLogout)
            Padding(
              padding: const EdgeInsets.only(right: padding - 8),
              child: IconButton(
                icon: const Icon(Icons.logout),
                onPressed: () {
                  FirebaseAuth.instance.signOut();
                  context.goNamed(AppRoute.login.name);
                },
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
