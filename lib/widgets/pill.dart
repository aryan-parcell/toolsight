import 'package:flutter/material.dart';

class Pill extends StatelessWidget {
  final String text;

  const Pill(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.black),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(text, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}
