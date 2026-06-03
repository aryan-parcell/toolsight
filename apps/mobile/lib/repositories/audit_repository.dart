import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:toolsight/utils.dart';

class AuditRepository {
  final _storage = FirebaseStorage.instance;
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');
  final _functions = FirebaseFunctions.instance;

  Stream<DocumentSnapshot<Map<String, dynamic>>> getAuditStream(String auditId) {
    return _auditsCollection.doc(auditId).snapshots();
  }

  Future<String> ensureActiveAudit(String toolboxId) async {
    final auditDoc = _auditsCollection.doc();
    final toolboxDoc = _toolboxesCollection.doc(toolboxId);

    return FirebaseFirestore.instance.runTransaction((t) async {
      final toolboxSnap = await t.get(toolboxDoc);
      if (!toolboxSnap.exists) throw StateError("Invalid toolbox.");
      final toolbox = toolboxSnap.data()!;

      final currentCheckoutId = toolbox['currentCheckoutId'];

      final checkoutDoc = _checkoutsCollection.doc(currentCheckoutId);
      final checkoutSnap = await t.get(checkoutDoc);
      if (!checkoutSnap.exists) throw StateError("Invalid checkout.");
      final checkout = checkoutSnap.data()!;

      // If an audit is already active, return its ID
      final currentAuditId = checkout['currentAuditId'];
      if (currentAuditId != null) return currentAuditId;

      final now = DateTime.now();

      // If not, start a new "At-Will" audit
      t.set(auditDoc, {
        'checkoutId': currentCheckoutId,
        'toolboxId': toolboxId,
        'startTime': now,
        'endTime': null,
        'drawerStates': createAuditDrawerStatesFromToolbox(toolbox),
        'organizationId': toolbox['organizationId'],
      });

      t.update(checkoutDoc, {
        // audit scheduling
        'nextAuditDue': now,
        // audit info
        'currentAuditId': auditDoc.id,
        'auditStatus': 'active',
      });

      t.update(toolboxDoc, {
        'lastAuditId': auditDoc.id,
      });

      return auditDoc.id;
    });
  }

  Future<void> uploadDrawerImage(String auditId, String drawerId, String organizationId, File imageFile, double aspectRatio) async {
    final ref = _storage.ref('organizations/$organizationId/audits/$auditId/$drawerId.jpg');
    await ref.putFile(imageFile);

    final imageUrl = await ref.getDownloadURL();

    await _auditsCollection.doc(auditId).update({
      'drawerStates.$drawerId.imageUrl': imageUrl,
      'drawerStates.$drawerId.aspectRatio': aspectRatio,
    });
  }

  Future<void> updateToolStatus(String auditId, String drawerId, String toolId, String newStatus) {
    return _auditsCollection.doc(auditId).update({'drawerStates.$drawerId.results.$toolId.status': newStatus});
  }

  Future<void> confirmDrawerResults(String auditId, String drawerId, Map<String, dynamic> auditData, Map<String, dynamic> toolboxData) async {
    var auditDoc = _auditsCollection.doc(auditId);

    await auditDoc.update({'drawerStates.$drawerId.drawerStatus': 'user-validated'});

    final isAuditComplete = auditData['drawerStates'].entries.every(
      (entry) => entry.value['drawerStatus'] == 'user-validated' || entry.key == drawerId,
    );

    if (isAuditComplete) {
      try {
        await _functions.httpsCallable('completeAudit').call({'auditId': auditId});
      } on FirebaseFunctionsException catch (e) {
        throw StateError(e.message ?? 'An error occurred during audit finalization.');
      } catch (e) {
        throw StateError(e.toString());
      }
    }
  }
}
