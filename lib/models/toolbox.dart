import 'drawer.dart';

class Toolbox {
  final String id;
  final String name;
  final bool needsAudit;
  final bool needsCalibration;
  final List<Drawer> drawers;

  Toolbox({
    required this.id,
    required this.name,
    required this.needsAudit,
    required this.needsCalibration,
    required this.drawers,
  });
}
