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
exports.removeRunnerDir = exports.buildRunnerProject = void 0;
const fs = require("fs/promises");
const path = require("path");
const RUNNER_DIR = '.dart_json_validator_runner';
function escapeForRawTriple(s) {
    // ensure ''' inside json won't break raw string: replace ''' with '\'\'\'' or use standard triple double quotes
    // We'll use triple double quotes to reduce collisions
    return s.replace(/"""/g, '\\"\\"\\"');
}
function buildRunnerProject(workspaceRoot, modelFilePath, className, jsonText) {
    return __awaiter(this, void 0, void 0, function* () {
        const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
        yield fs.mkdir(runnerDir, { recursive: true });
        // compute relative import from runnerMain to model file
        const rel = path.relative(runnerDir, modelFilePath).split(path.sep).join('/');
        // strip .dart extension for import
        const importPath = rel.endsWith('.dart') ? rel.slice(0, -5) : rel;
        const mainContent = `import 'dart:convert';\nimport '${importPath}.dart';\n\nvoid main() async {\n const rawJson = """\n${escapeForRawTriple(jsonText)}\n""";\n try {\n final decoded = jsonDecode(rawJson);\n final result = ${className}.fromJson(decoded);\n // Try to call toJson if available to show canonical form\n try {\n final out = result.toJson();\n print('SUCCESS');\n print(jsonEncode(out));\n } catch (e) {\n print('SUCCESS_NO_TOJSON');\n print(result.toString());\n }\n } catch (e, st) {\n print('ERROR');\n print(e);\n print(st);\n // non-zero exit
// ignore here - process exit used by runner
}\n}\n`;
        const mainPath = path.join(runnerDir, 'main.dart');
        yield fs.writeFile(mainPath, mainContent, 'utf8');
        return mainPath;
    });
}
exports.buildRunnerProject = buildRunnerProject;
function removeRunnerDir(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        const runnerDir = path.join(workspaceRoot, RUNNER_DIR);
        // be conservative: only remove if exists
        try {
            yield fs.rm(runnerDir, { recursive: true, force: true });
        }
        catch (e) { /* ignore */ }
    });
}
exports.removeRunnerDir = removeRunnerDir;
//# sourceMappingURL=runner.js.map