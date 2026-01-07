import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';

class DrawerDisplay extends StatelessWidget {
  final String toolboxId;
  final String drawerId;
  final String drawerName;

  const DrawerDisplay(this.toolboxId, this.drawerId, this.drawerName, {super.key});

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
          border: Border.all(color: Colors.black),
          borderRadius: BorderRadius.zero,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(drawerName, style: Theme.of(context).textTheme.labelLarge),
            // Text('${drawer.present}/${drawer.total}', style: Theme.of(context).textTheme.labelLarge),
          ],
        ),
      ),
    );
  }
}
