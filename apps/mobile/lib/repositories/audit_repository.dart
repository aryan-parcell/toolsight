import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:toolsight/utils.dart';

class AuditRepository {
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');

  Stream<DocumentSnapshot<Map<String, dynamic>>> getAuditStream(String auditId) {
    return _auditsCollection.doc(auditId).snapshots();
  }

  Future<String> ensureActiveAudit(String toolboxId, String checkoutId) async {
    final auditDoc = _auditsCollection.doc();
    final toolboxDoc = _toolboxesCollection.doc(toolboxId);
    final checkoutDoc = _checkoutsCollection.doc(checkoutId);

    return FirebaseFirestore.instance.runTransaction((t) async {
      final toolboxSnap = await t.get(toolboxDoc);
      final checkoutSnap = await t.get(checkoutDoc);
      if (!checkoutSnap.exists || !toolboxSnap.exists) throw "Invalid checkout or toolbox.";

      // If an audit is already active, return its ID
      final currentAuditId = checkoutSnap.data()?['currentAuditId'];
      if (currentAuditId != null) return currentAuditId;

      final now = DateTime.now();

      // If not, start a new "At-Will" audit
      t.set(auditDoc, {
        'checkoutId': checkoutId,
        'startTime': now,
        'endTime': null,
        'drawerStates': createAuditDrawerStatesFromToolbox(toolboxSnap.data()!),
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
