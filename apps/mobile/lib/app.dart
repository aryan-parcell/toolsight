import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:toolsight/router.dart';

// Global theme notifier to allow for dynamic theme switching across the app.
final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);

class App extends StatefulWidget {
  const App({super.key});

  //Override to create the mutable state for this widget, which is used to manage the router and theme.
  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late GoRouter _router;

  //Initializes router.
  @override
  void initState() {
    super.initState();
    _router = createRouter();
  }
  //Disposes of router.
  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  /*
  Builds the MaterialApp with dynamic theming and router configuration. 
  The theme is determined by the value of themeNotifier, allowing for real-time theme switching.
  The routerConfig is set to the _router instance created in initState, 
  which defines the navigation structure of the app.
  */
  @override
  Widget build(BuildContext context) {
    // Theme Colors
    const axiomCyan = Color(0xFF00E5FF);
    const lightBg = Color(0xFFFFFFFF);
    const lightSurface = Color(0xFFFAFAFA);

    const darkBg = Color(0xFF090909);
    const darkSurface = Color(0xFF222222);

    return ValueListenableBuilder(
      valueListenable: themeNotifier,
      builder: (context, value, child) {
        return MaterialApp.router(
          title: 'ToolSight',
          themeMode: value,
          theme: ThemeData(
            brightness: Brightness.light,
            scaffoldBackgroundColor: lightBg,
            colorScheme: const ColorScheme.light(
              primary: axiomCyan,
              onPrimary: Colors.black,
              surface: lightSurface,
              outline: Colors.grey,
            ),
            textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
            appBarTheme: const AppBarTheme(
              backgroundColor: lightBg,
              foregroundColor: Colors.black,
              surfaceTintColor: Colors.transparent,
              scrolledUnderElevation: 0,
            ),
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: darkBg,
            colorScheme: const ColorScheme.dark(
              primary: axiomCyan,
              onPrimary: Colors.black,
              surface: darkSurface,
              outline: Colors.grey,
            ),
            textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
            appBarTheme: const AppBarTheme(
              backgroundColor: darkBg,
              foregroundColor: Colors.white,
              surfaceTintColor: Colors.transparent,
              scrolledUnderElevation: 0,
            ),
          ),
          routerConfig: _router,
        );
      },
    );
  }
}
