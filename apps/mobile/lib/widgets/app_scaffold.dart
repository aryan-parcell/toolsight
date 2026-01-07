import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';

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
    return Scaffold(
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 100),
            child: widget.child,
          ),
          if (widget.allowBack)
            Positioned(
              top: 50,
              left: 38,
              child: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
              ),
            ),
          if (widget.allowLogout)
            Positioned(
              top: 50,
              right: 38,
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
    );
  }
}
