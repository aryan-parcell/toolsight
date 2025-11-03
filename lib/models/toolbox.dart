import 'drawer.dart';

class Toolbox {
  final String id;
  final String name;
  final bool needsAudit;
  final List<Drawer> drawers;

  Toolbox({
    required this.id,
    required this.name,
    required this.needsAudit,
    required this.drawers,
  });
}
