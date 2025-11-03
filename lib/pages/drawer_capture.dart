import 'package:flutter/material.dart' hide Drawer;
import 'package:toolsight/mock_data.dart';
import 'package:toolsight/models/toolbox.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class DrawerCapture extends StatefulWidget {
  final String toolboxId;
  final String drawerId;

  const DrawerCapture(this.toolboxId, this.drawerId, {super.key});

  @override
  State<DrawerCapture> createState() => _DrawerCaptureState();
}

class _DrawerCaptureState extends State<DrawerCapture> {
  late Future<Toolbox> _toolboxFuture;
  int _currentIndex = 0;

  Future<Toolbox> _fetchToolboxAndSetInitialIndex() async {
    // Simulate network fetch
    await Future.delayed(const Duration(seconds: 1));

    final toolbox = mockToolboxes.firstWhere((tb) => tb.id == widget.toolboxId);

    final initialIndex = toolbox.drawers.indexWhere((d) => d.id == widget.drawerId);
    if (initialIndex != -1) _currentIndex = initialIndex;

    return toolbox;
  }

  @override
  void initState() {
    super.initState();
    _toolboxFuture = _fetchToolboxAndSetInitialIndex();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: FutureBuilder<Toolbox>(
        future: _toolboxFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text("Error loading drawer capture.", style: Theme.of(context).textTheme.bodySmall);
          }
          if (!snapshot.hasData) {
            return Text("Drawer not found.", style: Theme.of(context).textTheme.bodySmall);
          }

          final toolbox = snapshot.data!;

          if (toolbox.drawers.isEmpty) {
            return Text("This toolbox has no drawers.", style: Theme.of(context).textTheme.bodySmall);
          }

          if (_currentIndex >= toolbox.drawers.length) {
            _currentIndex = toolbox.drawers.length - 1;
          }

          final drawer = toolbox.drawers[_currentIndex];

          final canGoBack = _currentIndex > 0;
          final canGoForward = _currentIndex < toolbox.drawers.length - 1;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text("Drawer Capture", style: Theme.of(context).textTheme.headlineLarge),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: canGoBack ? () => setState(() => _currentIndex--) : null,
                  ),
                  Text(drawer.name, style: Theme.of(context).textTheme.labelLarge),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: canGoForward ? () => setState(() => _currentIndex++) : null,
                  ),
                ],
              ),
              Container(
                width: 312,
                height: 200,
                color: Colors.grey,
              ),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Image",
                    onPressed: () {},
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
