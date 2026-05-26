import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:toolsight/repositories/audit_repository.dart';
import 'package:toolsight/repositories/toolbox_repository.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

Future<(List<int>, double)> _processImageIsolate(Uint8List bytes) async {
  final image = img.decodeImage(bytes);
  if (image == null) return (bytes, 4 / 3);

  var processed = image;

  // 1. Rotate to landscape if portrait
  if (processed.height > processed.width) {
    processed = img.copyRotate(processed, angle: 90);
  }

  // 2. Downscale to a maximum width of 1200px to save massive network bandwidth/size
  if (processed.width > 1200) {
    processed = img.copyResize(processed, width: 1200);
  }

  // 3. Encode to JPG with 85% quality (excellent quality, massive file size reduction)
  final encoded = img.encodeJpg(processed, quality: 85);
  return (encoded, processed.width / processed.height);
}

Future<(File, double)> _normalizeImage(File originalFile) async {
  final bytes = await originalFile.readAsBytes();

  // Run on background thread
  final (newBytes, aspectRatio) = await compute(_processImageIsolate, bytes);

  final savedFile = await originalFile.writeAsBytes(newBytes);
  return (savedFile, aspectRatio);
}

class DrawerCapture extends StatefulWidget {
  final String toolboxId;
  final String auditId;
  final String? initialDrawerId;

  const DrawerCapture(this.toolboxId, this.auditId, {this.initialDrawerId, super.key});

  @override
  State<DrawerCapture> createState() => _DrawerCaptureState();
}

class _DrawerCaptureState extends State<DrawerCapture> {
  final _toolboxRepo = ToolboxRepository();
  final _auditRepo = AuditRepository();
  int _currentIndex = 0;
  late Map<String, dynamic> _toolbox;
  Stream<DocumentSnapshot<Map<String, dynamic>>>? _drawerAuditStream;

  File? _localDrawerImage;
  bool _isUploadingImage = false;

  void _fetchDrawerAudit() async {
    _toolbox = await _toolboxRepo.getToolbox(widget.toolboxId);

    _drawerAuditStream = _auditRepo.getAuditStream(widget.auditId);

    if (widget.initialDrawerId != null) {
      _currentIndex = _toolbox['drawers'].indexWhere((drawer) => drawer['drawerId'] == widget.initialDrawerId);
    }

    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _fetchDrawerAudit();
  }

  Future<void> _captureAndUploadImage(String drawerId) async {
    final image = await ImagePicker().pickImage(source: kDebugMode ? ImageSource.gallery : ImageSource.camera);
    if (image == null) return;

    final imageFile = File(image.path);
    final (fileToUpload, aspectRatio) = await _normalizeImage(imageFile);

    // Show image immediately (before uploading)
    setState(() {
      _localDrawerImage = fileToUpload;
      _isUploadingImage = true;
    });

    await _auditRepo.uploadDrawerImage(widget.auditId, drawerId, _toolbox['organizationId'], fileToUpload, aspectRatio);

    if (mounted) setState(() => _isUploadingImage = false);
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
          if (snapshot.hasError) return Text("Error loading drawer capture.");
          if (!snapshot.hasData) return Text("Drawer not found.");

          if (_toolbox['drawers'].isEmpty) return Text("This toolbox has no drawers.");

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
                    onPressed: canGoBack
                        ? () => setState(() {
                            _localDrawerImage = null;
                            _isUploadingImage = false;
                            _currentIndex--;
                          })
                        : null,
                  ),
                  Text(drawer['drawerName'], style: Theme.of(context).textTheme.labelLarge),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: canGoForward
                        ? () => setState(() {
                            _localDrawerImage = null;
                            _isUploadingImage = false;
                            _currentIndex++;
                          })
                        : null,
                  ),
                ],
              ),
              imageDisplay(drawerAudit['imageUrl']),
              Row(
                children: [
                  WideButton(
                    text: "Capture Drawer Image",
                    onPressed: () => _captureAndUploadImage(drawerId),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget imageDisplay(String? imageUrl) {
    if (_localDrawerImage != null) {
      return Stack(
        children: [
          Image.file(
            _localDrawerImage!,
            width: double.infinity,
            fit: BoxFit.contain,
          ),
          if (_isUploadingImage)
            Positioned.fill(
              child: Container(
                color: Colors.black26,
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
            ),
        ],
      );
    }

    final blankImage = Container(width: double.infinity, height: 200, color: Colors.grey);

    if (imageUrl == null) return blankImage;

    return Image.network(
      imageUrl,
      width: double.infinity,
      fit: BoxFit.contain,
    );
  }
}
