/* eslint-env node */
const fs = require('fs');
const path = require('path');
const manifest = require('../dist/manifest.json');

const dist = path.join(__dirname, '../dist');

async function updateDevName() {
  const filesInDirectory = fs.readdirSync(dist);
  const devImage = filesInDirectory.find((file) =>
    file.startsWith('logo-icon-dev')
  );

  await fs.writeFile(
    path.join(dist, 'manifest.json'),
    JSON.stringify(
      {
        ...manifest,
        name: 'Zerion Test',
        description: 'Zerion Test description',
        icons: {
          16: devImage,
          32: devImage,
          48: devImage,
          128: devImage,
        },
        action: {
          ...manifest.action,
          default_icon: {
            16: devImage,
            32: devImage,
            48: devImage,
            128: devImage,
          },
        },
      },
      null,
      2
    )
  );
}

updateDevName();
