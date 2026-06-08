import 'package:cloud_firestore/cloud_firestore.dart';

class ToolboxRepository {
  // Reference to the 'toolboxes' collection in Firestore.
  final _toolboxesCollection = FirebaseFirestore.instance.collection('toolboxes');

  // Returns a stream of toolbox data for the given toolbox ID (eid).
  // This allows for real-time updates to the toolbox data in the app.
  Stream<DocumentSnapshot<Map<String, dynamic>>> getToolboxStream(String eid) {
    return _toolboxesCollection.doc(eid).snapshots();
  }

  // Fetches the toolbox data for the given toolbox ID (eid) as a one-time operation.
  Future<Map<String, dynamic>> getToolbox(String eid) async {
    final response = await _toolboxesCollection.doc(eid).get();
    return response.data()!;
  }
}
