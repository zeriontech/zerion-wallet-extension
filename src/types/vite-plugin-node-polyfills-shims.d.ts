/**
 * `vite-plugin-node-polyfills` ships these shim entry points without
 * declarations, and its `exports` map points straight at the JS files.
 */
declare module 'vite-plugin-node-polyfills/shims/process' {
  const processShim: typeof process;
  export default processShim;
}

declare module 'vite-plugin-node-polyfills/shims/buffer' {
  const bufferShim: typeof Buffer;
  export default bufferShim;
}
