import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppScaffold extends StatefulWidget {
  final Widget child;
  final bool allowBack;

  const AppScaffold({
    super.key,
    required this.child,
    this.allowBack = true,
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
        ],
      ),
    );
  }
}
