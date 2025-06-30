const { execFile } = require('child_process');

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<void>}
 */
async function execAsync(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { execAsync };
