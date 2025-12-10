import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
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
  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: StreamBuilder(
        stream: FirebaseFirestore.instance.collection('toolboxes').doc(widget.toolboxId).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return Text("Error loading toolbox");
          if (!snapshot.hasData) return Text("Toolbox not found.");

          final toolbox = snapshot.data!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text(toolbox['name'], style: Theme.of(context).textTheme.headlineLarge),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Images",
                    onPressed: () {
                      context.pushNamed(
                        AppRoute.capture.name,
                        pathParameters: {'toolbox_id': widget.toolboxId},
                      );
                    },
                  ),
                ],
              ),
              Divider(),
              Column(
                spacing: 10,
                children: [
                  for (final drawer in toolbox['drawers']) DrawerDisplay(widget.toolboxId, drawer['drawerId'], drawer['drawerName']),
                ],
              ),
              Divider(),
              Row(
                children: [
                  WideButton(
                    text: "Close ${toolbox['name']}",
                    onPressed: () async {
                      final toolboxDoc = FirebaseFirestore.instance.collection('toolboxes').doc(widget.toolboxId);
                      final checkoutDoc = FirebaseFirestore.instance.collection('checkouts').doc(toolbox['currentCheckoutId']);

                      await checkoutDoc.update({
                        'returnTime': DateTime.now(),
                        'status': 'complete',
                      });

                      await toolboxDoc.update({
                        'status': 'available',
                        'currentUserId': null,
                        'currentCheckoutId': null,
                      });

                      if (context.mounted) context.pushNamed(AppRoute.complete.name, pathParameters: {'toolbox_id': widget.toolboxId});
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
