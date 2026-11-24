'use client';

import { useEffect } from 'react';

interface CustomScriptInjectorProps {
  headScripts?: string;
  bodyScripts?: string;
}

/**
 * Safely injects admin-configured analytics / verification snippets (e.g., Google Analytics,
 * Search Console meta tags) on public routes only. Never rendered inside /admin/*.
 */
export function CustomScriptInjector({ headScripts, bodyScripts }: CustomScriptInjectorProps) {
  useEffect(() => {
    const injectedNodes: HTMLElement[] = [];

    const injectHtml = (rawHtml: string | undefined, target: HTMLElement, prefix: string) => {
      if (!rawHtml || !rawHtml.trim()) return;
      const existing = target.querySelectorAll(`[data-savevibe-custom="${prefix}"]`);
      existing.forEach((el) => el.remove());

      const template = document.createElement('template');
      template.innerHTML = rawHtml.trim();

      Array.from(template.content.childNodes).forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;

        if (el.tagName === 'SCRIPT') {
          const scriptEl = document.createElement('script');
          Array.from(el.attributes).forEach((attr) => {
            scriptEl.setAttribute(attr.name, attr.value);
          });
          scriptEl.textContent = el.textContent || '';
          scriptEl.setAttribute('data-savevibe-custom', prefix);
          target.appendChild(scriptEl);
          injectedNodes.push(scriptEl);
        } else {
          const clone = el.cloneNode(true) as HTMLElement;
          clone.setAttribute('data-savevibe-custom', prefix);
          target.appendChild(clone);
          injectedNodes.push(clone);
        }
      });
    };

    injectHtml(headScripts, document.head, 'head');
    injectHtml(bodyScripts, document.body, 'body');

    return () => {
      injectedNodes.forEach((node) => node.remove());
    };
  }, [headScripts, bodyScripts]);

  return null;
}
