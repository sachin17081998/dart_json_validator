"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRunParseCommand = void 0;
const vscode = require("vscode");
const runner_1 = require("../core/runner");
const processRunner_1 = require("../core/processRunner");
const reporter_1 = require("../core/reporter");
const diagnostics_1 = require("../core/diagnostics");
const extensions_1 = require("../extensions");
const fs = require("fs/promises");
async function modelUsesJsonSerializable(modelPath) {
    const content = await fs.readFile(modelPath, "utf8");
    return (content.includes("@JsonSerializable") ||
        content.includes("part '") && content.includes(".g.dart"));
}
function registerRunParseCommand(context) {
    const cmd = vscode.commands.registerCommand('dartJsonValidator.runParse', async () => {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            vscode.window.showErrorMessage('Open a workspace (Flutter project) first.');
            return;
        }
        // get JSON text
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open the JSON file and select JSON text (or open model file too).');
            return;
        }
        const jsonText = editor.document.getText(editor.selection) || editor.document.getText();
        if (!jsonText || jsonText.trim().length === 0) {
            vscode.window.showErrorMessage('No JSON found. Select JSON text or open a JSON file.');
            return;
        }
        // pick model file
        const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'Dart': ['dart'] }, openLabel: 'Select Dart model file' });
        if (!uris || uris.length === 0)
            return;
        const modelUri = uris[0];
        // ask class name
        const className = await vscode.window.showInputBox({ prompt: 'Enter the target class name (e.g., User)' });
        if (!className) {
            vscode.window.showErrorMessage('Class name required');
            return;
        }
        const consent = await context.globalState.get('dartJsonValidator.userConsent');
        if (!consent) {
            const ok = await vscode.window.showWarningMessage('This extension will execute Dart code in your workspace to validate JSON. Proceed?', { modal: true }, 'Yes', 'No');
            if (ok !== 'Yes')
                return;
            await context.globalState.update('dartJsonValidator.userConsent', true);
        }
        const workspaceRoot = workspace.uri.fsPath;
        const modelPath = modelUri.fsPath;
        // build runner
        const isJsonSerializable = await modelUsesJsonSerializable(modelPath);
        const runnerMainPath = await (0, runner_1.buildRunnerProject)(workspaceRoot, modelPath, className, jsonText, isJsonSerializable);
        // run dart
        const res = await (0, processRunner_1.runDartFile)(runnerMainPath, workspaceRoot);
        (0, extensions_1.handleRunnerOutput)(res.output);
        // parse and show diagnostics
        (0, diagnostics_1.createDiagnostics)(context, workspaceRoot, res.output);
        // show output
        (0, reporter_1.showResultOutput)(res.output, res.exitCode === 0, context);
        // optionally cleanup
        try {
            await (0, runner_1.removeRunnerDir)(workspaceRoot);
        }
        catch (e) { /* ignore */ }
    });
    context.subscriptions.push(cmd);
    return cmd;
}
exports.registerRunParseCommand = registerRunParseCommand;
//# sourceMappingURL=runParseCommand.js.map