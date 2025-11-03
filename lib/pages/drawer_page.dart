import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/mock_data.dart';
import 'package:toolsight/models/drawer.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class DrawerPage extends StatefulWidget {
  final String toolboxId;
  final String drawerId;

  const DrawerPage(this.toolboxId, this.drawerId, {super.key});

  @override
  State<DrawerPage> createState() => _DrawerPageState();
}

class _DrawerPageState extends State<DrawerPage> {
  late Future<Drawer> _drawerFuture;

  Future<Drawer> _fetchDrawer() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    final toolbox = mockToolboxes.firstWhere((toolbox) => toolbox.id == widget.toolboxId);
    final drawer = toolbox.drawers.firstWhere((drawer) => drawer.id == widget.drawerId);
    return drawer;
  }

  @override
  void initState() {
    super.initState();
    _drawerFuture = _fetchDrawer();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: FutureBuilder(
        future: _drawerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text("Error loading drawer", style: Theme.of(context).textTheme.bodySmall);
          }
          if (!snapshot.hasData) {
            return Text("Drawer not found.", style: Theme.of(context).textTheme.bodySmall);
          }

          final drawer = snapshot.data!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text(drawer.name, style: Theme.of(context).textTheme.headlineLarge),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Retake Drawer Images",
                    onPressed: () {
                      context.pushNamed(
                        AppRoute.capture.name,
                        pathParameters: {'toolbox_id': widget.toolboxId, 'drawer_id': widget.drawerId},
                      );
                    },
                  ),
                ],
              ),
              Container(
                width: 312,
                height: 200,
                color: Colors.grey,
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text("Results", style: Theme.of(context).textTheme.labelLarge),
                  if (drawer.toolStatus.isEmpty) Text("No results found.", style: Theme.of(context).textTheme.bodySmall),
                  for (final entry in drawer.toolStatus.entries) toolDisplay(entry.key, entry.value),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Confirm Results",
                    onPressed: () => context.pop(),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget toolDisplay(String name, int value) {
    final values = ['Absent', 'Present'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(name),
        Text(values[value]),
      ],
    );
  }
}
