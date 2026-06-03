import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/repositories/user_repository.dart';
import 'package:toolsight/router.dart';
import 'package:toolsight/widgets/app_scaffold.dart';
import 'package:toolsight/widgets/text_input_section.dart';
import 'package:toolsight/widgets/wide_button.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  final _userRepo = UserRepository();

  bool _isRegistering = false;

  Future<void> _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) return;

    try {
      await _auth.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Sync user data & token before navigating home
      _userRepo.syncCurrentUser();

      if (mounted) context.goNamed(AppRoute.home.name);
    } on FirebaseAuthException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message ?? "Login failed.")));
    }
  }

  Future<void> _register({String? selectedOrgId}) async {
    var email = _emailController.text.trim();
    var name = _nameController.text.trim();
    var password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty || name.isEmpty) return;

    try {
      final result = await _userRepo.registerMaintainer(
        email: email,
        name: name,
        password: password,
        organizationId: selectedOrgId,
      );

      if (result['success'] == true) {
        // Sign in manually since the Cloud Function created the Auth user
        await _auth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        // Sync user data & token before navigating home
        _userRepo.syncCurrentUser();

        if (mounted) context.goNamed(AppRoute.home.name);
      } else if (result['requiresSelection'] == true) {
        final organizations = (result['organizations'] as List).cast<Map>();

        if (!mounted) return;

        String? localSelectedId;
        final String? selectedId = await showDialog<String>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) {
              return AlertDialog(
                title: const Text("Select Organization"),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("You have multiple invitations. Please select which organization to join:"),
                    const SizedBox(height: 20),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: "Choose Your Organization",
                      ),
                      items: organizations
                          .map(
                            (org) => DropdownMenuItem<String>(
                              value: org['id'] as String,
                              child: Text(org['name'] as String),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setDialogState(() => localSelectedId = value),
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Cancel"),
                  ),
                  FilledButton(
                    onPressed: localSelectedId == null ? null : () => Navigator.pop(context, localSelectedId),
                    child: const Text("Confirm"),
                  ),
                ],
              );
            },
          ),
        );

        if (selectedId != null) {
          await _register(selectedOrgId: selectedId);
        }
      }
    } on StateError catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      allowBack: false,
      allowLogout: false,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: 20,
                children: [
                  const Center(
                    child: Text(
                      "ToolSight",
                      style: TextStyle(fontSize: 45, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Column(
                    spacing: 10,
                    children: [
                      if (_isRegistering) ...[
                        TextInputSection(
                          label: "Display Name",
                          hintText: "Enter your display name",
                          controller: _nameController,
                          obscureText: false,
                        ),
                      ],
                      TextInputSection(
                        label: "Email",
                        hintText: "Enter your email",
                        controller: _emailController,
                        obscureText: false,
                      ),
                      TextInputSection(
                        label: "Password",
                        hintText: "Enter your password",
                        controller: _passwordController,
                        obscureText: true,
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Row(
                        children: [
                          WideButton(
                            text: _isRegistering ? "Register Now" : "Log In",
                            onPressed: _isRegistering ? _register : _login,
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => setState(() => _isRegistering = !_isRegistering),
                        child: Text(
                          _isRegistering ? "Have an account? Log In!" : "No account? Register Now!",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
