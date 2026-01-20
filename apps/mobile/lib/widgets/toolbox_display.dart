import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/pill.dart';

class ToolBoxDisplay extends StatelessWidget {
  final String id;
  final String name;
  final String auditStatus;

  const ToolBoxDisplay(this.id, this.name, this.auditStatus, {super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': id}),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black),
          borderRadius: BorderRadius.zero,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: Theme.of(context).textTheme.labelLarge),
            Row(
              spacing: 5,
              children: [
                if (auditStatus == 'active') const Pill("Active Audit"),
                if (auditStatus == 'overdue') const Pill("Audit Overdue"),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
