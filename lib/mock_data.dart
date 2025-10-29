import 'package:toolsight/models/drawer.dart';
import 'package:toolsight/models/toolbox.dart';

final List<Toolbox> mockToolboxes = [
  Toolbox(
    id: '1',
    name: "ToolBox #1",
    needsAudit: true,
    needsCalibration: false,
    drawers: [
      Drawer(
        id: '1',
        name: "Drawer #1",
        present: 1,
        total: 2,
        toolStatus: {
          "Wrench 10mm": 0,
          "High Precision Calipers": 1,
        },
      ),
      Drawer(id: '2', name: "Drawer #2", present: 0, total: 0, toolStatus: {}),
      Drawer(
        id: '3',
        name: "Drawer #3",
        present: 2,
        total: 5,
        toolStatus: {
          "Wrench 10mm": 0,
          "High Precision Calipers": 1,
          "Hammer": 1,
          "Drill": 0,
          "Soldering Iron": 0,
        },
      ),
    ],
  ),
  Toolbox(
    id: '2',
    name: "ToolBox #2",
    needsAudit: false,
    needsCalibration: true,
    drawers: [
      Drawer(
        id: '1',
        name: "Drawer #1",
        present: 2,
        total: 2,
        toolStatus: {
          "Wrench 15mm": 1,
          "High Precision Calipers": 1,
        },
      ),
    ],
  ),
  Toolbox(
    id: '3',
    name: "ToolBox #3",
    needsAudit: false,
    needsCalibration: false,
    drawers: [
      Drawer(
        id: '1',
        name: "Drawer #1",
        present: 0,
        total: 2,
        toolStatus: {
          "Drill": 0,
          "Soldering Iron": 0,
        },
      ),
      Drawer(id: '2', name: "Drawer #2", present: 0, total: 0, toolStatus: {}),
    ],
  ),
  Toolbox(
    id: '4',
    name: "ToolBox #4",
    needsAudit: true,
    needsCalibration: true,
    drawers: [
      Drawer(id: '1', name: "Drawer #1", present: 0, total: 0, toolStatus: {}),
    ],
  ),
];
