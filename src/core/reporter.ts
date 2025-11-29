
import * as path from 'path';
import * as fs from "fs/promises";

async function extractJsonKey(filePath: string, line: number, column: number): Promise<string | null> {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  if (line < 1 || line > lines.length) return null;

  const targetLine = lines[line - 1];
  if(targetLine !== undefined && targetLine.length>0) return targetLine.trim();
  
  return null;
}

export async function processErrorOutput(output: string, tempDir: string) {
  const regex = /package:dart_model_tester\/(.+):(\d+):(\d+)/g;

  let match;
  while ((match = regex.exec(output))) {
    const [, relativePath, lineStr, colStr] = match;

    const line = parseInt(lineStr, 10);
    const col = parseInt(colStr, 10);

    const filePath = path.join(tempDir, "lib", relativePath);

    try {
      const key = await extractJsonKey(filePath, line, col);

      if (key) {
       return`Failure Point: ${key}`;
      } else {
        return`Error at \n ${relativePath}:${line}:${col}`;
      }
    } catch (e) {
      return`Error locating ${relativePath}:${line}:${col}`;
    }
  }
}
