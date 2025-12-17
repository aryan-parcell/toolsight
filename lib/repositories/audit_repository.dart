import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

class AuditRepository {
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');

  Stream<DocumentSnapshot<Map<String, dynamic>>> getAuditStream(String auditId) {
    return _auditsCollection.doc(auditId).snapshots();
  }

  Future<String> getImageUrl(String path) {
    return FirebaseStorage.instance.ref().child(path).getDownloadURL();
  }

  Future<void> updateToolStatus(String auditId, String drawerId, String toolId, String newStatus) {
    return _auditsCollection.doc(auditId).update({'drawerStates.$drawerId.results.$toolId': newStatus});
  }

  Future<void> confirmDrawerResults(String auditId, String drawerId, Map<String, dynamic> auditData, Map<String, dynamic> toolboxData) async {
    var auditDoc = _auditsCollection.doc(auditId);

    await auditDoc.update({'drawerStates.$drawerId.drawerStatus': 'user-validated'});

    final isAuditComplete = auditData['drawerStates'].entries.every(
      (entry) => entry.value['drawerStatus'] == 'user-validated' || entry.key == drawerId,
    );

    if (isAuditComplete) {
      await auditDoc.update({'status': 'complete', 'endTime': FieldValue.serverTimestamp()});

      // Handle Periodic Audit Scheduling
      final profile = toolboxData['auditProfile'];
      Timestamp? nextDue;
      if (profile['shiftAuditType'] == 'periodic') {
        final freq = profile['periodicFrequencyHours'];
        final nextDueDate = DateTime.now().add(Duration(hours: freq));
        nextDue = Timestamp.fromDate(nextDueDate);
      }

      final checkoutDoc = _checkoutsCollection.doc(auditData['checkoutId']);
      checkoutDoc.update({
        'currentAuditId': null,
        'auditStatus': 'complete',
        'lastAuditTime': FieldValue.serverTimestamp(),
        'nextAuditDue': nextDue,
      });
    }
  }
}
