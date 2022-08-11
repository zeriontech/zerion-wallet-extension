export function getPortContext(port: chrome.runtime.Port) {
  return {
    origin: port.sender?.origin,
    tabId: port.sender?.tab?.id,
  };
}
