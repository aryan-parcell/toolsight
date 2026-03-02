import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/router.dart';
import 'package:google_fonts/google_fonts.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = createRouter();
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Theme Colors
    const axiomCyan = Color(0xFF00E5FF);
    const lightBg = Color(0xFFFFFFFF);
    const lightSurface = Color(0xFFFAFAFA);
    const lightBorder = Color(0xFF272727);

    return MaterialApp.router(
      title: 'ToolSight',
      themeMode: ThemeMode.system,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: lightBg,
        colorScheme: const ColorScheme.light(
          primary: axiomCyan,
          onPrimary: Colors.black,
          surface: lightSurface,
          outline: lightBorder,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: lightBg,
          foregroundColor: Colors.black,
        ),
      ),
      routerConfig: _router,
    );
  }
}
