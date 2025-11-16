# Dart JSON Validator (Runtime Runner)
This VS Code extension runs user Dart model `fromJson` code inside the current workspace to validate a selected JSON payload. It creates a small temporary Dart runner, executes it using the local `dart` binary, captures stdout/stderr and displays results.


**Important:** this extension executes Dart code inside the workspace. It requires the Dart SDK to be installed and available on the user's PATH. The extension will prompt for consent the first time.


Quick test:
1. Open a JSON document and select the JSON text (or leave whole doc selected).
2. Open the Dart file containing the model class (or keep it in workspace).
3. Run command: `Dart: Parse JSON with model (run)` from the Command Palette.