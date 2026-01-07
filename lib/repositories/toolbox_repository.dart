import 'package:cloud_firestore/cloud_firestore.dart';

class ToolboxRepository {
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');

  Stream<DocumentSnapshot<Map<String, dynamic>>> getToolboxStream(String eid) {
    return _toolboxesCollection.doc(eid).snapshots();
  }

  Future<Map<String, dynamic>> getToolbox(String eid) async {
    final response = await _toolboxesCollection.doc(eid).get();
    return response.data()!;
  }
}
