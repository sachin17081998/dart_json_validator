
// import * as fs from "fs/promises";
// import * as path from "path";

// const RUNNER_DIR = ".dart_json_validator_runner";

// /**
//  * Escape triple-quotes inside JSON so they don’t break Dart triple-quoted strings.
//  */
// function escapeForRawTriple(text: string): string {
//   // Replace """ with escaped version
//   return text.replace(/"""/g, '\\"\\"\\"');
// }

// /**
//  * Build the temporary runner project folder + main.dart
//  */
// export async function buildRunnerProject(
//   workspaceRoot: string,
//   modelFilePath: string,
//   className: string,
//   jsonText: string
// ): Promise<string> {
//   const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
//   await fs.mkdir(runnerDir, { recursive: true });

//   // Compute relative import path from runner folder to model file
//   const rel = path.relative(runnerDir, modelFilePath).split(path.sep).join("/");
//   const importPath = rel.endsWith(".dart") ? rel.slice(0, -5) : rel;

//   const mainContent = `import 'dart:convert';
// import '${importPath}.dart';

// void main() async {
//   const rawJson = """
// ${escapeForRawTriple(jsonText)}
// """;

//   try {
//     final decoded = jsonDecode(rawJson);
//     final result = ${className}.fromJson(decoded);

//     // Try to call toJson() dynamically.
//     dynamic output;
//     try {
//       output = (result as dynamic).toJson();
//       print('SUCCESS_JSON');
//       print(jsonEncode(output));
//     } catch (_) {
//       // toJson does not exist or failed
//       print('SUCCESS BUT NO TO-JSON');
//       print(result.toString());
//     }

//   } catch (e, st) {
//   print('ERROR');
//     print(e.toString());
//     print('STACKTRACE_START');
//     print(st.toString());
//     print('STACKTRACE_END');
//   }
// }
// `;

//   const mainPath = path.join(runnerDir, "main.dart");
//   await fs.writeFile(mainPath, mainContent, "utf8");
//   return mainPath;
// }

// /**
//  * Clean up: delete the temporary runner dir
//  */
// export async function removeRunnerDir(workspaceRoot: string) {
//   const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
//   try {
//     await fs.rm(runnerDir, { recursive: true, force: true });
//   } catch (_) {
//     // ignore
//   }
// }


// import * as fs from "fs/promises";
// import * as path from "path";
// import { spawn } from "child_process";

// const RUNNER_DIR = ".dart_json_validator_runner";

// /** Escape triple-quotes inside JSON */
// function escapeForRawTriple(text: string): string {
//   return text.replace(/"""/g, '\\"\\"\\"');
// }

// /** Run a command in a directory */
// async function runCmd(cmd: string, args: string[], cwd: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const p = spawn(cmd, args, { cwd, shell: true });
//     p.stdout.on("data", (d) => console.log("[runner]", d.toString()));
//     p.stderr.on("data", (d) => console.error("[runner error]", d.toString()));
//     p.on("close", (code) => {
//       if (code === 0) resolve();
//       else reject(`Command failed: ${cmd} ${args.join(" ")}`);
//     });
//   });
// }

// /** Ensures json_serializable works */
// async function ensurePubspec(runnerDir: string, modelName: string) {
//   const pubspec = `
// name: dart_json_validator_runner
// environment:
//   sdk: ">=2.17.0 <4.0.0"

// dependencies:
//   json_annotation: ^4.9.0

// dev_dependencies:
//   build_runner: any
//   json_serializable: any

// # Include your model file so build_runner can find it
// flutter:
//   assets:
//     - ${modelName}
// `;

//   await fs.writeFile(path.join(runnerDir, "pubspec.yaml"), pubspec, "utf8");
// }

// /** Copies the model + generated g.dart files */
// async function copyModelFiles(runnerDir: string, modelFile: string) {
//   const fileName = path.basename(modelFile);
//   const dest = path.join(runnerDir, fileName);

//   await fs.copyFile(modelFile, dest);

//   // If there is a .g.dart file copy it too
//   const gFile = modelFile.replace(".dart", ".g.dart");
//   try {
//     await fs.copyFile(gFile, path.join(runnerDir, path.basename(gFile)));
//   } catch (_) {
//     // ignore — runner will generate it
//   }
// }

// /** Build the runner project + generate main.dart */
// export async function buildRunnerProject(
//   workspaceRoot: string,
//   modelFilePath: string,
//   className: string,
//   jsonText: string
// ): Promise<string> {
//   const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
//   await fs.mkdir(runnerDir, { recursive: true });

//   const modelName = path.basename(modelFilePath);

//   // 1️⃣ Copy pubspec
//   await ensurePubspec(runnerDir, modelName);

//   // 2️⃣ Copy the model + optional g.dart
//   await copyModelFiles(runnerDir, modelFilePath);

//   // 3️⃣ Run pub get
//   await runCmd("dart", ["pub", "get"], runnerDir);

//   // 4️⃣ Run build_runner to generate *.g.dart
//   try {
//     await runCmd("dart", ["run", "build_runner", "build", "--delete-conflicting-outputs"], runnerDir);
//   } catch (e) {
//     console.error("build_runner failed", e);
//   }

//   // 5️⃣ Import path inside runner
//   const importPath = "./" + modelName.replace(".dart", "");

//   // 6️⃣ Generate main.dart
//   const mainContent = `import 'dart:convert';
// import '${importPath}.dart';

// void main() async {
//   const rawJson = """
// ${escapeForRawTriple(jsonText)}
// """;

//   try {
//     final decoded = jsonDecode(rawJson);
//     final result = ${className}.fromJson(decoded);

//     try {
//       final output = (result as dynamic).toJson();
//       print('SUCCESS_JSON');
//       print(jsonEncode(output));
//     } catch (_) {
//       print('SUCCESS BUT NO TO-JSON');
//       print(result.toString());
//     }

//   } catch (e, st) {
//     print('ERROR');
//     print(e.toString());
//     print('STACKTRACE_START');
//     print(st.toString());
//     print('STACKTRACE_END');
//   }
// }
// `;

//   const mainPath = path.join(runnerDir, "main.dart");
//   await fs.writeFile(mainPath, mainContent, "utf8");

//   return mainPath;
// }

// /** Clean up runner directory */
// export async function removeRunnerDir(workspaceRoot: string) {
//   const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
//   try {
//     await fs.rm(runnerDir, { recursive: true, force: true });
//   } catch (_) {}
// }



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

    p.stdout.on("data", (d) => process.stdout.write(d.toString()));
    p.stderr.on("data", (d) => process.stderr.write(d.toString()));

    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${cmd} ${args.join(" ")}`));
    });
  });
}

/**
 * Build runner project. Supports both simple models and json_serializable.
 */
export async function buildRunnerProject(
  workspaceRoot: string,
  modelFilePath: string,
  className: string,
  jsonText: string,
  useJsonSerializable: boolean
): Promise<string> {
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
  } else {
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
      print("SUCCESS_JSON");
      print(jsonEncode(jsonOut));
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

/**
 * Cleanup runner directory
 */
export async function removeRunnerDir(workspaceRoot: string) {
  const dir = path.join(workspaceRoot, RUNNER_DIR);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (_) {}
}

