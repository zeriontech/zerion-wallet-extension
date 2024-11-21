import path from 'path';
import fs from 'fs';

export function findFile({
  dir,
  prefix,
  ext,
}: {
  dir: string;
  prefix: string;
  ext: string;
}): string | null {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStats = fs.statSync(filePath);
    if (fileStats.isFile() && file.startsWith(prefix) && file.endsWith(ext)) {
      return file;
    }
  }
  return null;
}
