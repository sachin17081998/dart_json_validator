"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showResultOutput = void 0;
const vscode = require("vscode");
function showResultOutput(output, success, context) {
    // OutputChannel
    const channel = vscode.window.createOutputChannel('Dart JSON Validator');
    channel.clear();
    channel.appendLine('--- Dart JSON Validator (Runner) ---');
    channel.appendLine(output);
    channel.show(true);
    // Webview summary
    const panel = vscode.window.createWebviewPanel('dartJsonRunResult', 'Dart JSON Parser Result', vscode.ViewColumn.One, { enableScripts: false });
    const safe = escapeHtml(output);
    const status = success ? 'SUCCESS' : 'ERROR';
    panel.webview.html = `<!doctype html><html><body><h2>${status}</h2><pre>${safe}</pre></body></html>`;
}
exports.showResultOutput = showResultOutput;
function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
//# sourceMappingURL=reporter.js.map