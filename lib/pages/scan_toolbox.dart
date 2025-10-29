import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/widgets/text_input_section.dart';
import 'package:toolsight/widgets/wide_button.dart';
import 'package:toolsight/router.dart';

class ScanToolbox extends StatefulWidget {
  const ScanToolbox({super.key});

  @override
  State<ScanToolbox> createState() => _ScanToolboxState();
}

class _ScanToolboxState extends State<ScanToolbox> {

  Future<void> _openToolBox() async {
    // TODO implement backend
    final eid = '1';
    context.pushReplacementNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': eid});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 100),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 20,
              children: [
                Column(
                  children: [
                    Text("Scan ToolBox", style: Theme.of(context).textTheme.headlineLarge),
                    Text("Scan the ToolBox to start the session.", style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
                Container(
                  width:  312,
                  height: 312,
                  color: Colors.grey,
                ),
                Row(
                  children: [
                    WideButton(
                      text: "Open ToolBox",
                      onPressed: _openToolBox,
                    ),
                  ],
                ),
              ],
            ),
          ),
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
