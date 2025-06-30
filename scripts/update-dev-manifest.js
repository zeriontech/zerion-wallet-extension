/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const manifest = require('../dist/manifest.json');

const GIT_BRANCH_NAME = process.env.GIT_BRANCH_NAME;

async function updateDevName() {
  await fs.writeFile(
    path.join(path.join(__dirname, '../dist'), 'manifest.json'),
    JSON.stringify(
      {
        ...manifest,
        name: 'Zerion Test Build',
        description: `For the branch: ${GIT_BRANCH_NAME}`,
      },
      null,
      2
    )
  );
}

updateDevName();
