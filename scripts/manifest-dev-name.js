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
        icons: {
          16: 'images/logo-icon-dev-128.png',
          32: 'images/logo-icon-dev-128.png',
          48: 'images/logo-icon-dev-128.png',
          128: 'images/logo-icon-dev-128.png',
        },
      },
      null,
      2
    )
  );
}

updateDevName();