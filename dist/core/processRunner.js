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
exports.runDartFile = void 0;
const child_process_1 = require("child_process");
function runDartFile(filePath, cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            // use 'dart' executable to run the script file
            const cmd = 'dart';
            const args = [filePath];
            const p = (0, child_process_1.spawn)(cmd, args, { cwd, shell: true });
            let out = '';
            p.stdout.on('data', (d) => out += d.toString());
            p.stderr.on('data', (d) => out += d.toString());
            p.on('close', (code) => resolve({ exitCode: code !== null && code !== void 0 ? code : 0, output: out }));
        });
    });
}
exports.runDartFile = runDartFile;
//# sourceMappingURL=processRunner.js.map