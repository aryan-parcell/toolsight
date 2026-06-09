import 'package:cloud_firestore/cloud_firestore.dart';

class TemplateRepository {
  // Reference to the 'toolboxes' collection in Firestore.
  final _templateCollection = FirebaseFirestore.instance.collection('templates');

  // Fetches the toolbox data for the given toolbox ID (eid) as a one-time operation.
  Future<Map<String, dynamic>> getTemplate(String templateID) async {
    final response = await _templateCollection.doc(templateID).get();
    return response.data()!;
  }
}
