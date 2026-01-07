import 'package:flutter/material.dart';

class TextInputSection extends StatefulWidget {
  const TextInputSection({
    super.key,
    required this.label,
    required this.hintText,
    required this.controller,
    required this.obscureText,
  });

  final String label;
  final String hintText;
  final TextEditingController controller;
  final bool obscureText;

  @override
  State<TextInputSection> createState() => _TextInputSectionState();
}

class _TextInputSectionState extends State<TextInputSection> {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 5,
      children: [
        Text(widget.label, style: Theme.of(context).textTheme.labelMedium),
        TextFormField(
          decoration: InputDecoration(
            hintText: widget.hintText,
            contentPadding: EdgeInsets.all(10),
            border: OutlineInputBorder(borderRadius: BorderRadius.zero),
          ),
          controller: widget.controller,
          obscureText: widget.obscureText,
        ),
      ],
    );
  }
}
