import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/mock_data.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';
import 'package:toolsight/models/toolbox.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/toolbox_display.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  late Future<List<Toolbox>> _toolboxesFuture;

  Future<List<Toolbox>> _fetchToolboxes() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    return mockToolboxes;
  }

  @override
  void initState() {
    super.initState();
    _toolboxesFuture = _fetchToolboxes();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 20,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Home", style: Theme.of(context).textTheme.headlineLarge),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Open New ToolBox", style: Theme.of(context).textTheme.titleLarge),
              Row(
                spacing: 10,
                children: [
                  WideButton(
                    text: "Manual Entry",
                    onPressed: () => context.pushNamed(AppRoute.manualEntry.name),
                  ),
                  WideButton(
                    text: "Scan QR Code",
                    onPressed: () => context.pushNamed(AppRoute.scanToolbox.name),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Active ToolBoxes", style: Theme.of(context).textTheme.titleLarge),
              FutureBuilder(
                future: _toolboxesFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return Text("Error loading toolboxes", style: Theme.of(context).textTheme.bodySmall);
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return Text("No active toolboxes.", style: Theme.of(context).textTheme.bodySmall);
                  }

                  final toolboxes = snapshot.data!;
                  return Column(
                    spacing: 10,
                    children: [
                      for (final toolbox in toolboxes) ToolBoxDisplay(toolbox),
                    ],
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
