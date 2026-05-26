import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';

class DrawerDisplay extends StatelessWidget {
  final String toolboxId;
  final String drawerId;
  final String drawerName;
  final int toolCount;
  final String? drawerStatus;

  const DrawerDisplay(this.toolboxId, this.drawerId, this.drawerName, this.toolCount, this.drawerStatus, {super.key});

  Widget _buildStatusIndicator() {
    Color color;
    if (drawerStatus == 'user-validated') {
      color = Colors.green;
    } else if (drawerStatus == 'ai-completed') {
      color = Colors.yellow;
    } else if (drawerStatus == 'ai-failed') {
      color = Colors.red;
    } else {
      color = Colors.grey;
    }

    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

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
            Row(
              spacing: 5,
              children: [
                if (drawerStatus != null) _buildStatusIndicator(),
                Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
