import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/mock_data.dart';
import 'package:toolsight/models/toolbox.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/drawer_display.dart';
import 'package:toolsight/widgets/wide_button.dart';

class ToolboxPage extends StatefulWidget {
  final String toolboxId;

  const ToolboxPage(this.toolboxId, {super.key});

  @override
  State<ToolboxPage> createState() => _ToolboxPageState();
}

class _ToolboxPageState extends State<ToolboxPage> {
  late Future<Toolbox> _toolboxFuture;

  Future<Toolbox> _fetchToolbox() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    return mockToolboxes.firstWhere((toolbox) => toolbox.id == widget.toolboxId);
  }

  @override
  void initState() {
    super.initState();
    _toolboxFuture = _fetchToolbox();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: FutureBuilder(
        future: _toolboxFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text("Error loading toolbox", style: Theme.of(context).textTheme.bodySmall);
          }
          if (!snapshot.hasData) {
            return Text("Toolbox not found.", style: Theme.of(context).textTheme.bodySmall);
          }

          final toolbox = snapshot.data!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text(toolbox.name, style: Theme.of(context).textTheme.headlineLarge),
                  Text("Here is some additional information.", style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Images",
                    onPressed: () {
                      context.pushNamed(
                        AppRoute.capture.name,
                        pathParameters: {'toolbox_id': toolbox.id, 'drawer_id': '1'},
                      );
                    },
                  ),
                ],
              ),
              Divider(),
              Column(
                spacing: 10,
                children: [
                  for (final drawer in toolbox.drawers) DrawerDisplay(toolbox, drawer),
                ],
              ),
              Divider(),
              Row(
                children: [
                  WideButton(
                    text: "Deactivate ToolBox",
                    onPressed: () {
                      context.pushNamed(AppRoute.complete.name, pathParameters: {'toolbox_id': toolbox.id});
                    },
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
