import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:toolsight/app.dart';
import 'package:toolsight/firebase_options.dart';

//Configuration for local notifications on Android.
const channel = AndroidNotificationChannel(
  'toolsight_mobile_notifs',
  'Toolsight Mobile Notifications',
  description: 'This channel is used for important Toolsight notifications.',
  importance: Importance.max,
  playSound: true,
);

//Local notifications plugin.
final plugin = FlutterLocalNotificationsPlugin();

void main() async {
  //Ensures that plugin services are initialized before runApp is called.
  WidgetsFlutterBinding.ensureInitialized();

  //Initializes Firebase for current platform.
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  //Initializes local notifications. Sets up the logo to be displayed.
  await plugin.initialize(
    InitializationSettings(
      android: AndroidInitializationSettings('clear_logo'),
    ),
  );

  //Checks if the platform supports Android notifications and creates the notification channel.
  await plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(channel);

  //Sets the presentation options for foreground notifications to allow alert, badge, and sound.
  await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );

  //Runs the main application widget.
  runApp(const App());
}
