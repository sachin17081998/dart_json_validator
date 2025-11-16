"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRunParseCommand = void 0;
const vscode = require("vscode");
const runner_1 = require("../core/runner");
const processRunner_1 = require("../core/processRunner");
const reporter_1 = require("../core/reporter");
function registerRunParseCommand(context) {
    const cmd = vscode.commands.registerCommand('dartJsonValidator.runParse', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const workspace = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
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
        const uris = yield vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'Dart': ['dart'] }, openLabel: 'Select Dart model file' });
        if (!uris || uris.length === 0)
            return;
        const modelUri = uris[0];
        // ask class name
        const className = yield vscode.window.showInputBox({ prompt: 'Enter the target class name (e.g., User)' });
        if (!className) {
            vscode.window.showErrorMessage('Class name required');
            return;
        }
        const consent = yield context.globalState.get('dartJsonValidator.userConsent');
        if (!consent) {
            const ok = yield vscode.window.showWarningMessage('This extension will execute Dart code in your workspace to validate JSON. Proceed?', { modal: true }, 'Yes', 'No');
            if (ok !== 'Yes')
                return;
            yield context.globalState.update('dartJsonValidator.userConsent', true);
        }
        const workspaceRoot = workspace.uri.fsPath;
        const modelPath = modelUri.fsPath;
        // build runner
        const runnerMainPath = yield (0, runner_1.buildRunnerProject)(workspaceRoot, modelPath, className, jsonText);
        // run dart
        const res = yield (0, processRunner_1.runDartFile)(runnerMainPath, workspaceRoot);
        // show output
        (0, reporter_1.showResultOutput)(res.output, res.exitCode === 0, context);
        // optionally cleanup
        try {
            yield (0, runner_1.removeRunnerDir)(workspaceRoot);
        }
        catch (e) { /* ignore */ }
    }));
    context.subscriptions.push(cmd);
    return cmd;
}
exports.registerRunParseCommand = registerRunParseCommand;
//# sourceMappingURL=runParseCommand.js.map