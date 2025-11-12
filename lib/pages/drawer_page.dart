import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:go_router/go_router.dart';
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
  late Map<String, dynamic> _toolbox;
  late Future<Map<String, dynamic>> _drawerAuditFuture;

  Future<Map<String, dynamic>> _fetchDrawerAudit() async {
    final toolboxDoc = FirebaseFirestore.instance.collection('toolboxes').doc(widget.toolboxId);
    final toolboxResponse = await toolboxDoc.get();
    _toolbox = toolboxResponse.data()!;

    final auditId = _toolbox['lastAuditId'];

    if (auditId == null) {
      return {
        'imageStoragePath': null,
        'results': {},
      };
    }

    final auditDoc = FirebaseFirestore.instance.collection('audits').doc(auditId);
    final auditResponse = await auditDoc.get();
    final audit = auditResponse.data();

    return audit!['drawerStates'][widget.drawerId];
  }

  @override
  void initState() {
    super.initState();
    _drawerAuditFuture = _fetchDrawerAudit();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: true,
      child: FutureBuilder(
        future: _drawerAuditFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text("Error loading drawer", style: Theme.of(context).textTheme.bodySmall);
          }
          if (!snapshot.hasData) {
            return Text("Drawer not found.", style: Theme.of(context).textTheme.bodySmall);
          }

          final drawerAudit = snapshot.data!;

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
                        pathParameters: {'toolbox_id': widget.toolboxId, 'drawer_id': widget.drawerId},
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
                  for (final entry in drawerAudit['results'].entries) resultDisplay(entry),
                ],
              ),
              Row(
                children: [
                  WideButton(
                    text: "Confirm Results",
                    onPressed: () => context.pop(),
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
      future: FirebaseStorage.instance.ref().child(imageStoragePath).getDownloadURL(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
        if (snapshot.hasError || !snapshot.hasData) return blankImage;

        return Image.network(
          snapshot.data!,
          height: 200,
          width: double.infinity,
          fit: BoxFit.contain,
        );
      },
    );
  }

  Widget resultDisplay(MapEntry<String, dynamic> result) {
    final toolId = result.key;
    final toolStatus = result.value;

    final tool = _toolbox['tools'].firstWhere((tool) => tool['toolId'] == toolId);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(tool['toolName']),
        Text(toolStatus),
      ],
    );
  }
}
