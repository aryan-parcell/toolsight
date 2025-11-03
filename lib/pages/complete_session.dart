import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class CompleteSession extends StatefulWidget {
  final String toolboxId;

  const CompleteSession(this.toolboxId, {super.key});

  @override
  State<CompleteSession> createState() => _CompleteSessionState();
}

class _CompleteSessionState extends State<CompleteSession> {
  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 20,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Complete Session", style: Theme.of(context).textTheme.headlineLarge),
              Text("Here is some additional information.", style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          Text("How was your session?", style: Theme.of(context).textTheme.labelLarge),
          Column(
            spacing: 10,
            children: [
              Row(
                children: [
                  WideButton(
                    text: "Everything went well",
                    onPressed: () {},
                  ),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "There were some issues",
                    onPressed: () {},
                  ),
                ],
              ),
            ],
          ),
          Divider(),
          Row(
            children: [
              WideButton(
                text: "Exit to Home",
                onPressed: () {
                  context.goNamed(AppRoute.home.name);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
