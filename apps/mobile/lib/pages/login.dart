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
  final _orgIdController = TextEditingController();
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
      _userRepo.syncCurrentUser(null);

      if (mounted) context.goNamed(AppRoute.home.name);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message ?? "Login failed.")),
      );
    }
  }

  Future<void> _register() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty || _orgIdController.text.isEmpty) return;

    try {
      await _auth.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Sync user data, token, and org id before navigating home
      _userRepo.syncCurrentUser(_orgIdController.text.trim());

      if (mounted) context.goNamed(AppRoute.home.name);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message ?? "Registration failed.")),
      );
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
                      if (_isRegistering)
                        TextInputSection(
                          label: "Organization ID",
                          hintText: "Enter your organization ID",
                          controller: _orgIdController,
                          obscureText: false,
                        ),
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
