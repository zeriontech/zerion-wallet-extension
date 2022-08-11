/* eslint-env node */

const ghPages = require('gh-pages');
const { version } = require('../package.json');

const tagName = `build-${version}`;

ghPages.publish('dist', {
  dest: 'dist',
  remove: 'dist/**',
  branch: 'releases',
  // tag: tagName,
});
