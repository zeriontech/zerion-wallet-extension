export function isAllowedMessage(
  event: MessageEvent,
  targetIframeElement: HTMLIFrameElement
) {
  // NOTE:
  // Checking the origin of a sandboxed iframe:
  // https://web.dev/sandboxed-iframes/#safely-sandboxing-eval
  return (
    event.origin === 'null' &&
    event.source === targetIframeElement.contentWindow
  );
}
