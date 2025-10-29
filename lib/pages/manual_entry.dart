import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/widgets/text_input_section.dart';
import 'package:toolsight/widgets/wide_button.dart';
import 'package:toolsight/router.dart';

class ManualEntry extends StatefulWidget {
  const ManualEntry({super.key});

  @override
  State<ManualEntry> createState() => _ManualEntryState();
}

class _ManualEntryState extends State<ManualEntry> {
  final _eidController = TextEditingController();

  Future<void> _openToolBox() async {
    // TODO implement backend
    final eid = _eidController.text;
    context.goNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': eid});
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
                    Text("Enter ToolBox EID", style: Theme.of(context).textTheme.headlineLarge),
                    Text("Enter the ToolBox's EID to start the session.", style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
                TextInputSection(
                  label: "EID",
                  hintText: "Enter the ToolBox's EID",
                  controller: _eidController,
                  obscureText: false,
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
