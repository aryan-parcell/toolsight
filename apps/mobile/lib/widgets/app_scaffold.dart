import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
    return Scaffold(
      appBar: AppBar(
        title: ParcellHeader(),
        centerTitle: true,
        leadingWidth: 100,
        leading: widget.allowBack
            ? Padding(
                padding: const EdgeInsets.only(left: 15),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
              )
            : null,
        actions: [
          if (widget.allowLogout)
            Padding(
              padding: const EdgeInsets.only(right: 35),
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
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 25),
        child: widget.child,
      ),
    );
  }
}
