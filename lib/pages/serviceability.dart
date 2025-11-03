import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class ServiceabilityQuestionnaire extends StatefulWidget {
  final String toolboxId;

  const ServiceabilityQuestionnaire(this.toolboxId, {super.key});

  @override
  State<ServiceabilityQuestionnaire> createState() => _ServiceabilityQuestionnaireState();
}

class _ServiceabilityQuestionnaireState extends State<ServiceabilityQuestionnaire> {
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
              Text("Serviceability Questionnaire", style: Theme.of(context).textTheme.headlineLarge),
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
