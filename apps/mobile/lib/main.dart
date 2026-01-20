import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:toolsight/app.dart';
import 'package:toolsight/firebase_options.dart';

const channel = AndroidNotificationChannel(
  'toolsight_mobile_notifs',
  'Toolsight Mobile Notifications',
  description: 'This channel is used for important Toolsight notifications.',
  importance: Importance.max,
  playSound: true,
);

final plugin = FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  await plugin.initialize(
    InitializationSettings(
      android: AndroidInitializationSettings('clear_logo'),
    ),
  );

  await plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(channel);

  await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );

  runApp(const App());
}
