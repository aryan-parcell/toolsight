import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:toolsight/widgets/text_input_section.dart';
import 'package:toolsight/widgets/wide_button.dart';
import 'package:toolsight/router.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _login() async {
    // TODO implement backend
    context.goNamed(AppRoute.home.name);
  }

  Future<void> _register() async {
    // TODO implement backend
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 100),
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
                TextInputSection(
                  label: "Username",
                  hintText: "Enter your username",
                  controller: _usernameController,
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
            Row(
              spacing: 10,
              children: [
                WideButton(
                  text: "Register Now",
                  onPressed: _register,
                ),
                WideButton(
                  text: "Login",
                  onPressed: _login,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
