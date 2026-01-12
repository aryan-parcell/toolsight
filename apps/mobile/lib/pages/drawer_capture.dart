import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Drawer;
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/wide_button.dart';

Future<List<int>> _processImageIsolate(Uint8List bytes) async {
  final image = img.decodeImage(bytes);
  if (image == null) return bytes;

  if (image.height <= image.width) return bytes; // Already landscape

  final rotated = img.copyRotate(image, angle: 90);
  return img.encodeJpg(rotated);
}

Future<File> _normalizeImage(File originalFile) async {
  final bytes = await originalFile.readAsBytes();

  // Run on background thread
  final newBytes = await compute(_processImageIsolate, bytes);

  return originalFile.writeAsBytes(newBytes);
}

class DrawerCapture extends StatefulWidget {
  final String toolboxId;
  final String? drawerId;

  const DrawerCapture(this.toolboxId, this.drawerId, {super.key});

  @override
  State<DrawerCapture> createState() => _DrawerCaptureState();
}

class _DrawerCaptureState extends State<DrawerCapture> {
  int _currentIndex = 0;
  late Map<String, dynamic> _toolbox;
  late DocumentReference<Map<String, dynamic>> _auditDoc;
  Stream<DocumentSnapshot<Map<String, dynamic>>>? _drawerAuditStream;

  File? _localDrawerImage;
  bool _isUploadingImage = false;

  void _fetchDrawerAudit() async {
    final toolboxDoc = FirebaseFirestore.instance.collection('toolboxes').doc(widget.toolboxId);
    final toolboxResponse = await toolboxDoc.get();
    _toolbox = toolboxResponse.data()!;

    final auditId = _toolbox['lastAuditId'];

    _auditDoc = FirebaseFirestore.instance.collection('audits').doc(auditId);
    _drawerAuditStream = _auditDoc.snapshots();

    if (widget.drawerId != null) {
      _currentIndex = _toolbox['drawers'].indexWhere((drawer) => drawer['drawerId'] == widget.drawerId);
    }

    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _fetchDrawerAudit();
  }

  Future<void> _captureAndUploadImage(String drawerId) async {
    final image = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (image == null) return;

    final imageFile = File(image.path);
    final fileToUpload = await _normalizeImage(imageFile);

    // Show image immediately (before uploading)
    setState(() {
      _localDrawerImage = fileToUpload;
      _isUploadingImage = true;
    });

    final auditId = _toolbox['lastAuditId'];
    final extension = fileToUpload.path.split('.').last;
    final imageStoragePath = 'audits/$auditId/$drawerId.$extension';

    final storageRef = FirebaseStorage.instance.ref();
    final imageRef = storageRef.child(imageStoragePath);

    await imageRef.putFile(fileToUpload);

    _auditDoc.update({'drawerStates.$drawerId.imageStoragePath': imageStoragePath});

    setState(() {
      _isUploadingImage = false;
    });
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
              imageDisplay(drawerAudit['imageStoragePath']),
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

  Widget imageDisplay(String? imageStoragePath) {
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

    if (imageStoragePath == null) return blankImage;

    return FutureBuilder(
      future: FirebaseStorage.instance.ref().child(imageStoragePath).getDownloadURL(),
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
}
