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
  final _passwordRepeatController = TextEditingController();

  final _nameController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  final _userRepo = UserRepository();

  bool _isRegistering = false;
  bool _passwordsMatch = true;

  //Creates listeners for the password and password repeat fields.
  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_passwordChange);
    _passwordRepeatController.addListener(_passwordChange);
  }

  //Disposes of controllers and listeners. This was a gemini suggestion.
  // general google searches confirms its importance for preventing memory leaks.
  @override
  dispose() {
    _passwordController.removeListener(_passwordChange);
    _passwordRepeatController.removeListener(_passwordChange);
    _emailController.dispose();
    _passwordController.dispose();
    _passwordRepeatController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  //function to check passwordMatch if passwords change.
  void _passwordChange() {
    if (_passwordController.text != _passwordRepeatController.text &&
        _passwordRepeatController.text.isNotEmpty) {
      _passwordsMatch = false;
    } else {
      _passwordsMatch = true;
    }
    setState(() {});
  }

  Future<void> _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty)
      return;

    try {
      await _auth.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Sync user data & token before navigating home
      _userRepo.syncCurrentUser();

      if (mounted) context.goNamed(AppRoute.home.name);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message ?? "Login failed.")),
      );
    }
  }

  Future<void> _register({String? selectedOrgId}) async {
    var email = _emailController.text.trim();
    var name = _nameController.text.trim();
    var password = _passwordController.text.trim();

    //Won't let user attempt registration if fields empty or passwords don't match.
    if (email.isEmpty || password.isEmpty || name.isEmpty || !_passwordsMatch)
      return;

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
                    const Text(
                      "You have multiple invitations. Please select which organization to join:",
                    ),
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
                      onChanged: (value) =>
                          setDialogState(() => localSelectedId = value),
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Cancel"),
                  ),
                  FilledButton(
                    onPressed: localSelectedId == null
                        ? null
                        : () => Navigator.pop(context, localSelectedId),
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
    } on Exception catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
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
                      style: TextStyle(
                        fontSize: 45,
                        fontWeight: FontWeight.bold,
                      ),
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
                      //New text field. Only displays when registering, then checks for password matching.
                      if (_isRegistering) ...[
                        TextInputSection(
                          label: "Confirm Password",
                          hintText: "Confirm your password",
                          controller: _passwordRepeatController,
                          obscureText: true,
                        ),
                        if (!_passwordsMatch)
                          const Text(
                            "*Passwords do not match",
                            style: TextStyle(color: Colors.red),
                          ),
                      ],
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
                        onPressed: () => setState(() {
                          //Sets passwordsMatch back to original true state to prevent error message 
                          //from showing when switching between login/register modes. Clears password repeat field 
                          //to prevent confusion.
                          _isRegistering = !_isRegistering;
                          _passwordsMatch = true;
                          _passwordRepeatController.clear();
                        }),
                        child: Text(
                          _isRegistering
                              ? "Have an account? Log In!"
                              : "No account? Register Now!",
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
