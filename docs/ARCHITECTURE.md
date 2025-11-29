# Dart JSON Validator — File Roles & Notes

This document lists responsibilities of key files in the extension and captures current observations plus suggestions for future improvements.

## File responsibilities

- src/views/validatorViewProvider.ts
  - Responsibility: Extension UI and orchestration.
  - Impact: Provides the Webview UI (JSON input, file picker, class name input, Validate button, output panel). Handles messages from UI for picking file and running validation. Posts results or error messages back to the webview.

- src/core/runner.ts
  - Responsibility: Prepare and build a disposable runner project under `.dart_model_tester`.
  - Impact: Produces `main.dart` that embeds the JSON and attempts to parse it with the target class. Supports:
    - Simple import mode — directly imports the model file using a relative path.
    - json_serializable mode — copies the model into the runner package, writes `pubspec.yaml`, runs `dart pub get` and `build_runner` to generate code, then sets package import path.
  - Side effects: Creates files and runs external `dart` commands; relies on local Dart SDK and build_runner being available.

- src/core/processRunner.ts
  - Responsibility: Execute the generated Dart script using `child_process.spawn`.
  - Impact: Collects stdout/stderr and returns `{ exitCode, output }` for caller to decide success or failure.

- src/core/reporter.ts
  - Responsibility: Parse runtime stack traces and produce a readable failure point.
  - Impact: Scans output for frames referencing `package:dart_model_tester/<file>:<line>:<col>`, reads the referenced file under `.dart_model_tester/lib` and returns the trimmed source line as `Failure Point: <line text>` or an error location if content can't be read.
  - Current behaviour:
    - The function `extractJsonKey` reads a specific line and returns the trimmed text (does not attempt to infer a JSON key or column-aware context).
    - `processErrorOutput` returns the first matching frame and yields a short, user-friendly message.

- src/extensions.ts
  - Responsibility: VS Code extension activation/registration.
  - Impact: Registers the Validator view provider and optionally focuses the view on start. Contains commented example code hinting at how to create diagnostics from stack traces.

## Future modifications

- Error mapping precision
  - Reporter currently returns the whole trimmed line from generated model code. Consider extracting the actual JSON field or token and presenting a pointer to column for better guidance.
  - For simple import mode (relative import), have reporter map back to the original source file (not the copied file in `.dart_model_tester/lib`) so diagnostics point at the user's model file.

- Multiple frames & selection
  - processErrorOutput stops at the first matched frame. In complex stack traces, consider collecting the most relevant frame (e.g., the earliest user-code frame) or present multiple candidates to the user.

- Build/run robustness
  - runner.ts assumes `dart`, build_runner and json_serializable are available; add preflight checks and clearer error messages if tooling is missing.
  - Ensure `pub get` and `build_runner` errors are surfaced to the UI in a friendly way.

- Security & input handling
  - Escape and validate JSON input more strictly. There is an escapeTriple function already; consider validating against malformed JSON and reporting specific parsing messages.

- UX improvements
  - Make output more actionable: extract and display exact file path and location in the user's project (source mapping).
  - Add clickable links in the webview results so the user can jump to the failing file/line in the editor.

- Testing & reliability
  - Add unit/integration tests:
    - For runner project generation (both modes).
    - For reporter's stack-trace parsing and line extraction.
    - For processRunner's command execution error handling.
  - Add timeouts for long-running `build_runner` and `dart` runs, with cancellation support from the UI.

- Cleanup & performance
  - Ensure temporary `.dart_model_tester` artifacts are cleaned up reliably and consider an option to keep them for debugging.
  - Avoid frequent rebuilds where not necessary — cache generated runner state when inputs haven't changed.

- Internationalization / Accessibility
  - Improve webview error messaging rather than using alerts. Consider using consistent colors and accessible controls.

This file should be used as a quick reference for maintainers and as a list of next steps when improving reliability and developer experience.