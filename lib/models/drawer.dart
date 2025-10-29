class Drawer {
  final String id;
  final String name;
  final int present;
  final int total;
  final Map<String, int> toolStatus;

  Drawer({
    required this.id,
    required this.name,
    required this.present,
    required this.total,
    required this.toolStatus,
  });
}
