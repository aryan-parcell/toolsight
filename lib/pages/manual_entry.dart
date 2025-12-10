import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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

  Map<String, dynamic> createAuditDrawerStatesFromToolbox(Map<String, dynamic> toolbox) {
    final Map<String, dynamic> drawerStates = {};

    // Initialize drawer states
    for (final drawer in toolbox['drawers']) {
      final drawerId = drawer['drawerId'];
      drawerStates[drawerId] = {
        'drawerStatus': 'pending',
        'imageStoragePath': null,
        'results': {},
      };
    }

    // Populate tool results
    for (final tool in toolbox['tools']) {
      final drawerId = tool['drawerId'];
      final toolId = tool['toolId'];
      drawerStates[drawerId]['results'][toolId] = 'absent';
    }

    return drawerStates;
  }

  Future<void> _openToolBox() async {
    final eid = _eidController.text;

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

    final auditDoc = FirebaseFirestore.instance.collection('audits').doc();
    final checkoutDoc = FirebaseFirestore.instance.collection('checkouts').doc();

    await auditDoc.set({
      'checkoutId': checkoutDoc.id,
      'startTime': DateTime.now(),
      'endTime': null,
      'drawerStates': createAuditDrawerStatesFromToolbox(toolbox),
      'status': 'active',
    });

    await checkoutDoc.set({
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'toolboxId': eid,
      'checkoutTime': DateTime.now(),
      'returnTime': null,
      // denormalized
      'status': 'active',
      'toolboxName': toolbox['name'],
      'auditFrequencyInHours': toolbox['auditFrequencyInHours'],
      // audit scheduling
      'lastAuditTime': DateTime.now(),
      'nextAuditDue': DateTime.now().add(Duration(hours: toolbox['auditFrequencyInHours'])),
      // audit info
      'currentAuditId': auditDoc.id,
      'auditStatus': 'pending',
    });

    await toolboxDoc.update({
      'status': 'checked-out',
      'currentUserId': FirebaseAuth.instance.currentUser!.uid,
      'currentCheckoutId': checkoutDoc.id,
      'lastAuditId': auditDoc.id,
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
