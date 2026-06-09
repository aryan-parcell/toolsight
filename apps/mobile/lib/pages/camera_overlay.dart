import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart'; 

class CameraOverlay extends StatefulWidget {
  final String? referenceImageUrl;

  const CameraOverlay({this.referenceImageUrl, super.key});

  @override
  State<CameraOverlay> createState() => _CameraOverlayState();
}

class _CameraOverlayState extends State<CameraOverlay> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    _cameras = await availableCameras();
    if (_cameras == null || _cameras!.isEmpty) return;

    // Use the primary back-facing camera
    _controller = CameraController(_cameras![0], ResolutionPreset.high);
    await _controller!.initialize();

    if (!mounted) return;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _controller == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: Stack(
        children: [
          // Layer 1: The Live Camera Viewfinder
          Positioned.fill(
            child: CameraPreview(_controller!),
          ),

          // Layer 2: The Semi-Transparent Ghost Overlay Image
          if (widget.referenceImageUrl != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.35, // Adjust this value for better transparency contrast
                child: Image.network(
                  widget.referenceImageUrl!,
                  fit: BoxFit.cover, 
                ),
              ),
            ),

          // Layer 3: Capture Action Button Overlay
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton(
                backgroundColor: Colors.white,
                child: const Icon(Icons.camera_alt, color: Colors.black),
                onPressed: () async {
                  try {
                    final XFile capturedFile = await _controller!.takePicture();
                    if (mounted) context.pop();
                  } catch (e) {
                    debugPrint("Error taking picture: $e");
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}