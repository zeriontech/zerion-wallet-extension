/* eslint-env node */
const fs = require('fs/promises');
const path = require('path');
const manifest = require('../dist/manifest.json');

const dist = path.join(__dirname, '../dist');

async function updateDevName() {
  await fs.writeFile(
    path.join(dist, 'manifest.json'),
    JSON.stringify(
      {
        ...manifest,
        name: 'Zerion Test',
        description: 'Zerion Test description',
      },
      null,
      2
    )
  );
}

updateDevName();