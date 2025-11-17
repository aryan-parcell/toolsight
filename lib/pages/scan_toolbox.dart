import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
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

  Future<void> _openToolBox() async {
    final toolboxDoc = FirebaseFirestore.instance.collection('toolboxes').doc(eid);
    final response = await toolboxDoc.get();
    final toolbox = response.data();

    if (toolbox == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Invalid ToolBox EID")),
        );
      }
      return;
    }

    if (toolbox['status'] != 'available') {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Unavailable ToolBox EID")),
        );
      }
      return;
    }

    final checkoutDoc = await FirebaseFirestore.instance.collection('checkouts').add({
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'toolboxId': eid,
      'checkoutTime': DateTime.now(),
      'returnTime': null,
      'toolboxName': toolbox['name'],
      'status': 'active',
      'audit': false,
    });

    await toolboxDoc.update({
      'status': 'checked-out',
      'currentUserId': FirebaseAuth.instance.currentUser!.uid,
      'currentCheckoutId': checkoutDoc.id,
    });

    if (mounted) context.pushReplacementNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': eid});
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
