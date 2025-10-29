import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/pages/home.dart';
import 'package:toolsight/pages/login.dart';
import 'package:toolsight/pages/manual_entry.dart';
import 'package:toolsight/pages/scan_toolbox.dart';
import 'package:toolsight/pages/toolbox_page.dart';

enum AppRoute {
  home(path: '/', name: 'home'),
  login(path: '/login', name: 'login'),
  register(path: '/register', name: 'register'),
  manualEntry(path: '/manualEntry', name: 'manualEntry'),
  scanToolbox(path: '/scanToolbox', name: 'scanToolbox'),
  toolbox(path: '/toolbox/:toolbox_id', name: 'toolbox'),
  drawer(path: ':drawer_id', name: 'drawer'), // Sub-route
  capture(path: 'capture', name: 'capture'), // Sub-route
  complete(path: 'complete', name: 'complete'); // Sub-route

  final String path;
  final String name;

  const AppRoute({required this.path, required this.name});
}

GoRouter createRouter() {
  return GoRouter(
    initialLocation: AppRoute.login.path,
    onException: (context, state, router) {
      debugPrint("Router Exception: ${state.error}");
      router.go(AppRoute.login.path);
    },
    routes: [
      GoRoute(
        path: AppRoute.home.path,
        name: AppRoute.home.name,
        builder: (context, state) => const Home(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const Login(),
      ),
      GoRoute(
        path: AppRoute.register.path,
        name: AppRoute.register.name,
        builder: (context, state) => const Text("Register Page"),
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
      GoRoute(
        path: AppRoute.toolbox.path,
        name: AppRoute.toolbox.name,
        builder: (context, state) => ToolboxPage(state.pathParameters['toolbox_id']!),
        routes: [
          GoRoute(
            path: AppRoute.drawer.path,
            name: AppRoute.drawer.name,
            builder: (context, state) {
              final params = state.pathParameters;
              return Text("Drawer: ${params['drawer_id']} in Toolbox: ${params['toolbox_id']}");
            },
            routes: [
              GoRoute(
                path: AppRoute.capture.path,
                name: AppRoute.capture.name,
                builder: (context, state) {
                  final params = state.pathParameters;
                  return Text("Capture for Drawer: ${params['drawer_id']} in Toolbox: ${params['toolbox_id']}");
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoute.complete.path,
            name: AppRoute.complete.name,
            builder: (context, state) => Text("Complete Toolbox: ${state.pathParameters['toolbox_id']}"),
          ),
        ],
      ),
    ],
  );
}
