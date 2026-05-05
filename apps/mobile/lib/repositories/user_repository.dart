import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class UserRepository {
  final _db = FirebaseFirestore.instance;
  final _fcm = FirebaseMessaging.instance;
  final _auth = FirebaseAuth.instance;
  final _functions = FirebaseFunctions.instance;

  Future<void> handleMaintainerRegistration(String organizationId, String displayName) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _functions.httpsCallable('createMaintainer').call({
      'displayName': displayName,
      'organizationId': organizationId,
    });
  }

  /// Syncs the current user's profile and FCM token to Firestore.
  /// Call this after a successful login or app startup.
  Future<void> syncCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return;

    // Request permission for notifications (critical for iOS)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    String? token;
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      token = await _fcm.getToken();
    }

    await _db.collection('users').doc(user.uid).update({
      if (token != null) 'fcmToken': token,
      'lastLogin': DateTime.now(),
    });
  }
}
