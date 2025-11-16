import * as vscode from "vscode";
import * as path from "path";

export function createDiagnostics(
  context: vscode.ExtensionContext,
  workspaceRoot: string,
  output: string
) {
  const diagCollection = vscode.languages.createDiagnosticCollection(
    "dart-json-validator"
  );
  context.subscriptions.push(diagCollection);

  // Clear previous diagnostics
  diagCollection.clear();

  // Find stacktrace section
  const start = output.indexOf("STACKTRACE_START");
  const end = output.indexOf("STACKTRACE_END");

  if (start === -1 || end === -1) return;

  const stack = output.substring(start + 17, end).trim();
  const lines = stack.split("\n");

  const regex = /\((.*):(\d+):(\d+)\)/; // matches (lib/user.dart:24:18)

  for (const line of lines) {
    const match = line.match(regex);
    if (!match) continue;

    const file = match[1];
    const lineNum = parseInt(match[2], 10) - 1; // 0-based
    const colNum = parseInt(match[3], 10) - 1;

    const absPath = path.join(workspaceRoot, file);

    const range = new vscode.Range(
      new vscode.Position(lineNum, colNum),
      new vscode.Position(lineNum, colNum + 1)
    );

    const diag = new vscode.Diagnostic(
      range,
      "JSON parsing failure detected here",
      vscode.DiagnosticSeverity.Error
    );

    diagCollection.set(vscode.Uri.file(absPath), [diag]);
  }
}
