import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

class DrawerCapture extends StatefulWidget {
  final String toolboxId;
  final String drawerId;

  const DrawerCapture(this.toolboxId, this.drawerId, {super.key});

  @override
  State<DrawerCapture> createState() => _DrawerCaptureState();
}

class _DrawerCaptureState extends State<DrawerCapture> {
  int _currentIndex = 0;
  late Map<String, dynamic> _toolbox;
  late DocumentReference<Map<String, dynamic>> _auditDoc;
  Stream<DocumentSnapshot<Map<String, dynamic>>>? _drawerAuditStream;

  void _fetchDrawerAudit() async {
    final toolboxDoc = FirebaseFirestore.instance.collection('toolboxes').doc(widget.toolboxId);
    final toolboxResponse = await toolboxDoc.get();
    _toolbox = toolboxResponse.data()!;

    final auditId = _toolbox['lastAuditId'];

    _auditDoc = FirebaseFirestore.instance.collection('audits').doc(auditId);
    _drawerAuditStream = _auditDoc.snapshots();

    _currentIndex = _toolbox['drawers'].indexWhere((drawer) => drawer['drawerId'] == widget.drawerId);

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
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text("Error loading drawer capture.", style: Theme.of(context).textTheme.bodySmall);
          }
          if (!snapshot.hasData) {
            return Text("Drawer not found.", style: Theme.of(context).textTheme.bodySmall);
          }
          if (_toolbox['drawers'].isEmpty) {
            return Text("This toolbox has no drawers.", style: Theme.of(context).textTheme.bodySmall);
          }

          final numDrawers = _toolbox['drawers'].length;
          final drawer = _toolbox['drawers'][_currentIndex];
          final drawerId = drawer['drawerId'];
          final drawerAudit = snapshot.data!.data()!['drawerStates'][drawerId];

          final canGoBack = _currentIndex > 0;
          final canGoForward = _currentIndex < numDrawers - 1;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 20,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text("Drawer Capture", style: Theme.of(context).textTheme.headlineLarge),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: canGoBack ? () => setState(() => _currentIndex--) : null,
                  ),
                  Text(drawer['drawerName'], style: Theme.of(context).textTheme.labelLarge),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: canGoForward ? () => setState(() => _currentIndex++) : null,
                  ),
                ],
              ),
              imageDisplay(drawerAudit['imageStoragePath']),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Image",
                    onPressed: () {},
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
}
