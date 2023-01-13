import zerionLogoSrc from 'data-url:src/ui/assets/zerion-squircle.svg';

function visitTextNodes(node: Element, cb: (node: Node) => boolean) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let found = false;
  while (walker.nextNode() && !found) {
    found = cb(walker.currentNode);
  }
}

function replaceButtonLabel(textNode: Node): boolean | undefined {
  const { textContent } = textNode;
  // Another approach would be to have an array of regexes, e.g.:
  // const labels = [/\bMeta[mM]ask\b/, /\bInjected Wallet\b/, ...],
  // which is more readable. But I measured in a couple of benchmarks and it seems
  // to perform slightly slower in Chrome and *much* slower in Safari
  const labelsRe =
    /\b(Meta[mM]ask|Injected Wallet|Injected|Detected Wallet|Browser Wallet|Web3 Wallet)\b/;

  if (textContent && labelsRe.test(textContent)) {
    textNode.textContent = textContent.replace(labelsRe, 'Zerion Wallet');
    return true;
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
    !(element instanceof HTMLElement || element instanceof SVGElement)
  ) {
    return;
  }
  const image = new Image();
  for (const { name, value } of element.attributes) {
    if (name !== 'src' && name !== 'srcset') {
      image.setAttribute(name, value);
    }
  }
  image.src = zerionLogoSrc;
  element.parentNode?.insertBefore(image, element);
  element.style.display = 'none';
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
  default: 'button,[role=button],a',
  'https://unstoppabledomains.com': 'button,[role=button],a,.MuiGrid-item',
};

function rewriteConnectButtons(
  node: ParentNode = document.body,
  context: Context
) {
  const buttonLikeElements = node.querySelectorAll<HTMLElement>(
    buttonLikeSelectors[window.location.origin] || buttonLikeSelectors.default
  );
  /**
   * NOTE: Candidate elements are marked using data-replacement-step attribute
   * to avoid repeating work: 'text' is the first step, 'icon' is the final step
   */
  for (const element of buttonLikeElements) {
    if (element.dataset.replacementStep === 'icon' || isExternalLink(element)) {
      continue;
    }
    if (element.dataset.replacementStep === 'text') {
      replaceButtonImage(element, context);
    } else {
      visitTextNodes(element, (textNode) => {
        const didMatch = replaceButtonLabel(textNode);
        if (didMatch) {
          element.dataset.replacementStep = 'text';
          replaceButtonImage(element, context);
          return true;
        }
        return false;
      });
    }
  }
}

function onTagMounted(
  tagName: string,
  cb: (collection: HTMLCollectionOf<Element>) => void
) {
  new MutationObserver((mutations) => {
    mutations
      .filter((mutation) => mutation.addedNodes)
      .filter((mutation) => mutation.target instanceof HTMLElement)
      .forEach((mutation) => {
        cb((mutation.target as HTMLElement).getElementsByTagName(tagName));
      });
  }).observe(document.body, { childList: true /* only direct children */ });
}

function observeConnectButtons(
  node: ParentNode = document.body,
  context: Context
) {
  new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length || m.type === 'attributes')) {
      // can we narrow down the algorithm to use rewriteConnectButtons(mutation.target)?
      rewriteConnectButtons(node, context);
    }
  }).observe(node, {
    subtree: true,
    childList: true,
    attributeFilter: ['src'],
  });
}

function observeShadowRootCollection(htmlCollection: HTMLCollection) {
  for (const node of htmlCollection) {
    if (node.shadowRoot) {
      observeConnectButtons(node.shadowRoot, { isOnboardV2: true });
    }
  }
}

const documentReady = () =>
  new Promise<void>((resolve) => {
    if (document.body) {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve());
    }
  });

const shouldUpdateButtons = window.location.origin !== 'https://app.zerion.io';
let isObserving = false;

export async function observeAndUpdatePageButtons() {
  /**
   * This script scans the page and updates generic "Browser Wallet" button
   * names and icons to help the user connect to the dapp
   */
  if (isObserving || !shouldUpdateButtons) {
    return;
  }
  isObserving = true;
  await documentReady();
  observeConnectButtons(document.body, {});
  observeShadowRootCollection(document.body.getElementsByTagName('onboard-v2'));
  onTagMounted('onboard-v2', observeShadowRootCollection);
}
