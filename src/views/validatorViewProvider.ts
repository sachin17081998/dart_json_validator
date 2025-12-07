import * as vscode from "vscode";
import { buildRunnerProject, removeRunnerDir } from "../core/runner";
import { runDartFile } from "../core/processRunner";
import * as path from "path";
import { processErrorOutput } from "../core/reporter";

export class ValidatorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "dartJsonValidatorView";
  private _webviewView?: vscode.WebviewView;

  constructor(private context: vscode.ExtensionContext) { }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = await this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
    

      if (msg.type === "run") {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          return this.postError("Open a workspace first.");
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        try {



          const { jsonText, className, dartClass } = msg;

          if (!dartClass) {
            return this.postError("No Dart Class provided");
          }
          
          if (!jsonText) {
            return this.postError("No Json provided");
          }
          
          if (!className) {
            return this.postError("Class Name Not provided");
          }

          const mainPath = await buildRunnerProject({
           workspaceRoot: workspaceRoot,
           dartClass: dartClass,
           className: className,
           jsonText: jsonText,
            // true
         } );

          const result = await runDartFile(mainPath, path.dirname(mainPath));
          if (result.output.includes('ERROR')) {

            var errorMessage = '';

            const errorKey = await processErrorOutput(result.output, path.join(workspaceRoot, ".dart_model_tester"));
            if (typeof errorKey === "string" && errorKey.trim().length > 0) {
              errorMessage = `\nFailed to parse the JSON with the given model.\n \n${errorKey}`;
            } else {
              errorMessage = 'Unexpected Error during parsing.\n' + result.output;
            }

            webviewView.webview.postMessage({
              type: "runResult",
              output: errorMessage,
              exitCode: result.exitCode,
            });
          } else {
            webviewView.webview.postMessage({
              type: "runResult",
              output: result.output,
              exitCode: result.exitCode,
            });
          }



        } catch (err: any) {

          this.postError('Someting went wrong.\nPossibly caused by an incorrect Dart class or JSON. Please verify' );
        } finally {

          await removeRunnerDir(workspaceRoot);
        }
      }
    });
  }

  private postError(message: string) {
    this._webviewView?.webview.postMessage({ type: "error", message });
  }

  private async getHtml(){
    const htmlPath = vscode.Uri.file(
      path.join(this.context.extensionPath, "src", "views", "validatorView.html")
    );
    const data = await vscode.workspace.fs.readFile(htmlPath);
    return data.toString();

  }
}
