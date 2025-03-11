import { version as packageVersion } from '../../package.json';

const isProd = process.env.NODE_ENV === 'production';

export const version = isProd ? packageVersion : `${packageVersion}-dev`;
export const productionVersion = packageVersion;
