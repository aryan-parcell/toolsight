import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';

class ToolBoxDisplay extends StatelessWidget {
  final String id;
  final String name;
  final String auditStatus;

  const ToolBoxDisplay(this.id, this.name, this.auditStatus, {super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOverdue = auditStatus == 'overdue';

    final surface = theme.colorScheme.surface;
    final primary = theme.colorScheme.primary;
    final outline = theme.colorScheme.outline;

    return InkWell(
      onTap: () => context.pushNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': id}),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: surface,
          border: Border.all(color: isOverdue ? Colors.red : outline),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: FontWeight.bold)),
                Text('EID: $id', style: TextStyle(color: Colors.grey)),
              ],
            ),
            Row(
              spacing: 5,
              children: [
                if (auditStatus != 'complete')
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                    decoration: BoxDecoration(
                      color: isOverdue ? Colors.red.withAlpha(64) : primary.withAlpha(32),
                      border: Border.all(color: isOverdue ? Colors.red : primary),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isOverdue ? 'Audit Overdue' : 'Active Audit',
                      style: TextStyle(color: isOverdue ? Colors.red : primary),
                    ),
                  ),
                Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
