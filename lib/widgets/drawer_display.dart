import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/models/drawer.dart';
import 'package:toolsight/models/toolbox.dart';
import 'package:toolsight/router.dart';

class DrawerDisplay extends StatelessWidget {
  final Toolbox toolbox;
  final Drawer drawer;

  const DrawerDisplay(this.toolbox, this.drawer, {super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        context.pushNamed(
          AppRoute.drawer.name,
          pathParameters: {'toolbox_id': toolbox.id, 'drawer_id': drawer.id},
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
            Text(drawer.name, style: Theme.of(context).textTheme.labelLarge),
            Text('${drawer.present}/${drawer.total}', style: Theme.of(context).textTheme.labelLarge),
          ],
        ),
      ),
    );
  }
}
