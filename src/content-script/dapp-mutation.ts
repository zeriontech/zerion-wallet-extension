import zerionLogoSrc from 'data-url:src/ui/assets/zerion-logo-blue.svg';

function visitTextNodes(node: Element, cb: (node: Node) => boolean) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let found = false;
  while (walker.nextNode() && !found) {
    found = cb(walker.currentNode);
  }
}

// Another approach would be to have an array of regexes, e.g.:
// const labels = [/\bMeta[mM]ask\b/, /\bInjected Wallet\b/, ...],
// which is more readable. But I measured in a couple of benchmarks and it seems
// to perform slightly slower in Chrome and *much* slower in Safari

const injectedRegexes: Record<string, RegExp> = {
  default:
    /\b(Injected Wallet|Injected|Detected Wallet|Browser Wallet|Web3 Wallet)\b/i,
  'https://app.1inch.io':
    /\b(Web3|Injected Wallet|Injected|Detected Wallet|Browser Wallet|Web3 Wallet)\b/i,
};

const labelsInjectedRe =
  injectedRegexes[window.location.origin] || injectedRegexes.default;
const labelsMetamaskRe = /\bMeta[mM]ask\b/;
const zerionRe = /zerion/i;

function isReplacementMatch(textNode: Node, regex: RegExp) {
  const { textContent } = textNode;
  return textContent && regex.test(textContent);
}

function replaceButtonLabel(textNode: Node, regex: RegExp) {
  const { textContent } = textNode;
  if (textContent) {
    textNode.textContent = textContent.replace(regex, 'Zerion');
  }
}

function getMostLikelyIcon(imageLikeElements: NodeListOf<Element>) {
  if (imageLikeElements.length === 1) {
    return imageLikeElements[0];
  } else {
    // it's tricky to know which image to update
    return Array.from(imageLikeElements).find((img) => {
      const re = /\b(metamask|injected|detected|browser)\b/i;
      return (
        re.test(img.getAttribute('src') || '') ||
        re.test(img.getAttribute('alt') || '')
      );
    });
  }
}

interface Context {
  // This whole interface exists for just one case (OnboardV2) where a button
  // has two icons, one of which is a tick icon and another is metamask.
  // Tick icon gets mounted first, that's why we need to ignore it.
  isOnboardV2?: boolean;
}

const iconSelectors = {
  default: 'img,[role=img],svg',
  onboardV2:
    "img,[role=img],svg:not(:has(path[d='M6.74999 12.15L3.59999 9L2.54999 10.05L6.74999 14.25L15.75 5.25L14.7 4.2L6.74999 12.15Z']))",
};

function replaceButtonImage(node: HTMLElement, context: Context) {
  const imageLikeElements = node.querySelectorAll(
    context.isOnboardV2 ? iconSelectors.onboardV2 : iconSelectors.default
  );
  const element = getMostLikelyIcon(imageLikeElements);
  if (
    !element ||
    !(element instanceof HTMLElement || element instanceof SVGElement) ||
    element.dataset.zerionReplaced === 'true'
  ) {
    return;
  }
  element.dataset.zerionReplaced = 'true';
  if (element.nodeName === 'IMG') {
    (element as HTMLImageElement).src = zerionLogoSrc;
  } else {
    element.style.background = `url("${zerionLogoSrc}") no-repeat center/contain`;
    for (const child of element.children) {
      if (child instanceof HTMLElement || child instanceof SVGElement) {
        child.style.display = 'none';
      }
    }
  }
  node.dataset.replacementStep = 'icon';
}

function isExternalLink(node: Element) {
  const href = node.getAttributeNode('href');
  if (node.tagName === 'A' && href) {
    try {
      const origin = new URL(href.value, href.baseURI).origin;
      return origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }
}

const buttonLikeSelectors: Record<string, string> = {
  default: 'button,[role=button]',
  'https://unstoppabledomains.com': 'button,[role=button],.MuiGrid-item',
};

function rewriteConnectButtons(
  node: ParentNode = document.body,
  context: Context
) {
  const buttonLikeElements = node.querySelectorAll<HTMLElement>(
    buttonLikeSelectors[window.location.origin] || buttonLikeSelectors.default
  );

  type Item = { element: HTMLElement; textNode: Node };
  const injectedCandidates: Item[] = [];
  const metamaskCandidates: Item[] = [];
  let didMutateSomething = false;
  let foundZerionText = false;

  function mutateButton(element: HTMLElement, textNode: Node, regex: RegExp) {
    replaceButtonLabel(textNode, regex);
    didMutateSomething = true;
    element.dataset.replacementStep = 'text';
    replaceButtonImage(element, context);
  }

  function analyzeElement(element: HTMLElement) {
    /**
     * NOTE: Candidate elements are marked using data-replacement-step attribute
     * to avoid repeating work: 'text' is the first step, 'icon' is the final step
     */
    if (element.dataset.replacementStep === 'icon') {
      didMutateSomething = true;
      return;
    }
    if (isExternalLink(element)) {
      return;
    }
    if (element.dataset.replacementStep === 'text') {
      didMutateSomething = true;
      replaceButtonImage(element, context);
    } else {
      /**
       * - if we find metamask button, save it to list of metamask candidates,
       * - if we find injected button, save it to list of injected candidates,
       * - if we find "zerion" text button, ignore candidates
       * This is to avoid mutating both Metamask and Injected buttons to Zerion
       * and to avoid mutating Injected buttons when Zerion button exitst
       */
      visitTextNodes(element, (textNode) => {
        const matchesZerion = isReplacementMatch(textNode, zerionRe);

        if (matchesZerion) {
          foundZerionText = true;
          return true;
        }
        const matchesInjected = isReplacementMatch(textNode, labelsInjectedRe);
        const matchesMetamask = isReplacementMatch(textNode, labelsMetamaskRe);

        if (matchesMetamask) {
          metamaskCandidates.push({ element, textNode });
        }
        if (matchesInjected) {
          injectedCandidates.push({ element, textNode });
        }
        return false;
      });
    }
  }
  for (const element of buttonLikeElements) {
    analyzeElement(element);
  }
  if (foundZerionText) {
    return;
  }
  for (const item of injectedCandidates) {
    mutateButton(item.element, item.textNode, labelsInjectedRe);
  }
  if (!didMutateSomething) {
    for (const item of metamaskCandidates) {
      mutateButton(item.element, item.textNode, labelsMetamaskRe);
    }
  }
}

function monitorAddedNodes(cb: (element: HTMLElement) => boolean | void) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode instanceof HTMLElement) {
            if (cb(addedNode)) {
              observer.disconnect();
              break;
            }
          }
        }
      }
    }
  });
  observer.observe(document.body, {
    childList: true /* only direct children */,
  });
  return () => observer.disconnect();
}

function observeConnectButtons(
  node: ParentNode = document.body,
  context: Context
) {
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length || m.type === 'attributes')) {
      // can we narrow down the algorithm to use rewriteConnectButtons(mutation.target)?
      rewriteConnectButtons(node, context);
    }
  });
  observer.observe(node, {
    subtree: true,
    childList: true,
    attributeFilter: ['src'],
  });
  return () => observer.disconnect();
}

function monitorOnboardV2() {
  const context = { isOnboardV2: true };
  const candidate = document.body.getElementsByTagName('onboard-v2')[0];
  if (candidate && candidate.shadowRoot) {
    return observeConnectButtons(candidate.shadowRoot, context);
  }
  const unlisteners: Array<() => void> = [];
  const unlisten = monitorAddedNodes((element) => {
    if (element.tagName === 'ONBOARD-V2' && element.shadowRoot) {
      unlisteners.push(observeConnectButtons(element.shadowRoot, context));
      return true;
    }
  });
  return () => {
    unlisten();
    unlisteners.forEach((l) => l());
  };
}

function monitorDynamicModal() {
  const findShadowRoot = (element: HTMLElement | null) => {
    return (
      element &&
      element.getAttribute('id') === 'dynamic-modal' &&
      element.firstElementChild instanceof HTMLElement &&
      element.firstElementChild.dataset?.testid === 'dynamic-modal-shadow' &&
      element.firstElementChild.shadowRoot
    );
  };
  const candidate = findShadowRoot(document.getElementById('dynamic-modal'));
  if (candidate) {
    return observeConnectButtons(candidate, {});
  }
  const unlisteners: Array<() => void> = [];
  const unlisten = monitorAddedNodes((element) => {
    const candidate = findShadowRoot(element);
    if (candidate) {
      unlisteners.push(observeConnectButtons(candidate, {}));
      return true;
    }
  });
  return () => {
    unlisten();
    unlisteners.forEach((l) => l());
  };
}

const documentReady = () =>
  new Promise<void>((resolve) => {
    if (document.body) {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve());
    }
  });

async function observeAndUpdatePageButtons() {
  /**
   * This script scans the page and updates generic "Browser Wallet" button
   * names and icons to help the user connect to the dapp
   */
  await documentReady();
  const unlisteners: Array<() => void> = [
    observeConnectButtons(document.body, {}),
    monitorOnboardV2(),
    monitorDynamicModal(),
  ];
  return () => unlisteners.forEach((l) => l());
}

class PageObserver {
  private unlisten: null | (() => void) = null;
  private isStarting = false;
  isObserving = false;

  async start() {
    if (this.isObserving || this.isStarting) {
      return;
    }
    this.isStarting = true;
    this.unlisten = await observeAndUpdatePageButtons();
    this.isStarting = false;
    this.isObserving = true;
  }

  stop() {
    this.unlisten?.();
    this.isObserving = false;
    this.unlisten = null;
  }
}

export const pageObserver = new PageObserver();
