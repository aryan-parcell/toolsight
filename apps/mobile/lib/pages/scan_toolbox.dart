import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:toolsight/repositories/checkout_repository.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class ScanToolbox extends StatefulWidget {
  const ScanToolbox({super.key});

  @override
  State<ScanToolbox> createState() => _ScanToolboxState();
}

class _ScanToolboxState extends State<ScanToolbox> {
  bool detected = false;
  String eid = "";
  Timer? detectedTimer;
  final _checkoutRepository = CheckoutRepository();

  Future<void> _openToolBox() async {
    try {
      await _checkoutRepository.checkOutToolbox(eid);
      if (mounted) context.pushReplacementNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': eid});
    } on StateError catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
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
              Text("Scan ToolBox", style: Theme.of(context).textTheme.headlineLarge),
              Text("Scan the ToolBox to start the session.", style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          Container(
            width: double.infinity,
            height: MediaQuery.of(context).size.height * 0.5,
            decoration: BoxDecoration(
              color: Colors.grey,
              border: detected ? Border.all(color: Colors.green, width: 5) : null,
            ),
            child: MobileScanner(
              onDetect: (result) {
                detectedTimer?.cancel();

                detected = true;
                eid = result.barcodes.first.rawValue ?? "";

                detectedTimer = Timer(const Duration(milliseconds: 300), () {
                  detected = false;
                  eid = "";
                  if (mounted) setState(() {});
                });

                setState(() {});
              },
            ),
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
