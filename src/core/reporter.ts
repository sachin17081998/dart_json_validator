
import * as path from 'path';
import * as fs from "fs/promises";

async function extractJsonKey(filePath: string, line: number, column: number): Promise<string | null> {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  if (line < 1 || line > lines.length) return null;

  const targetLine = lines[line - 1];
  if (targetLine !== undefined && targetLine.length > 0) return targetLine.trim();

  return null;
}

export async function processErrorOutput(output: string, tempDir: string) {


  const { relativePath, errorMessage, row, column } = extractRowCol(output) ?? { relativePath: 'model.dart', errorMessage: '', row: 0, column: 0 };
  if (row === 0 || column === 0) {
    return output;
  }

  const filePath = path.join(tempDir, "lib", relativePath);

  try {
    const key = await extractJsonKey(filePath, row, column);

    if (key) {
      return `Failure Point: ${key} ${errorMessage.length > 0 ? '\nError:\n' + errorMessage : ''}`;
    } else {
      return `Error at \n${relativePath}:${row}:${column} ${errorMessage.length > 0 ? '\nError: \n' + errorMessage : ''}`;
    }
  } catch (e) {
    return `Error locating ${relativePath}:${row}:${column} ${errorMessage.length > 0 ? '\nError: \n' + errorMessage : ''}}`;
  }

}

export function extractRowCol(errorLog: string) {
  const lines = errorLog.split("\n");

  for (const line of lines) {

    var start = 0
    var relativePath = "model.dart";
    if (line.includes(relativePath)) {
      start = line.indexOf(relativePath);
    }

    else if (line.includes("model.g.dart")) {
      start = line.indexOf("model.g.dart");
      relativePath = "model.g.dart";
    } else { continue; }

    // Extract substring that starts at model.dart
    // const start = line.indexOf("model.dart");
    const after = line.substring(start);
    // example: "model.dart:10:24)"

    const parts = after.split(":");
    // parts = ["model.dart", "10", "24)"]

    if (parts.length >= 3) {
      const row = Number(parts[1]);
      const col = Number(parts[2].replace(/\D/g, ""));

      return { relativePath: relativePath, errorMessage: extractErrorMessage(errorLog), row: row, column: col };
    }
  }


  return null;
}
function extractErrorMessage(input: string): string {
  const startTag = "<ERROR>";
  const endTag = "<ERROR>";

  const startIndex = input.indexOf(startTag);
  if (startIndex === -1) return '';

  // content begins after the first <ERROR>
  const contentStart = startIndex + startTag.length;

  // find next <ERROR> after the first one
  const endIndex = input.indexOf(endTag, contentStart);
  if (endIndex === -1) return '';

  return input.substring(contentStart, endIndex).trim();
}

