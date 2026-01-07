import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:toolsight/app.dart';
import 'package:toolsight/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const App());
}
