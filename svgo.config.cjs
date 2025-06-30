/**
 * Parcel recommends using .json configuration files for better caching,
 * but for some reason using .json for this config did not work
 * (the "removeViewBox" option wasn't working)
 */

module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeHiddenElems: false,
          removeEmptyAttrs: false,
          removeEmptyContainers: false,
          removeUselessDefs: false,
          cleanupIds: false,
        },
      },
    },
  ],
};
