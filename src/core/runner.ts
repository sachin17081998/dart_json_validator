import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";

const RUNNER_DIR = ".dart_model_tester";

function escapeTriple(text: string): string {
  return text.replace(/"""/g, '\\"\\"\\"');
}

function runCmd(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, shell: true });
    let acc = "";
    p.stdout.on("data", (d) => {
      const s = d.toString();
      acc += s;
      process.stdout.write(s);
    });
    p.stderr.on("data", (d) => {
      const s = d.toString();
      acc += s;
      process.stderr.write(s);
    });
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(" ")} exited ${code}\n\n${acc}`));
    });
    p.on("error", (err) => reject(err));
  });
}



/**
 * Build runner project.
 * - modelFilePath can be a path to a dart file in the workspace.
 * - If modelContent is provided, it will be written to lib/model.dart.
 * - If useJsonSerializable is true or model content indicates json_serializable, the runner will run build_runner.
 */
export async function buildRunnerProject({
  workspaceRoot,
  className,
  jsonText,
  dartClass,
}: {
  workspaceRoot: string;
  className: string;
  jsonText: string;
  dartClass: string;
}): Promise<string> {
  const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
  await fs.mkdir(runnerDir, { recursive: true });
  await fs.mkdir(path.join(runnerDir, "lib"), { recursive: true });

  // Decide whether to run json_serializable flow
  let isJsonSerializableNeeded =
    dartClass.includes("@JsonSerializable") ||
    dartClass.includes("part of") ||
    dartClass.includes("json_annotation") ||
    dartClass.includes("package:json_annotation");

  if (!dartClass || dartClass.trim().length <= 0) {
    throw new Error("Dart Class must be provided");
  }
  let relativeModelPath = "";
  // write modelContent into runner/lib/model.dart
  const modelFileName = "model.dart";
  let content = dartClass;

  const target = path.join(runnerDir, "lib", modelFileName);

  if (isJsonSerializableNeeded) {
    // if has a part directive, normalize its filename to model.g.dart
    content = dartClass.replace(
      /^\s*part\s+['"]([^'"]+\.g.dart)['"]\s*;/m,
      `part '${modelFileName.replace(/\.dart$/, ".g.dart")}';`
    );
  }
  await fs.writeFile(target, content, "utf8");
  relativeModelPath = path.relative(runnerDir, target).split(path.sep).join("/");

  let importPath = relativeModelPath.replace(/\.dart$/, "");
  if (isJsonSerializableNeeded) {
    // Ensure model is under lib/ so package import works
    // create a pubspec that works with Dart >=3 and recent json_serializable
    const pubspec = `
name: dart_model_tester
environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  json_annotation: ^4.9.0

dev_dependencies:
  build_runner: ^2.3.0
  json_serializable: ^6.6.0
`;
    await fs.writeFile(path.join(runnerDir, "pubspec.yaml"), pubspec, "utf8");

    // run pub get and build_runner; errors include output for debugging
    await runCmd("dart", ["pub", "get"], runnerDir);
    await runCmd("dart", ["run", "build_runner", "build", "--delete-conflicting-outputs"], runnerDir);

    // set package import path (strip leading lib/ if present)
    let rel = relativeModelPath.replace(/\\/g, "/");
    if (rel.startsWith("lib/")) rel = rel.slice("lib/".length);
    else {
      const idx = rel.indexOf("/lib/");
      if (idx !== -1) rel = rel.slice(idx + "/lib/".length);
    }
    importPath = `package:dart_model_tester/${rel.replace(/\.dart$/, "")}`;
  } else {
    importPath = relativeModelPath.replace(/\.dart$/, "");
  }

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
    print("<ERROR>"+e.toString()+"<ERROR>");
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

/**
 * Cleanup runner directory
 */
export async function removeRunnerDir(workspaceRoot: string) {
  const dir = path.join(workspaceRoot, RUNNER_DIR);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    console.warn(`Failed to remove runner dir: ${dir}`);
  }
}

