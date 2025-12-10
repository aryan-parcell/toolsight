import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/toolbox_display.dart';
import 'package:toolsight/widgets/wide_button.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  final Stream<QuerySnapshot> _checkoutStream = FirebaseFirestore.instance
      .collection('checkouts')
      .where('userId', isEqualTo: FirebaseAuth.instance.currentUser!.uid)
      .where('status', isEqualTo: 'active')
      .snapshots();

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 20,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Home", style: Theme.of(context).textTheme.headlineLarge),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              Text("Open New ToolBox", style: Theme.of(context).textTheme.titleLarge),
              Row(
                spacing: 10,
                children: [
                  WideButton(
                    text: "Manual Entry",
                    onPressed: () => context.pushNamed(AppRoute.manualEntry.name),
                  ),
                  WideButton(
                    text: "Scan QR Code",
                    onPressed: () => context.pushNamed(AppRoute.scanToolbox.name),
                  ),
                ],
              ),
            ],
          ),
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 10,
              children: [
                Text("Active ToolBoxes", style: Theme.of(context).textTheme.titleLarge),
                StreamBuilder<QuerySnapshot>(
                  stream: _checkoutStream,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Text("Error loading toolboxes", style: Theme.of(context).textTheme.bodySmall);
                    }
                    if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                      return Text("No active toolboxes.", style: Theme.of(context).textTheme.bodySmall);
                    }

                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      itemBuilder: (context, index) {
                        final data = snapshot.data!.docs[index].data() as Map<String, dynamic>;

                        return ToolBoxDisplay(data['toolboxId'], data['toolboxName'], data['auditStatus']);
                      },
                      separatorBuilder: (context, index) => SizedBox(height: 10),
                      itemCount: snapshot.data!.docs.length,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
