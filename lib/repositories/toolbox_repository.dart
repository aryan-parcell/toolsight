import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ToolboxRepository {
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');
  final _auditsCollection = FirebaseFirestore.instance.collection('audits');
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _auth = FirebaseAuth.instance;

  Stream<DocumentSnapshot<Map<String, dynamic>>> getToolboxStream(String eid) {
    return _toolboxesCollection.doc(eid).snapshots();
  }

  Future<Map<String, dynamic>> getToolbox(String eid) async {
    final response = await _toolboxesCollection.doc(eid).get();
    return response.data()!;
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
    final response = await toolboxDoc.get();
    final toolbox = response.data();

    if (toolbox == null) throw 'Invalid ToolBox EID';
    if (toolbox['status'] != 'available') throw 'Unavailable ToolBox EID';

    final auditDoc = _auditsCollection.doc();
    final checkoutDoc = _checkoutsCollection.doc();

    await auditDoc.set({
      'checkoutId': checkoutDoc.id,
      'startTime': DateTime.now(),
      'endTime': null,
      'drawerStates': _createAuditDrawerStatesFromToolbox(toolbox),
      'status': 'active',
    });

    await checkoutDoc.set({
      'userId': _auth.currentUser!.uid,
      'toolboxId': eid,
      'checkoutTime': DateTime.now(),
      'returnTime': null,
      // denormalized
      'status': 'active',
      'toolboxName': toolbox['name'],
      'auditFrequencyInHours': toolbox['auditFrequencyInHours'],
      // audit scheduling
      'lastAuditTime': DateTime.now(),
      'nextAuditDue': DateTime.now().add(Duration(hours: toolbox['auditFrequencyInHours'])),
      // audit info
      'currentAuditId': auditDoc.id,
      'auditStatus': 'pending',
    });

    await toolboxDoc.update({
      'status': 'checked-out',
      'currentUserId': _auth.currentUser!.uid,
      'currentCheckoutId': checkoutDoc.id,
      'lastAuditId': auditDoc.id,
    });
  }
}
