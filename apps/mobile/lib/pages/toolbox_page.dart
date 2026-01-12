import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:toolsight/repositories/audit_repository.dart';
import 'package:toolsight/repositories/checkout_repository.dart';
import 'package:toolsight/repositories/toolbox_repository.dart';
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
  final _toolboxRepository = ToolboxRepository();
  final _checkoutRepository = CheckoutRepository();
  final _auditRepository = AuditRepository();

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: StreamBuilder(
        stream: _toolboxRepository.getToolboxStream(widget.toolboxId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return Text("Error loading toolbox");
          if (!snapshot.hasData) return Text("Toolbox not found.");

          final toolbox = snapshot.data!.data()!;
          final currentCheckoutId = toolbox['currentCheckoutId'];

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text(toolbox['name'], style: Theme.of(context).textTheme.headlineLarge),
                  if (currentCheckoutId != null) CheckoutBanner(checkoutId: currentCheckoutId),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Images",
                    onPressed: () async {
                      await _auditRepository.ensureActiveAudit(widget.toolboxId, currentCheckoutId);

                      if (context.mounted) {
                        context.pushNamed(
                          AppRoute.capture.name,
                          pathParameters: {'toolbox_id': widget.toolboxId},
                        );
                      }
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
                      try {
                        await _checkoutRepository.closeToolbox(widget.toolboxId, currentCheckoutId);
                        if (context.mounted) {
                          context.pushNamed(AppRoute.complete.name, pathParameters: {'toolbox_id': widget.toolboxId});
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString())),
                          );
                        }
                      }
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

class CheckoutBanner extends StatelessWidget {
  final String checkoutId;
  final _checkoutRepository = CheckoutRepository();

  CheckoutBanner({super.key, required this.checkoutId});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      stream: _checkoutRepository.getCheckoutStream(checkoutId),
      builder: (context, snapshot) {
        if (!snapshot.hasData || !snapshot.data!.exists) return const SizedBox.shrink();

        final data = snapshot.data!.data() as Map<String, dynamic>;
        final auditStatus = data['auditStatus'] as String;
        final currentAuditId = data['currentAuditId'];
        final nextDue = data['nextAuditDue'] as Timestamp?;

        if (nextDue == null) return SizedBox.shrink();

        String nextDueText = DateFormat("h:mm a").format(nextDue.toDate());

        Color bgColor = Colors.blue.shade50;
        Color textColor = Colors.blue.shade900;
        IconData icon = Icons.info_outline;
        String message = "Next Audit: $nextDueText";

        if (auditStatus == 'overdue') {
          bgColor = Colors.red.shade50;
          textColor = Colors.red.shade900;
          icon = Icons.warning_amber_rounded;
          message = "AUDIT OVERDUE: $nextDueText";
        } else if (currentAuditId != null) {
          bgColor = Colors.orange.shade50;
          textColor = Colors.orange.shade900;
          icon = Icons.pending_actions;
          message = "Active Audit Due: $nextDueText";
        }

        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: textColor),
          ),
          child: Row(
            spacing: 10,
            children: [
              Icon(icon, color: textColor, size: 20),
              Text(
                message,
                style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}
