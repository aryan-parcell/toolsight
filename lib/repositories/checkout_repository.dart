import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class CheckoutRepository {
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _auth = FirebaseAuth.instance;

  Stream<DocumentSnapshot<Map<String, dynamic>>> getCheckoutStream(String checkoutId) {
    return _checkoutsCollection.doc(checkoutId).snapshots();
  }

  Map<String, dynamic> _createAuditDrawerStatesFromToolbox(Map<String, dynamic> toolbox) {
    final Map<String, dynamic> drawerStates = {};

    // Initialize drawer states
    for (final drawer in toolbox['drawers']) {
      final drawerId = drawer['drawerId'];
      drawerStates[drawerId] = {
        'drawerStatus': 'pending',
        'imageStoragePath': null,
        'results': {},
      };
    }

    // Populate tool results
    for (final tool in toolbox['tools']) {
      final drawerId = tool['drawerId'];
      final toolId = tool['toolId'];
      drawerStates[drawerId]['results'][toolId] = 'absent';
    }

    return drawerStates;
  }

  Future<void> checkOutToolbox(String eid) async {
    final toolboxDoc = _toolboxesCollection.doc(eid);
    final auditDoc = _auditsCollection.doc();
    final checkoutDoc = _checkoutsCollection.doc();

    await FirebaseFirestore.instance.runTransaction((t) async {
      final toolboxSnapshot = await t.get(toolboxDoc);
      if (!toolboxSnapshot.exists) throw Exception('Invalid ToolBox EID');

      final toolbox = toolboxSnapshot.data()!;
      if (toolbox['status'] != 'available') throw Exception('Unavailable ToolBox EID');

      final profile = toolbox['auditProfile'];

      String? initialAuditId;
      String auditStatus = 'complete';
      Timestamp? nextDue;

      if (profile['shiftAuditType'] == 'periodic') {
        nextDue = Timestamp.fromDate(DateTime.now().add(Duration(hours: profile['periodicFrequencyHours'])));
      }

      if (profile['requireOnCheckout']) {
        initialAuditId = auditDoc.id;
        auditStatus = 'active';
        nextDue = Timestamp.fromDate(DateTime.now().add(Duration(minutes: 15)));

        t.set(auditDoc, {
          'checkoutId': checkoutDoc.id,
          'startTime': FieldValue.serverTimestamp(),
          'endTime': null,
          'drawerStates': _createAuditDrawerStatesFromToolbox(toolbox),
          'status': 'active',
        });
      }

      // Create Checkout
      t.set(checkoutDoc, {
        'userId': _auth.currentUser!.uid,
        'toolboxId': eid,
        'checkoutTime': FieldValue.serverTimestamp(),
        'returnTime': null,
        // denormalized
        'status': 'active',
        'toolboxName': toolbox['name'],
        'auditProfile': profile,
        // audit scheduling
        'lastAuditTime': null,
        'nextAuditDue': nextDue,
        // audit info
        'currentAuditId': initialAuditId,
        'auditStatus': auditStatus,
      });

      // Update Toolbox
      t.update(toolboxDoc, {
        'status': 'checked-out',
        'currentUserId': _auth.currentUser!.uid,
        'currentCheckoutId': checkoutDoc.id,
        if (initialAuditId != null) 'lastAuditId': initialAuditId,
      });
    });
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
