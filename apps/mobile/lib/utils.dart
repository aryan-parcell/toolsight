/*
  * Function to create audit drawer states from a toolbox.
  * @param toolbox The toolbox data.
  * @return A map of drawer states.
  */
Map<String, dynamic> createAuditDrawerStatesFromToolbox(Map<String, dynamic> toolbox) {
  final Map<String, dynamic> drawerStates = {};

  // Initialize drawer states
  for (final drawer in toolbox['drawers']) {
    final drawerId = drawer['drawerId'];
    drawerStates[drawerId] = {
      'drawerStatus': 'pending',
      'imageUrl': null,
      'results': {},
    };
  }

  // Populate tool results
  for (final tool in toolbox['tools']) {
    final drawerId = tool['drawerId'];
    final toolId = tool['toolId'];
    drawerStates[drawerId]['results'][toolId] = {
      'toolId': toolId,
      'status': 'absent',
      'confidence': "low",
      'toolInfo': tool['toolInfo']
    };
  }

  return drawerStates;
}
