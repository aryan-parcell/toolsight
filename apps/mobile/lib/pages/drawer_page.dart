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
          final isAuditActive = audit['endTime'] == null;

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
              if (isAuditActive)
                Row(
                  children: [
                    WideButton(
                      text: "Retake Drawer Images",
                      color: Colors.orange,
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
              imageDisplay(drawerAudit['imageStoragePath'], drawerAudit),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 10,
                children: [
                  Text("Results", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  if (drawerAudit['results'].isEmpty) Text("No results found.", style: Theme.of(context).textTheme.bodySmall),
                  for (final entry in drawerAudit['results'].entries) resultDisplay(entry, auditId, isAuditActive),
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

  Widget imageDisplay(String? imageStoragePath, Map<String, dynamic> drawerAudit) {
    final results = drawerAudit['results'] as Map<String, dynamic>? ?? {};
    final isProcessing = drawerAudit['drawerStatus'] == 'pending' && imageStoragePath != null;

    final blankImage = Container(width: double.infinity, height: 200, color: Colors.grey);

    if (imageStoragePath == null) return blankImage;

    return FutureBuilder(
      future: _auditRepository.getImageUrl(imageStoragePath),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return Center(child: CircularProgressIndicator());
        if (snapshot.hasError || !snapshot.hasData) return blankImage;

        return Stack(
          children: [
            Image.network(
              snapshot.data!,
              width: double.infinity,
              fit: BoxFit.fitWidth,
            ),

            if (results.isNotEmpty)
              Positioned.fill(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return BoundingBoxOverlay(
                      results: results,
                      imageWidth: constraints.biggest.width,
                      imageHeight: constraints.biggest.height,
                    );
                  },
                ),
              ),

            if (isProcessing)
              Positioned.fill(
                child: Container(
                  color: Colors.black26,
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      spacing: 10,
                      children: [
                        CircularProgressIndicator(color: Colors.white),
                        Text("AI Analyzing...", style: TextStyle(color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget resultDisplay(MapEntry<String, dynamic> result, String auditId, bool isAuditActive) {
    final toolId = result.key;
    final toolStatus = result.value['status'];

    final tool = _toolbox['tools'].firstWhere((tool) => tool['toolId'] == toolId);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(tool['toolInfo']['name']),
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
          onChanged: isAuditActive ? (val) => _auditRepository.updateToolStatus(auditId, widget.drawerId, toolId, val as String) : null,
        ),
      ],
    );
  }
}

class BoundingBoxOverlay extends StatelessWidget {
  final Map<String, dynamic> results;
  final double imageWidth;
  final double imageHeight;

  const BoundingBoxOverlay({
    super.key,
    required this.results,
    required this.imageWidth,
    required this.imageHeight,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: results.entries.map((entry) {
        final detection = entry.value;
        final status = detection['status'];
        final info = detection['toolInfo'];

        if (info == null) return const SizedBox.shrink();
        if ([info['x'], info['y'], info['width'], info['height']].contains(null)) return const SizedBox.shrink();

        // Convert 0-100% coordinates to pixels
        final double top = (info['y'] / 100) * imageHeight;
        final double left = (info['x'] / 100) * imageWidth;
        final double width = (info['width'] / 100) * imageWidth;
        final double height = (info['height'] / 100) * imageHeight;

        // Color code based on status
        Color boxColor = Colors.greenAccent;
        if (status == 'absent') boxColor = Colors.redAccent;
        if (status == 'unserviceable') boxColor = Colors.orangeAccent;

        return Positioned(
          top: top,
          left: left,
          width: width,
          height: height,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: boxColor, width: 2),
              color: boxColor.withAlpha(64),
            ),
            child: Align(
              alignment: Alignment.topLeft,
              child: Container(
                color: Colors.black54,
                padding: const EdgeInsets.all(2),
                child: Text(
                  info['name'] ?? 'Unknown',
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
