import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/repositories/checkout_repository.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/text_input_section.dart';
import 'package:toolsight/widgets/wide_button.dart';

class ManualEntry extends StatefulWidget {
  const ManualEntry({super.key});

  @override
  State<ManualEntry> createState() => _ManualEntryState();
}

class _ManualEntryState extends State<ManualEntry> {
  final _eidController = TextEditingController();
  final _checkoutRepository = CheckoutRepository();

  Future<void> _openToolBox() async {
    final eid = _eidController.text;

    try {
      await _checkoutRepository.checkOutToolbox(eid);
      if (mounted) context.pushReplacementNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': eid});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
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
    );
  }
}
