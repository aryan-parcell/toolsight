import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';

class CheckoutRepository {
  // References to Firestore collections and Firebase services used by the repository.
  final _checkoutsCollection = FirebaseFirestore.instance.collection('checkouts');
  final _usersCollection = FirebaseFirestore.instance.collection('users');
  final _auth = FirebaseAuth.instance;
  final _functions = FirebaseFunctions.instance;


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

  // Returns a stream of checkout data for the given checkout ID.
  Stream<DocumentSnapshot<Map<String, dynamic>>> getCheckoutStream(String checkoutId) {
    return _checkoutsCollection.doc(checkoutId).snapshots();
  }

  // Function to check out a toolbox by calling the 'checkOutToolbox' Cloud Function with the toolbox ID.
  Future<void> checkOutToolbox(String eid) async {
    try {
      await _functions.httpsCallable('checkOutToolbox').call({'toolboxId': eid});
    } on FirebaseFunctionsException catch (e) {
      throw StateError(e.message ?? 'An error occurred during checkout.');
    } catch (e) {
      throw StateError(e.toString());
    }
  }

  // Function to close a toolbox by calling the 'returnToolbox' Cloud Function with the toolbox ID.
  Future<void> closeToolbox(String toolboxId) async {
    try {
      await _functions.httpsCallable('returnToolbox').call({'toolboxId': toolboxId});
    } on FirebaseFunctionsException catch (e) {
      throw StateError(e.message ?? 'An error occurred during return.');
    } catch (e) {
      throw StateError(e.toString());
    }
  }
}

