import 'package:cloud_firestore/cloud_firestore.dart';

final toolboxes = [
  {
    'name': 'ToolBox #1',
    'organization_id': '1',
    'drawers': [
      {'drawerId': 'd0', 'drawerName': 'Drawer #1'},
      {'drawerId': 'd1', 'drawerName': 'Drawer #2'},
    ],
    'tools': [
      {'toolId': 't0', 'drawerId': 'd0', 'toolName': 'Wrench 10mm'},
      {'toolId': 't1', 'drawerId': 'd1', 'toolName': 'Hammer'},
    ],
    'status': 'available',
    'currentUserId': null,
    'currentCheckoutId': null,
    'lastAuditId': null,
  },
  {
    'name': 'ToolBox #2',
    'organization_id': '1',
    'drawers': [
      {'drawerId': 'd0', 'drawerName': 'Drawer #1'},
    ],
    'tools': [
      {'toolId': 't0', 'drawerId': 'd0', 'toolName': 'High Precision Calipers'},
      {'toolId': 't1', 'drawerId': 'd0', 'toolName': 'Screwdriver'},
    ],
    'status': 'available',
    'currentUserId': null,
    'currentCheckoutId': null,
    'lastAuditId': null,
  },
  {
    'name': 'ToolBox #3',
    'organization_id': '1',
    'drawers': [
      {'drawerId': 'd0', 'drawerName': 'Drawer #1'},
      {'drawerId': 'd1', 'drawerName': 'Drawer #2'},
      {'drawerId': 'd2', 'drawerName': 'Drawer #3'},
      {'drawerId': 'd3', 'drawerName': 'Drawer #4'},
    ],
    'tools': [
      {'toolId': 't0', 'drawerId': 'd0', 'toolName': 'Wrench 15mm'},
      {'toolId': 't1', 'drawerId': 'd0', 'toolName': 'Mallet'},
      {'toolId': 't2', 'drawerId': 'd1', 'toolName': 'Drill'},
      {'toolId': 't3', 'drawerId': 'd1', 'toolName': 'Hammer'},
      {'toolId': 't4', 'drawerId': 'd2', 'toolName': 'Soldering Iron'},
      {'toolId': 't5', 'drawerId': 'd2', 'toolName': 'Wrench 10mm'},
      {'toolId': 't6', 'drawerId': 'd3', 'toolName': 'Wrench 10mm'},
      {'toolId': 't7', 'drawerId': 'd3', 'toolName': 'Hammer'},
    ],
    'status': 'available',
    'currentUserId': null,
    'currentCheckoutId': null,
    'lastAuditId': null,
  },
];

final audits = [
  {
    'checkoutId': null,
    'startTime': DateTime.now(),
    'endTime': DateTime.now().add(const Duration(minutes: 1)),
    'drawerStates': {
      'd0': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't0': 'present',
        },
      },
      'd1': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't1': 'present',
        },
      },
    },
  },
  {
    'checkoutId': null,
    'startTime': DateTime.now(),
    'endTime': DateTime.now().add(const Duration(minutes: 1)),
    'drawerStates': {
      'd0': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't0': 'present',
          't1': 'present',
        },
      },
    },
  },
  {
    'checkoutId': null,
    'startTime': DateTime.now(),
    'endTime': DateTime.now().add(const Duration(minutes: 1)),
    'drawerStates': {
      'd0': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't0': 'present',
          't1': 'present',
        },
      },
      'd1': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't2': 'present',
          't3': 'present',
        },
      },
      'd3': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't4': 'present',
          't5': 'present',
        },
      },
      'd4': {
        'drawerStatus': 'user-validated',
        'imageStoragePath': null,
        'results': {
          't6': 'present',
          't7': 'present',
        },
      },
    },
  },
];

void addMockData() async {
  for (int i = 0; i < toolboxes.length; i++) {
    final toolbox = toolboxes[i];
    final audit = audits[i];

    final auditDoc = await FirebaseFirestore.instance.collection('audits').add(audit);

    toolbox['lastAuditId'] = auditDoc.id;

    await FirebaseFirestore.instance.collection('toolboxes').add(toolbox);
  }
}
