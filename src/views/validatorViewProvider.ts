// validatorViewProvider.ts
import * as vscode from "vscode";
import { buildRunnerProject, removeRunnerDir } from "../core/runner";
import { runDartFile } from "../core/processRunner";
import * as path from "path";

export class ValidatorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "dartJsonValidatorView";
  private _webviewView?: vscode.WebviewView;

  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "pickFile") {
        const options: vscode.OpenDialogOptions = {
          canSelectMany: false,
          openLabel: "Select Dart Model File",
          filters: { "Dart Files": ["dart"] },
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
          webviewView.webview.postMessage({
            type: "filePicked",
            modelPath: fileUri[0].fsPath,
          });
        }
      }

      if (msg.type === "run") {
        try {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders) {
            return this.postError("Open a workspace first.");
          }

          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const { jsonText, className, modelPath } = msg;

          if (!modelPath) {
            return this.postError("No model file selected.");
          }

          const mainPath = await buildRunnerProject(
            workspaceRoot,
            modelPath,
            className,
            jsonText,
            true
          );

          const result = await runDartFile(mainPath, path.dirname(mainPath));
          await removeRunnerDir(workspaceRoot);

          webviewView.webview.postMessage({
            type: "runResult",
            output: result.output,
            exitCode: result.exitCode,
          });
        } catch (err: any) {
          this.postError(err?.message ?? String(err));
        }
      }
    });
  }

  private postError(message: string) {
    this._webviewView?.webview.postMessage({ type: "error", message });
  }

  private getHtml() {
    return  `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --primary: #0288D1;
      --text: #FFFFFF;
      --bg: var(--vscode-editor-background);
      --border: var(--vscode-editorWidget-border);
    }

    body {
      font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
      padding: 14px;
      background: var(--bg);
      color: var(--text);
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 1.3em;
      color: var(--text);
    }

    label {
      font-weight: 600;
      display: block;
      margin-top: 14px;
      color: #FFFFFF;
      font-size: 0.95em;
    }

    textarea, input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      margin-top: 6px;
      padding: 8px 10px;
      background: transparent !important;
      border: 1.5px solid var(--primary);
      border-radius: 4px;
      color: #FFFFFF !important;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.95em;
      outline: none;
      transition: border 0.2s;
    }

    textarea:focus, input[type="text"]:focus {
      border-color: #29B6F6;
      box-shadow: 0 0 0 1px #29B6F6;
    }

    button {
      margin-top: 16px;
      width: 100%;
      padding: 10px;
      background: var(--primary);
      color: #FFFFFF;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.95em;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }

    button:hover:not(:disabled) {
      background: #0277BD;
      transform: translateY(-1px);
    }

    button:disabled {
      background: #01579B;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .path {
      margin-top: 6px;
      font-size: 0.85em;
      color: #B0BEC5;
      word-break: break-all;
      font-style: italic;
    }

    #output {
      margin-top: 16px;
      background: rgba(0, 0, 0, 0.3);
      color: #FFFFFF;
      padding: 12px;
      height: 160px;
      overflow: auto;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.9em;
      border: 1px solid var(--border);
      border-radius: 4px;
      white-space: pre-wrap;
    }

    .loader {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <h3>DMT: Dart Model Tester</h3>

  <label>JSON Input:</label>
  <textarea id="json" placeholder='Paste your JSON here...'></textarea>

  <label>Model File:</label>
  <button id="pickBtn">
    <span class="btn-content">Pick Dart File...</span>
  </button>
  <div id="filePath" class="path"></div>

  <label>Class Name:</label>
  <input type="text" id="className" placeholder="e.g. User" />

  <button id="runBtn">
    <span class="btn-content" id="runText">Run Validation</span>
  </button>

  <div id="output"></div>

  <script>
    const vscode = acquireVsCodeApi();
    let modelPath = '';
    let isRunning = false;

    const runBtn = document.getElementById('runBtn');
    const runText = document.getElementById('runText');
    const pickBtn = document.getElementById('pickBtn');

    pickBtn.onclick = () => {
      if (isRunning) return;
      vscode.postMessage({ type: 'pickFile' });
    };

    runBtn.onclick = () => {
      if (isRunning) return;
      const json = document.getElementById('json').value.trim();
      const className = document.getElementById('className').value.trim();
      if (!json) return showError("Please enter JSON");
      if (!className) return showError("Please enter class name");
      if (!modelPath) return showError("Please pick a Dart file");

      startLoading();
      vscode.postMessage({
        type: "run",
        jsonText: json,
        className,
        modelPath
      });
    };

    function startLoading() {
      isRunning = true;
      runBtn.disabled = true;
      runText.innerHTML = '<div class="loader"></div>Validating...';
    }

    function stopLoading() {
      isRunning = false;
      runBtn.disabled = false;
      runText.innerHTML = 'Run Validation';
    }

    function showError(msg) {
      alert(msg);
    }

    window.addEventListener('message', event => {
      const msg = event.data;

      if (msg.type === 'filePicked') {
        modelPath = msg.modelPath;
        document.getElementById('filePath').textContent = modelPath;
      }

      if (msg.type === 'runResult') {
        stopLoading();
        const output = document.getElementById('output');
        output.textContent = msg.output || 'Success! JSON parsed successfully.';
        output.style.color = msg.exitCode === 0 ? '#90EE90' : '#FF6B6B';
      }

      if (msg.type === 'error') {
        stopLoading();
        const output = document.getElementById('output');
        output.textContent = 'ERROR: ' + msg.message;
        output.style.color = '#FF6B6B';
      }
    });
  </script>
</body>
</html>`;

  }
}