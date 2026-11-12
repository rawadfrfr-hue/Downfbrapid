'use client';

import { useEffect } from 'react';

const ANTI_NETLIFY_CSS = `
  netlify-drawer,
  netlify-badge,
  netlify-feedback,
  netlify-toolbar,
  netlify-identity-widget,
  [data-netlify],
  [data-netlify-badge],
  [data-netlify-drawer],
  [id*="netlify" i],
  [class*="netlify" i],
  iframe[src*="netlify"],
  a[href*="netlify.com"][class*="badge"],
  a[href*="netlify.com"][style*="fixed"],
  a[href*="netlify.app"][class*="badge"],
  a[href*="netlify.com"],
  a[href*="netlify.app"],
  div[style*="position: fixed"][style*="bottom"][style*="right"][style*="netlify" i],
  div[style*="position: fixed"][style*="bottom"][style*="left"][style*="netlify" i],
  #netlify-badge,
  .netlify-badge,
  .powered-by-netlify,
  #powered-by-netlify,
  .netlify-container,
  #netlify-container {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    max-width: 0 !important;
    max-height: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    top: -9999px !important;
    left: -9999px !important;
    z-index: -99999 !important;
    transform: scale(0) !important;
    clip: rect(0, 0, 0, 0) !important;
  }
`;

export default function NetlifyBadgeRemover() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Inject Style directly into <head> if not already present
    const injectStyles = () => {
      if (!document.getElementById('anti-netlify-style')) {
        const style = document.createElement('style');
        style.id = 'anti-netlify-style';
        style.textContent = ANTI_NETLIFY_CSS;
        (document.head || document.documentElement).appendChild(style);
      }
    };

    // 2. Monkey Patch attachShadow for Shadow DOM Bypass
    const patchAttachShadow = () => {
      const originalAttachShadow = Element.prototype.attachShadow;
      if (originalAttachShadow && !(originalAttachShadow as unknown as { __patchedBySaveVibe?: boolean }).__patchedBySaveVibe) {
        Element.prototype.attachShadow = function (init) {
          const shadowRoot = originalAttachShadow.call(this, init);
          
          try {
            const shadowStyle = document.createElement('style');
            shadowStyle.textContent = `:host, :host * { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; }`;
            shadowRoot.appendChild(shadowStyle);
          } catch {
            // Ignore shadow DOM injection error
          }

          if (isNetlifyNode(this)) {
            setTimeout(() => {
              try {
                this.remove();
              } catch {
                // Ignore removal error
              }
            }, 0);
          }

          return shadowRoot;
        };
        (Element.prototype.attachShadow as unknown as { __patchedBySaveVibe?: boolean }).__patchedBySaveVibe = true;
      }
    };

    // Helper: Detect if a DOM element belongs to Netlify
    const isNetlifyNode = (node: Node): boolean => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
      const el = node as HTMLElement;
      const tag = el.tagName ? el.tagName.toLowerCase() : '';

      if (tag.includes('netlify')) return true;

      const id = el.id ? String(el.id).toLowerCase() : '';
      if (id.includes('netlify')) return true;

      const className = el.className && typeof el.className === 'string' ? el.className.toLowerCase() : '';
      if (className.includes('netlify')) return true;

      if (
        el.hasAttribute &&
        (el.hasAttribute('data-netlify') ||
          el.hasAttribute('data-netlify-badge') ||
          el.hasAttribute('data-netlify-drawer'))
      ) {
        return true;
      }

      if (tag === 'a') {
        const anchor = el as HTMLAnchorElement;
        if (anchor.href && (anchor.href.includes('netlify.com') || anchor.href.includes('netlify.app'))) {
          return true;
        }
      }

      if (tag === 'iframe') {
        const iframe = el as HTMLIFrameElement;
        if (iframe.src && iframe.src.includes('netlify')) {
          return true;
        }
      }

      // Check text content in floating elements
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style && (style.position === 'fixed' || style.position === 'absolute')) {
        const text = el.textContent || '';
        if (/powered\s+by\s+netlify/i.test(text) || /deploys?\s+by\s+netlify/i.test(text)) {
          return true;
        }
      }

      return false;
    };

    // 3. Deep Recursive Shadow DOM and DOM Purge
    const purgeNodeAndShadow = (root: Node) => {
      if (!root) return;

      if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as HTMLElement;

        // Traverse Shadow Root
        if (el.shadowRoot) {
          try {
            const shadowStyle = document.createElement('style');
            shadowStyle.textContent = `:host, :host * { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; }`;
            el.shadowRoot.appendChild(shadowStyle);

            const shadowChildren = Array.from(el.shadowRoot.querySelectorAll('*'));
            shadowChildren.forEach((child) => purgeNodeAndShadow(child));
          } catch {
            // Ignore shadow root access error
          }
        }

        // Check if current element is Netlify element
        if (isNetlifyNode(el)) {
          try {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.remove();
          } catch {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }
          return;
        }
      }

      // Traverse Child Nodes
      if (root.childNodes && root.childNodes.length > 0) {
        const children = Array.from(root.childNodes);
        children.forEach((child) => purgeNodeAndShadow(child));
      }
    };

    // 4. Global Full Scan
    const runFullPurge = () => {
      try {
        // Query known selectors directly
        const knownSelectors = [
          'netlify-drawer',
          'netlify-badge',
          'netlify-feedback',
          'netlify-toolbar',
          'netlify-identity-widget',
          '[data-netlify]',
          '[data-netlify-badge]',
          '[data-netlify-drawer]',
          '[id*="netlify" i]',
          '[class*="netlify" i]',
          'iframe[src*="netlify"]',
          'a[href*="netlify.com"]',
          'a[href*="netlify.app"]',
        ];

        knownSelectors.forEach((selector) => {
          try {
            document.querySelectorAll(selector).forEach((node) => {
              node.remove();
            });
          } catch {
            // Ignore invalid selector error
          }
        });

        // Scan all DOM elements including shadow hosts
        const allElements = Array.from(document.querySelectorAll('*'));
        allElements.forEach((el) => {
          purgeNodeAndShadow(el);
        });
      } catch {
        // Ignore purge error
      }
    };

    // Execute immediately
    injectStyles();
    patchAttachShadow();
    runFullPurge();

    // 5. MutationObserver Setup
    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((mutations) => {
        let shouldPurge = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              purgeNodeAndShadow(node);
              shouldPurge = true;
            });
          }
        });

        if (shouldPurge) {
          runFullPurge();
        }
      });

      const target = document.documentElement || document.body;
      if (target) {
        observer.observe(target, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'id', 'src', 'href'],
        });
      }
    }

    // 6. High-frequency short interval & continuous backup interval
    const intervalFast = setInterval(() => {
      runFullPurge();
    }, 50);

    const intervalSlow = setInterval(() => {
      runFullPurge();
    }, 500);

    // Stop fast interval after 10 seconds to save CPU, keep slow interval running
    const timeoutFast = setTimeout(() => {
      clearInterval(intervalFast);
    }, 10000);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearInterval(intervalFast);
      clearInterval(intervalSlow);
      clearTimeout(timeoutFast);
    };
  }, []);

  return null;
}
