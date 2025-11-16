"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDartFile = void 0;
const child_process_1 = require("child_process");
async function runDartFile(filePath, cwd) {
    return new Promise((resolve) => {
        // use 'dart' executable to run the script file
        const cmd = 'dart';
        const args = [filePath];
        const p = (0, child_process_1.spawn)(cmd, args, { cwd, shell: true });
        let out = '';
        p.stdout.on('data', (d) => out += d.toString());
        p.stderr.on('data', (d) => out += d.toString());
        p.on('close', (code) => resolve({ exitCode: code ?? 0, output: out }));
    });
}
exports.runDartFile = runDartFile;
//# sourceMappingURL=processRunner.js.map