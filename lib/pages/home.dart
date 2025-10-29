import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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

  final List<Toolbox> _mockToolboxes = [
    Toolbox(id: '1', name: "ToolBox #1", needsAudit: true, needsCalibration: false),
    Toolbox(id: '2', name: "ToolBox #2", needsAudit: false, needsCalibration: true),
    Toolbox(id: '3', name: "ToolBox #3", needsAudit: false, needsCalibration: false),
    Toolbox(id: '4', name: "ToolBox #4", needsAudit: true, needsCalibration: true),
  ];

  Future<List<Toolbox>> _fetchToolboxes() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    return _mockToolboxes;
  }

  @override
  void initState() {
    super.initState();
    _toolboxesFuture = _fetchToolboxes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 20,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 10,
              children: [
                Text("Home", style: Theme.of(context).textTheme.headlineLarge),
                Text("Here is some additional information.", style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 10,
              children: [
                Text("Activate New ToolBox", style: Theme.of(context).textTheme.titleLarge),
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
      ),
    );
  }
}
