const fs = require('fs');
const path = require('path');

/**
 * @param {string | Buffer} contents
 */
function parseEnvFile(contents) {
  // reference: https://github.com/motdotla/dotenv/blob/cf4c56957974efb7238ecaba6f16e0afa895c194/lib/main.js#L18-L19
  const lines = contents
    .toString()
    .replace(/\r\n?/gm, '\n')
    .split('\n')
    .map((line) => line.trim())
    // ignore comment lines
    .filter((line) => !line.startsWith('#'));

  /** @type {Record<string, string>} */
  const result = {};
  lines.forEach((line) => {
    const [key, value = ''] = line.split('=');
    result[key] = value.trim();
  });
  return result;
}

function verifyDotEnv() {
  const root = process.cwd();
  const dotEnvPath = path.resolve(root, '.env');
  const dotEnvExamplePath = path.resolve(root, '.env.example');
  if (!fs.existsSync(dotEnvPath)) {
    // We're probably in a CI environment, do nothing
    return;
  }
  if (!fs.existsSync(dotEnvExamplePath)) {
    throw new Error('.env.example file not found');
  }
  const dotEnv = fs.readFileSync(dotEnvPath);
  const dotEnvExample = fs.readFileSync(path.resolve(dotEnvExamplePath));
  const env = parseEnvFile(dotEnv);
  const envExample = parseEnvFile(dotEnvExample);

  for (const key in env) {
    if (key in envExample === false) {
      throw new Error(
        `Unexpected env key: ${key}. Please add it to .env.example if you wish to use it. Otherwise it might not get picked up by a CD system.`
      );
    }
  }
}

verifyDotEnv();
