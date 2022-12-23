/* eslint-env node */
const { exec } = require('child_process');

async function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { execAsync };
