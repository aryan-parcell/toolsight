import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart';

class AuditRepository {
  final _storage = FirebaseStorage.instance;
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _functions = FirebaseFunctions.instance;

  Stream<DocumentSnapshot<Map<String, dynamic>>> getAuditStream(String auditId) {
    return _auditsCollection.doc(auditId).snapshots();
  }

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
