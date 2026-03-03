import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';

class DrawerDisplay extends StatelessWidget {
  final String toolboxId;
  final String drawerId;
  final String drawerName;
  final int toolCount;

  const DrawerDisplay(this.toolboxId, this.drawerId, this.drawerName, this.toolCount, {super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        context.pushNamed(
          AppRoute.drawer.name,
          pathParameters: {'toolbox_id': toolboxId, 'drawer_id': drawerId},
        );
      },
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border.all(color: Theme.of(context).colorScheme.outline),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(drawerName, style: TextStyle(fontWeight: FontWeight.bold)),
                Text('$toolCount Tools', style: TextStyle(color: Colors.grey)),
              ],
            ),
            Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
