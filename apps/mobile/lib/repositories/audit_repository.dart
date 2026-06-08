import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart';

class AuditRepository {
  // Firebase services used by the repository.
  final _storage = FirebaseStorage.instance;
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _functions = FirebaseFunctions.instance;

  // Returns a stream of audit data for the given audit ID.
  Stream<DocumentSnapshot<Map<String, dynamic>>> getAuditStream(String auditId) {
    return _auditsCollection.doc(auditId).snapshots();
  }

  // Ensures there is an active audit for the given toolbox ID and returns the audit ID.
  Future<String> ensureActiveAudit(String toolboxId) async {
    try {
      final result = await _functions.httpsCallable('ensureActiveAudit').call({'toolboxId': toolboxId});
      return result.data['auditId'] as String;
    } on FirebaseFunctionsException catch (e) {
      throw StateError(e.message ?? 'An error occurred while ensuring active audit.');
    } catch (e) {
      throw StateError(e.toString());
    }
  }

  // Discards the active audit for the given toolbox ID by calling the 'discardActiveAudit' Cloud Function.
  Future<void> discardActiveAudit(String toolboxId) async {
    try {
      await _functions.httpsCallable('discardActiveAudit').call({'toolboxId': toolboxId});
    } on FirebaseFunctionsException catch (e) {
      throw StateError(e.message ?? 'An error occurred while discarding active audit.');
    } catch (e) {
      throw StateError(e.toString());
    }
  }

  // Uploads an image for a specific drawer in an audit and updates the audit document with the image URL and aspect ratio.
  Future<void> uploadDrawerImage(String auditId, String drawerId, String organizationId, File imageFile, double aspectRatio) async {
    final ref = _storage.ref('organizations/$organizationId/audits/$auditId/$drawerId.jpg');
    await ref.putFile(imageFile);

    final imageUrl = await ref.getDownloadURL();

    await _auditsCollection.doc(auditId).update({
      'drawerStates.$drawerId.imageUrl': imageUrl,
      'drawerStates.$drawerId.aspectRatio': aspectRatio,
    });
  }

  // Updates the status of a specific tool in a drawer for an audit.
  Future<void> updateToolStatus(String auditId, String drawerId, String toolId, String newStatus) {
    return _auditsCollection.doc(auditId).update({'drawerStates.$drawerId.results.$toolId.status': newStatus});
  }

  Future<void> confirmDrawerResults(String auditId, String drawerId, Map<String, dynamic> auditData, Map<String, dynamic> toolboxData) async {
    //gets auditDoc
    var auditDoc = _auditsCollection.doc(auditId);

    // Update the drawer status to 'user-validated'
    await auditDoc.update({'drawerStates.$drawerId.drawerStatus': 'user-validated'});

    // Check if all drawers are validated.
    final isAuditComplete = auditData['drawerStates'].entries.every(
      (entry) => entry.value['drawerStatus'] == 'user-validated' || entry.key == drawerId,
    );

    // If the audit is complete, call the 'completeAudit' Cloud Function to finalize the audit and update the toolbox status.
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
