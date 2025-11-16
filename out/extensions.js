"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRunnerOutput = exports.deactivate = exports.activate = void 0;
;
const validatorViewProvider_1 = require("./views/validatorViewProvider");
const vscode = require("vscode");
let diagCollection;
function activate(context) {
    const provider = new validatorViewProvider_1.ValidatorViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(validatorViewProvider_1.ValidatorViewProvider.viewType, provider));
    // Optional: Show view on startup
    setTimeout(() => {
        vscode.commands.executeCommand('workbench.view.extension.dartJsonValidator');
    }, 1000);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function handleRunnerOutput(output) {
    // Clear old diagnostics
    // diagCollection.clear();
    const stackStart = output.indexOf("STACKTRACE_START");
    const stackEnd = output.indexOf("STACKTRACE_END");
    if (stackStart === -1 || stackEnd === -1)
        return;
    const trace = output.substring(stackStart + 17, stackEnd).trim();
    const frames = trace.split("\n");
    for (const frame of frames) {
        const match = frame.match(/\((file:\/\/\/.+?):(\d+):(\d+)\)/);
        if (!match)
            continue;
        const [, fileUri, lineStr, colStr] = match;
        const line = parseInt(lineStr) - 1;
        const col = parseInt(colStr) - 1;
        const uri = vscode.Uri.parse(fileUri);
        const diagnostic = new vscode.Diagnostic(new vscode.Range(new vscode.Position(line, col), new vscode.Position(line, col + 1)), "JSON parsing failed here", vscode.DiagnosticSeverity.Error);
        // diagCollection.set(uri, [diagnostic]);
    }
}
exports.handleRunnerOutput = handleRunnerOutput;
//# sourceMappingURL=extensions.js.map