type OnChangedParameters = Parameters<
  Parameters<typeof chrome.storage.onChanged.addListener>[0]
>;

const browser = {
  runtime: {
    getURL(path: string) {
      return path;
    },
  },
  storage: {
    local: {
      get(_prop: string) {
        return Promise.resolve({});
      },
    },
    onChanged: {
      addListener(
        listener: (
          _changes: OnChangedParameters[0],
          _namespace: OnChangedParameters[1]
        ) => void
      ) {
        console.log('added listener', listener);
      },
    },
  },
};

export default browser;
