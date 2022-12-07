# UI Lab

The UI Lab page is used to test components in isolation and in different states at the same time. Often, it's a good visual replacement or supplement for tests.

## How to run

In `package.json`, there is an "alias" field which is used by [parcel](https://github.com/parcel-bundler/parcel). To run UI Lab, we need to update this field by removing the "ui-lab:" prefixes

```diff
"alias": {
-  "ui-lab:./src/ui/shared/channels.ts": "./src/ui/shared/channels.mock.ts",
-  "ui-lab:webextension-polyfill": "/src/ui-lab/webextension-polyfill.mock.ts"
+  "./src/ui/shared/channels.ts": "./src/ui/shared/channels.mock.ts",
+  "webextension-polyfill": "/src/ui-lab/webextension-polyfill.mock.ts"
},
```

Then, run the UI Lab page:

```sh
npm run ui-lab
```

When you're done testing the UI Lab page, **edit these lines back to their original value** (bring back the "ui-lab:" prefixes). This is cumbersome, but due to a parcel limitation (https://github.com/parcel-bundler/parcel/issues/3080#issuecomment-1169913261), we cannot provide aliases in a separate config or in a different package.json file.
