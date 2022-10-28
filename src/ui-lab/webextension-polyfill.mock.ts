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
        console.log('added listener', listener); // eslint-disable-line no-console
      },
    },
  },
  tabs: {
    query(): chrome.tabs.Tab[] {
      return [
        {
          active: true,
          url: document.location.href,
          index: 0,
          highlighted: false,
          pinned: false,
          windowId: 1,
          incognito: false,
          selected: false,
          autoDiscardable: false,
          discarded: false,
          audible: false,
          groupId: 1,
        },
      ];
    },
  },
};

export default browser;
