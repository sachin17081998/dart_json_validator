import * as vscode from 'vscode';
import * as path from 'path';


export function showResultOutput(output: string, success: boolean, context: vscode.ExtensionContext) {
// OutputChannel
const channel = vscode.window.createOutputChannel('DMT:Dart Model Tester');
channel.clear();
channel.appendLine('--- DMT Runner ---');
channel.appendLine(output);
channel.show(true);


// Webview summary
const panel = vscode.window.createWebviewPanel('dartJsonRunResult', 'Dart JSON Parser Result', vscode.ViewColumn.One, { enableScripts: false });
const safe = escapeHtml(output);
const status = success ? 'SUCCESS' : 'ERROR';
panel.webview.html = `<!doctype html><html><body><h2>${status}</h2><pre>${safe}</pre></body></html>`;
}


function escapeHtml(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }