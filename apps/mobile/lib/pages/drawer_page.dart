import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
import 'package:toolsight/repositories/audit_repository.dart';
import 'package:toolsight/repositories/toolbox_repository.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class DrawerPage extends StatefulWidget {
  final String toolboxId;
  final String drawerId;

  const DrawerPage(this.toolboxId, this.drawerId, {super.key});

  @override
  State<DrawerPage> createState() => _DrawerPageState();
}

class _DrawerPageState extends State<DrawerPage> {
  final _auditRepository = AuditRepository();
  final _toolboxRepository = ToolboxRepository();

  late Map<String, dynamic> _toolbox;
  Stream<DocumentSnapshot<Map<String, dynamic>>>? _drawerAuditStream;

  void _fetchDrawerAudit() async {
    _toolbox = await _toolboxRepository.getToolbox(widget.toolboxId);
    _drawerAuditStream = _auditRepository.getAuditStream(_toolbox['lastAuditId']);
    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _fetchDrawerAudit();
  }

  @override
  Widget build(BuildContext context) {
    if (_drawerAuditStream == null) return Center(child: CircularProgressIndicator());

    return AppScaffold(
      allowBack: true,
      child: StreamBuilder(
        stream: _drawerAuditStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return Text("Error loading drawer");
          if (!snapshot.hasData) return Text("Drawer not found.");

          final audit = snapshot.data!.data()!;
          final auditId = snapshot.data!.id;
          final drawerAudit = audit['drawerStates'][widget.drawerId];

          final drawer = _toolbox['drawers'].firstWhere((drawer) => drawer['drawerId'] == widget.drawerId);

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text(drawer['drawerName'], style: Theme.of(context).textTheme.headlineLarge),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Retake Drawer Images",
                    onPressed: () {
                      context.pushNamed(
                        AppRoute.capture.name,
                        pathParameters: {'toolbox_id': widget.toolboxId},
                        extra: widget.drawerId,
                      );
                    },
                  ),
                ],
              ),
              imageDisplay(drawerAudit['imageStoragePath']),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text("Results", style: Theme.of(context).textTheme.labelLarge),
                  if (drawerAudit['results'].isEmpty) Text("No results found.", style: Theme.of(context).textTheme.bodySmall),
                  for (final entry in drawerAudit['results'].entries) resultDisplay(entry, auditId),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: drawerAudit['drawerStatus'] == 'user-validated' ? "Confirmed Results" : "Confirm Results",
                    onPressed: () async {
                      await _auditRepository.confirmDrawerResults(auditId, widget.drawerId, audit, _toolbox);
                      if (context.mounted) context.pop();
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

  Widget imageDisplay(String? imageStoragePath) {
    final blankImage = Container(width: double.infinity, height: 200, color: Colors.grey);

    if (imageStoragePath == null) return blankImage;

    return FutureBuilder(
      future: _auditRepository.getImageUrl(imageStoragePath),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
        if (snapshot.hasError || !snapshot.hasData) return blankImage;

        return Image.network(
          snapshot.data!,
          width: double.infinity,
          fit: BoxFit.contain,
        );
      },
    );
  }

  Widget resultDisplay(MapEntry<String, dynamic> result, String auditId) {
    final toolId = result.key;
    final toolStatus = result.value;

    final tool = _toolbox['tools'].firstWhere((tool) => tool['toolId'] == toolId);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(tool['toolName']),
        ),
        DropdownButton(
          value: toolStatus,
          isDense: true,
          alignment: Alignment.centerRight,
          underline: SizedBox.shrink(),
          items: [
            DropdownMenuItem(value: 'present', child: Text('Present')),
            DropdownMenuItem(value: 'absent', child: Text('Absent')),
            DropdownMenuItem(value: 'unserviceable', child: Text('Unserviceable')),
          ],
          onChanged: (val) => _auditRepository.updateToolStatus(auditId, widget.drawerId, toolId, val as String),
        ),
      ],
    );
  }
}
