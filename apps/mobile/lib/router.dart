/*
  * This file defines the routing configuration for the Toolsight mobile application using the GoRouter package.
  * It includes route definitions, redirection logic, and error handling for navigation.
  */
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/pages/serviceability.dart';
import 'package:toolsight/pages/drawer_capture.dart';
import 'package:toolsight/pages/drawer_page.dart';
import 'package:toolsight/pages/home.dart';
import 'package:toolsight/pages/login.dart';
import 'package:toolsight/pages/manual_entry.dart';
import 'package:toolsight/pages/scan_toolbox.dart';
import 'package:toolsight/pages/toolbox_page.dart';

/*
  Enumeration allowing for easy reference of pages. Each has a path and a name field.
*/
enum AppRoute {
  home(path: '/', name: 'home'),
  login(path: '/login', name: 'login'),
  manualEntry(path: '/manualEntry', name: 'manualEntry'),
  scanToolbox(path: '/scanToolbox', name: 'scanToolbox'),
  toolbox(path: '/toolbox/:toolbox_id', name: 'toolbox'),
  capture(path: 'capture', name: 'capture'), // Sub-route
  complete(path: 'complete', name: 'complete'), // Sub-route
  drawer(path: ':drawer_id', name: 'drawer'); // Sub-route

  final String path;
  final String name;

  const AppRoute({required this.path, required this.name});
}

/*
  Function to create the GoRouter instance with defined routes, redirection logic, and error handling.
*/
GoRouter createRouter() {
  return GoRouter(
    //Handles errors and redirects to login screen. Prints error.
    onException: (context, state, router) {
      debugPrint("Router Exception: ${state.error}");
      router.go(AppRoute.login.path);
    },
    //Checks to see if user is logged in. If not, redirects to the login page.
    redirect: (context, state) {
      if (FirebaseAuth.instance.currentUser == null) return AppRoute.login.path;
      return null;
    },
    //Defines the routes for the application.
    routes: [
      GoRoute(
        //Defines path and name to the route.
        path: AppRoute.home.path,
        name: AppRoute.home.name,
        //Context gives widgets, and state is url info. => creates page to return to GoRoute.
        builder: (context, state) => const Home(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const Login(),
      ),
      GoRoute(
        path: AppRoute.manualEntry.path,
        name: AppRoute.manualEntry.name,
        builder: (context, state) => const ManualEntry(),
      ),
      GoRoute(
        path: AppRoute.scanToolbox.path,
        name: AppRoute.scanToolbox.name,
        builder: (context, state) => const ScanToolbox(),
      ),
      // Defines the toolbox route with sub-routes for capture, complete, and drawer.
      GoRoute(
        path: AppRoute.toolbox.path,
        name: AppRoute.toolbox.name,
        builder: (context, state) => ToolboxPage(state.pathParameters['toolbox_id']!),
        routes: [
          GoRoute(
            path: AppRoute.capture.path,
            name: AppRoute.capture.name,
            builder: (context, state) {
              final toolboxId = state.pathParameters['toolbox_id']!;
              final auditId = state.uri.queryParameters['audit_id']!;
              final drawerId = state.extra as String?;

              return DrawerCapture(toolboxId, auditId, initialDrawerId: drawerId);
            },
          ),
          GoRoute(
            path: AppRoute.complete.path,
            name: AppRoute.complete.name,
            builder: (context, state) => ServiceabilityQuestionnaire(state.pathParameters['toolbox_id']!),
          ),
          GoRoute(
            path: AppRoute.drawer.path,
            name: AppRoute.drawer.name,
            builder: (context, state) {
              final params = state.pathParameters;
              return DrawerPage(params['toolbox_id']!, params['drawer_id']!);
            },
          ),
        ],
      ),
    ],
  );
}
