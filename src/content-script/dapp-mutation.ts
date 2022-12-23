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
      const re = /\bmetamask\b/i;
      return (
        re.test(img.getAttribute('src') || '') ||
        re.test(img.getAttribute('alt') || '')
      );
    });
  }
}

function replaceButtonImage(node: HTMLElement) {
  const imageLikeElements = node.querySelectorAll('img,svg,[role=img]');
  const element = getMostLikelyIcon(imageLikeElements);
  if (!element) {
    return;
  }
  const image = new Image();
  for (const { name, value } of element.attributes) {
    if (name !== 'src' && name !== 'srcset') {
      image.setAttribute(name, value);
    }
  }
  image.src = zerionLogoSrc;
  element.replaceWith(image);
  node.dataset.replacementStep = 'icon';
}

function isExternalLink(node: Element) {
  const href = node.getAttributeNode('href');
  if (node.tagName !== 'A' || !href) {
    return false;
  }
  try {
    const origin = new URL(href.value, href.baseURI).origin;
    return origin !== window.location.origin;
  } catch (e) {
    return false;
  }
}

const buttonLikeSelectors: Record<string, string> = {
  default: 'button,[role=button],a',
  'https://unstoppabledomains.com': 'button,[role=button],a,.MuiGrid-item',
};

function mutatePage(node = document.body) {
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
      replaceButtonImage(element);
    } else {
      visitTextNodes(element, (textNode) => {
        const didMatch = replaceButtonLabel(textNode);
        if (didMatch) {
          element.dataset.replacementStep = 'text';
          replaceButtonImage(element);
          return true;
        }
        return false;
      });
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
  new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length || m.type === 'attributes')) {
      performance.mark('mutatePage-1');
      // is it faster to call mutatePage(mutation.target) for each mutation
      // or call mutatePage() once, but scan whole document.body?
      mutatePage();
      performance.mark('mutatePage-2');
      performance.measure('mutatePage', 'mutatePage-1', 'mutatePage-2');
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributeFilter: ['src'],
  });
}
