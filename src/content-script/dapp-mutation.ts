import zerionLogoSrc from 'data-url:src/ui/assets/zerion-squircle.svg';

function visitTextNodes(node: Element, cb: (node: Node) => boolean) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let found = false;
  while (walker.nextNode() && !found) {
    found = cb(walker.currentNode);
  }
}

function replaceButtonLabel(textNode: Node): boolean | undefined {
  const labelsToReplace = [
    /\bMeta[mM]ask\b/,
    /\bInjected Wallet\b/,
    /\bInjected\b/,
    /\bDetected Wallet\b/,
    /\bBrowser Wallet\b/,
    /\bWeb3 Wallet\b/,
  ];
  for (const label of labelsToReplace) {
    if (textNode.textContent && label.test(textNode.textContent)) {
      textNode.textContent = 'Zerion Wallet';
      return true;
    }
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

let isObserving = false;

export async function watchAndUpdate() {
  if (isObserving) {
    return;
  }
  isObserving = true;
  await documentReady();
  new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length || m.type === 'attributes')) {
      // is it faster to call mutatePage(mutation.target) for each mutation
      // or call mutatePage() once, but scan whole document.body?
      mutatePage();
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributeFilter: ['src'],
  });
}
