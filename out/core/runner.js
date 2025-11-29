"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRunnerDir = exports.buildRunnerProject = void 0;
const fs = require("fs/promises");
const path = require("path");
const child_process_1 = require("child_process");
const RUNNER_DIR = ".dart_model_tester";
function escapeTriple(text) {
    return text.replace(/"""/g, '\\"\\"\\"');
}
function runCmd(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
        const p = (0, child_process_1.spawn)(cmd, args, { cwd, shell: true });
        p.stdout.on("data", (d) => process.stdout.write(d.toString()));
        p.stderr.on("data", (d) => process.stderr.write(d.toString()));
        p.on("close", (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`Command failed: ${cmd} ${args.join(" ")}`));
        });
    });
}
/**
 * Build runner project. Supports both simple models and json_serializable.
 */
async function buildRunnerProject(workspaceRoot, modelFilePath, className, jsonText, useJsonSerializable) {
    const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
    await fs.mkdir(runnerDir, { recursive: true });
    let importPath = "";
    let relativeModelPath = "";
    if (!useJsonSerializable) {
        // SIMPLE MODE — import model directly
        relativeModelPath = path
            .relative(runnerDir, modelFilePath)
            .split(path.sep)
            .join("/");
        importPath = relativeModelPath.replace(/\.dart$/, "");
    }
    else {
        // JSON_SERIALIZABLE MODE — copy model + prepare package
        const libDir = path.join(runnerDir, "lib");
        await fs.mkdir(libDir, { recursive: true });
        const modelFileName = path.basename(modelFilePath);
        const destModelPath = path.join(libDir, modelFileName);
        await fs.copyFile(modelFilePath, destModelPath);
        const pubspec = `
name: dart_model_tester
environment:
  sdk: ">=2.12.0 <4.0.0"

dependencies:
  json_annotation: any

dev_dependencies:
  build_runner: any
  json_serializable: any
`;
        await fs.writeFile(path.join(runnerDir, "pubspec.yaml"), pubspec, "utf8");
        // run pub get
        await runCmd("dart", ["pub", "get"], runnerDir);
        // run build_runner
        await runCmd("dart", ["run", "build_runner", "build", "--delete-conflicting-outputs"], runnerDir);
        importPath = `package:dart_model_tester/${modelFileName.replace(".dart", "")}`;
    }
    // build main.dart
    const mainContent = `
import 'dart:convert';
import '${importPath}.dart';

void main() {
  const rawJson = """
${escapeTriple(jsonText)}
""";

  try {
    final decoded = jsonDecode(rawJson);
    final result = ${className}.fromJson(decoded);

    try {
      final jsonOut = (result as dynamic).toJson();
      print("Valid JSON");
      print(result.toString());
    } catch (_) {
      print("SUCCESS_NO_TOJSON");
      print(result.toString());
    }

  } catch (e, st) {
    print("ERROR");
    print(e.toString());
    print("STACKTRACE_START");
    print(st.toString());
    print("STACKTRACE_END");
  }
}
`;
    const mainPath = path.join(runnerDir, "main.dart");
    await fs.writeFile(mainPath, mainContent, "utf8");
    return mainPath;
}
exports.buildRunnerProject = buildRunnerProject;
/**
 * Cleanup runner directory
 */
async function removeRunnerDir(workspaceRoot) {
    const dir = path.join(workspaceRoot, RUNNER_DIR);
    try {
        await fs.rm(dir, { recursive: true, force: true });
    }
    catch (_) { }
}
exports.removeRunnerDir = removeRunnerDir;
//# sourceMappingURL=runner.js.map