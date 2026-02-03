import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:toolsight/utils.dart';

class CheckoutRepository {
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _usersCollection = FirebaseFirestore.instance.collection('users');
  final _auth = FirebaseAuth.instance;

  Stream<QuerySnapshot> getMyActiveCheckouts() async* {
    final user = _auth.currentUser;
    if (user == null) return;

    // Fetch User Profile
    final userDoc = await _usersCollection.doc(user.uid).get();
    if (!userDoc.exists || userDoc.data() == null) return;

    // Extract organization ID
    final userData = userDoc.data() as Map<String, dynamic>;
    final orgId = userData['organizationId'];

    // Stream Checkouts with the required filter
    yield* _checkoutsCollection
        .where('userId', isEqualTo: user.uid)
        .where('organizationId', isEqualTo: orgId)
        .where('status', isEqualTo: 'active')
        .snapshots();
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> getCheckoutStream(String checkoutId) {
    return _checkoutsCollection.doc(checkoutId).snapshots();
  }

  Future<void> checkOutToolbox(String eid) async {
    final userId = _auth.currentUser!.uid;

    final userDoc = _usersCollection.doc(userId);
    final toolboxDoc = _toolboxesCollection.doc(eid);
    final auditDoc = _auditsCollection.doc();
    final checkoutDoc = _checkoutsCollection.doc();

    await FirebaseFirestore.instance.runTransaction((t) async {
      // 1. Fetch toolbox and user profile
      final userSnapshot = await t.get(userDoc);
      final toolboxSnapshot = await t.get(toolboxDoc);

      if (!userSnapshot.exists) throw StateError('Invalid User ID');
      if (!toolboxSnapshot.exists) throw StateError('Invalid ToolBox EID');

      final user = userSnapshot.data()!;
      final toolbox = toolboxSnapshot.data()!;

      // 2. Check if toolbox is available
      if (toolbox['status'] != 'available') throw StateError('Unavailable ToolBox EID');

      // 3. Check if the toolbox belongs to the user's organization
      if (user['organizationId'] != toolbox['organizationId']) throw StateError('Invalid Organization');

      // 4. Handle audit behavior
      final profile = toolbox['auditProfile'];

      String? initialAuditId;
      String auditStatus = 'complete';
      DateTime? nextDue;

      final now = DateTime.now();

      if (profile['shiftAuditType'] == 'periodic') {
        nextDue = now.add(Duration(hours: profile['periodicFrequencyHours']));
      }

      if (profile['requireOnCheckout']) {
        initialAuditId = auditDoc.id;
        auditStatus = 'active';
        nextDue = now;

        t.set(auditDoc, {
          'checkoutId': checkoutDoc.id,
          'startTime': now,
          'endTime': null,
          'drawerStates': createAuditDrawerStatesFromToolbox(toolbox),
          'organizationId': user['organizationId'],
        });
      }

      // 5. Create Checkout
      t.set(checkoutDoc, {
        'userId': _auth.currentUser!.uid,
        'toolboxId': eid,
        'checkoutTime': now,
        'returnTime': null,
        // denormalized
        'status': 'active',
        'toolboxName': toolbox['name'],
        'auditProfile': profile,
        'organizationId': user['organizationId'],
        // audit scheduling
        'lastAuditTime': null,
        'nextAuditDue': nextDue,
        // audit info
        'currentAuditId': initialAuditId,
        'auditStatus': auditStatus,
      });

      // 6. Update Toolbox
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
        'returnTime': DateTime.now(),
      });

      t.update(toolboxDoc, {
        'status': 'available',
        'currentUserId': null,
        'currentCheckoutId': null,
      });
    });
  }
}
