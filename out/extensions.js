"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRunnerOutput = exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const runParseCommand_1 = require("./commands/runParseCommand");
let diagCollection;
function activate(context) {
    context.subscriptions.push((0, runParseCommand_1.registerRunParseCommand)(context));
    console.log('Dart JSON Validator (Runner) activated');
    diagCollection = vscode.languages.createDiagnosticCollection('dart-json-validator');
    context.subscriptions.push(diagCollection);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function handleRunnerOutput(output) {
    // Clear old diagnostics
    diagCollection.clear();
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
        diagCollection.set(uri, [diagnostic]);
    }
}
exports.handleRunnerOutput = handleRunnerOutput;
//# sourceMappingURL=extensions.js.map