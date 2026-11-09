# UI Lab

The UI Lab page is used to test components in isolation and in different states at the same time. Often, it's a good visual replacement or supplement for tests.

## How to run

```sh
npm run ui-lab
```

`src/ui-lab/vite.config.ts` maps the modules the components expect (channels, the networks store, background constants, `webextension-polyfill`) to their mocks. Add an alias there when a preview needs another mocked module.

The playground shares `scripts/vite-plugins.ts` with the extension build, so `jsx:`/`url:` imports work the same way in previews.
