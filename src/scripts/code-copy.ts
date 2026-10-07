import { buttonVariants } from '@heroui/styles';

const COPY_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const DEFAULT_BUTTON_CLASS = buttonVariants({
  variant: 'secondary',
  size: 'sm',
  className: 'code-copy-button',
});

const COPIED_BUTTON_CLASS = buttonVariants({
  variant: 'primary',
  size: 'sm',
  className: 'code-copy-button',
});

export function initCodeCopyButtons(root: ParentNode = document): void {
  const codeBlocks = root.querySelectorAll<HTMLPreElement>(
    '.markdown-prose pre',
  );

  for (const pre of codeBlocks) {
    if (pre.parentElement?.classList.contains('code-block-wrapper')) {
      continue;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = DEFAULT_BUTTON_CLASS;
    button.setAttribute('aria-label', '코드 복사');
    button.setAttribute('title', '코드 복사');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'code-copy-button__icon';
    iconSpan.innerHTML = COPY_ICON;

    const textSpan = document.createElement('span');
    textSpan.className = 'code-copy-button__text';
    textSpan.textContent = '복사';

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener('click', async () => {
      const codeElement = pre.querySelector('code') ?? pre;
      const textToCopy = (codeElement.textContent ?? '').replace(/\n$/, '');

      try {
        await navigator.clipboard.writeText(textToCopy);
        button.dataset.copied = 'true';
        button.className = COPIED_BUTTON_CLASS;
        button.setAttribute('aria-label', '복사되었습니다');
        iconSpan.innerHTML = CHECK_ICON;
        textSpan.textContent = '복사됨';

        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          delete button.dataset.copied;
          button.className = DEFAULT_BUTTON_CLASS;
          button.setAttribute('aria-label', '코드 복사');
          iconSpan.innerHTML = COPY_ICON;
          textSpan.textContent = '복사';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code to clipboard', err);
      }
    });

    wrapper.appendChild(button);
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCodeCopyButtons());
  } else {
    initCodeCopyButtons();
  }
  window.addEventListener('pageshow', () => initCodeCopyButtons());
}
