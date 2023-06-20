import { version as packageVersion } from '../../package.json';

const isProd = process.env.NODE_VERSION === 'production';

export const version = isProd ? packageVersion : `${packageVersion}-dev`;
