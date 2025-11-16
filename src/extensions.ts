;
import { registerRunParseCommand } from './commands/runParseCommand';
import { ValidatorViewProvider } from "./views/validatorViewProvider";
import * as vscode from 'vscode';


let diagCollection: vscode.DiagnosticCollection;
export function activate(context: vscode.ExtensionContext) {
  const provider = new ValidatorViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ValidatorViewProvider.viewType,
      provider
    )
  );

  // Optional: Show view on startup
  setTimeout(() => {
    vscode.commands.executeCommand('workbench.view.extension.dartJsonValidator');
  }, 1000);
}

export function deactivate() {}

export function handleRunnerOutput(output: string) {
  // Clear old diagnostics
  // diagCollection.clear();

  const stackStart = output.indexOf("STACKTRACE_START");
  const stackEnd = output.indexOf("STACKTRACE_END");

  if (stackStart === -1 || stackEnd === -1) return;

  const trace = output.substring(stackStart + 17, stackEnd).trim();
  const frames = trace.split("\n");

  for (const frame of frames) {
    const match = frame.match(/\((file:\/\/\/.+?):(\d+):(\d+)\)/);
    if (!match) continue;

    const [, fileUri, lineStr, colStr] = match;
    const line = parseInt(lineStr) - 1;
    const col = parseInt(colStr) - 1;

    const uri = vscode.Uri.parse(fileUri);

    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(
        new vscode.Position(line, col),
        new vscode.Position(line, col + 1)
      ),
      "JSON parsing failed here",
      vscode.DiagnosticSeverity.Error
    );

    // diagCollection.set(uri, [diagnostic]);
  }
}
