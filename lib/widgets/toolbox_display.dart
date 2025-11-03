import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/models/toolbox.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/pill.dart';

class ToolBoxDisplay extends StatelessWidget {
  final Toolbox toolbox;

  const ToolBoxDisplay(this.toolbox, {super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushNamed(AppRoute.toolbox.name, pathParameters: {'toolbox_id': toolbox.id}),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black),
          borderRadius: BorderRadius.zero,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(toolbox.name, style: Theme.of(context).textTheme.labelLarge),
            Row(
              spacing: 5,
              children: [
                if (toolbox.needsAudit) const Pill("Needs Audit"),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
