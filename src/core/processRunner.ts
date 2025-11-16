import { spawn } from 'child_process';
import * as path from 'path';


export async function runDartFile(filePath: string, cwd: string): Promise<{ exitCode: number, output: string }> {
return new Promise((resolve) => {
// use 'dart' executable to run the script file
const cmd = 'dart';
const args = [filePath];


const p = spawn(cmd, args, { cwd, shell: true });
let out = '';
p.stdout.on('data', (d) => out += d.toString());
p.stderr.on('data', (d) => out += d.toString());
p.on('close', (code) => resolve({ exitCode: code ?? 0, output: out }));
});
}
