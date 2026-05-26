import 'dart:io';
import 'dart:ui' as ui;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:toolsight/repositories/audit_repository.dart';
import 'package:toolsight/repositories/toolbox_repository.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

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

    final imageFile = await ImageCropper().cropImage(
      sourcePath: image.path,
      compressFormat: ImageCompressFormat.jpg,
      compressQuality: 85,
      maxWidth: 1200,
      maxHeight: 1200,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Edit Image',
          lockAspectRatio: false,
          hideBottomControls: false,
          initAspectRatio: CropAspectRatioPreset.ratio16x9,
        ),
        IOSUiSettings(
          title: 'Edit Image',
        ),
      ],
    );

    if (imageFile == null) return;
    final fileToUpload = File(imageFile.path);

    // Update preview and activate loader immediately   
    setState(() {
      _localDrawerImage = fileToUpload;
      _isUploadingImage = true;
    });

    // Decode image metadata using Flutter's built-in asynchronous native engine
    // This is extremely fast (C++ engine-level) and leaves the Dart UI thread untouched.
    final bytes = await fileToUpload.readAsBytes();
    final codec = await ui.instantiateImageCodec(bytes);
    final frame = await codec.getNextFrame();
    final aspectRatio = frame.image.width / frame.image.height;

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
