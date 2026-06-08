// Repository for user-related operations, such as registration and syncing user data to Firestore.
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class UserRepository {
  // Firebase services used by the repository.
  final _db = FirebaseFirestore.instance;
  final _fcm = FirebaseMessaging.instance;
  final _auth = FirebaseAuth.instance;
  final _functions = FirebaseFunctions.instance;

  Future<Map<String, dynamic>> registerMaintainer({
    required String email,
    required String name,
    required String password,
    String? organizationId,
  }) async {
    final result = await _functions.httpsCallable('registerMaintainer').call({
      'email': email,
      'name': name,
      'password': password,
      'organizationId': ?organizationId,
    });
    return Map<String, dynamic>.from(result.data as Map);
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
      // Get the FCM token for the device to enable push notifications.
      token = await _fcm.getToken();
    }

    // Update the user's Firestore document with the latest FCM token and last login time.
    await _db.collection('users').doc(user.uid).update({
      'fcmToken': ?token,
      'lastLogin': DateTime.now(),
    });
  }
}
