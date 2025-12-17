import 'package:cloud_firestore/cloud_firestore.dart';

class CheckoutRepository {
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');

  Stream<DocumentSnapshot<Map<String, dynamic>>> getCheckoutStream(String checkoutId) {
    return _checkoutsCollection.doc(checkoutId).snapshots();
  }

  Future<void> closeToolbox(String toolboxId, String checkoutId) async {
    final toolboxDoc = _toolboxesCollection.doc(toolboxId);
    final checkoutDoc = _checkoutsCollection.doc(checkoutId);

    await FirebaseFirestore.instance.runTransaction((t) async {
      final checkoutSnapshot = await t.get(checkoutDoc);
      if (!checkoutSnapshot.exists) throw StateError('Invalid Checkout ID');

      final checkout = checkoutSnapshot.data()!;
      if (checkout['auditStatus'] != 'complete') throw StateError('Please complete the audit first.');

      final profile = checkout['auditProfile'];
      if (profile['requireOnReturn']) {
        final lastAuditTimestamp = checkout['lastAuditTime'] as Timestamp?;
        if (lastAuditTimestamp == null) throw StateError('Final audit required.');

        final lastAuditDate = lastAuditTimestamp.toDate();
        final diff = DateTime.now().difference(lastAuditDate).inMinutes;
        if (diff > 15) throw StateError('Final audit required (Last check was ${diff}m ago).');
      }

      t.update(checkoutDoc, {
        'status': 'complete',
        'returnTime': FieldValue.serverTimestamp(),
      });

      t.update(toolboxDoc, {
        'status': 'available',
        'currentUserId': null,
        'currentCheckoutId': null,
      });
    });
  }
}
