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

    final checkout = (await checkoutDoc.get()).data()!;
    if (checkout['auditStatus'] != 'complete') throw 'Please complete the audit first.';

    await checkoutDoc.update({
      'returnTime': DateTime.now(),
      'status': 'complete',
    });

    await toolboxDoc.update({
      'status': 'available',
      'currentUserId': null,
      'currentCheckoutId': null,
    });
  }
}
