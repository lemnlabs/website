import { buttonVariants } from '@heroui/styles';

const COPY_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const CODE_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;

const DIAGRAM_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

const DEFAULT_BUTTON_CLASS = buttonVariants({
  variant: 'tertiary',
  size: 'sm',
  className: 'mermaid-diagram__btn',
});

const COPIED_BUTTON_CLASS = buttonVariants({
  variant: 'primary',
  size: 'sm',
  className: 'mermaid-diagram__btn',
});

let idCounter = 0;
let mermaidModulePromise: Promise<typeof import('mermaid')> | null = null;

async function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid');
  }
  return (await mermaidModulePromise).default;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function renderMermaidDiagrams(
  root: ParentNode = document,
): Promise<void> {
  const diagrams = root.querySelectorAll<HTMLElement>('.mermaid-diagram');
  if (diagrams.length === 0) return;

  const mermaid = await loadMermaid();

  const isDark =
    document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'redux-dark-color' : 'redux-color',
    fontFamily:
      "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif",
    securityLevel: 'loose',
    themeVariables: isDark
      ? {
          background: '#24292e',
          lineColor: '#adbac7',
          defaultLinkColor: '#adbac7',
          arrowheadColor: '#adbac7',
        }
      : {
          background: '#f6f8fa',
          lineColor: '#57606a',
          defaultLinkColor: '#57606a',
          arrowheadColor: '#57606a',
        },
  });

  for (let i = 0; i < diagrams.length; i++) {
    const diagram = diagrams[i];
    const rawCode = (diagram.dataset.mermaidCode ?? '').trim();
    if (!rawCode) continue;

    let viewport = diagram.querySelector<HTMLElement>(
      '.mermaid-diagram__viewport',
    );
    if (!viewport) {
      viewport = document.createElement('div');
      viewport.className = 'mermaid-diagram__viewport';
      diagram.appendChild(viewport);
    }

    // Set up toolbar actions and code view if not already created
    if (!diagram.dataset.initialized) {
      setupDiagramUi(diagram, rawCode, viewport);
      diagram.dataset.initialized = 'true';
    }

    // Render SVG
    try {
      const renderId = `mermaid-svg-${i}-${++idCounter}`;
      const { svg, bindFunctions } = await mermaid.render(renderId, rawCode);

      viewport.innerHTML = svg;
      if (typeof bindFunctions === 'function') {
        bindFunctions(viewport);
      }
      diagram.dataset.renderSuccess = 'true';
    } catch (err) {
      console.error('Mermaid render error:', err);
      diagram.dataset.renderSuccess = 'false';

      // Clean up any stray error container that Mermaid might have appended to body
      const strayError = document.querySelector('[id^="dmermaid-svg-"]');
      if (strayError && strayError.parentNode) {
        strayError.parentNode.removeChild(strayError);
      }

      const errorMessage =
        err instanceof Error ? err.message : '다이어그램 문법을 확인해주세요.';
      viewport.innerHTML = `
        <div class="mermaid-diagram__error">
          <div class="mermaid-diagram__error-badge">다이어그램 문법 오류</div>
          <div class="mermaid-diagram__error-message">${escapeHtml(errorMessage)}</div>
        </div>
      `;
    }
  }
}

function setupDiagramUi(
  diagram: HTMLElement,
  rawCode: string,
  viewport: HTMLElement,
): void {
  // Floating Actions toolbar (appears on hover)
  const actions = document.createElement('div');
  actions.className = 'mermaid-diagram__actions';

  // Toggle code/diagram button
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = DEFAULT_BUTTON_CLASS;
  toggleBtn.setAttribute('aria-label', '코드 보기');

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'mermaid-diagram__btn-icon';
  toggleIcon.innerHTML = CODE_ICON;

  const toggleText = document.createElement('span');
  toggleText.className = 'mermaid-diagram__btn-text';
  toggleText.textContent = '코드 보기';

  toggleBtn.appendChild(toggleIcon);
  toggleBtn.appendChild(toggleText);
  actions.appendChild(toggleBtn);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = DEFAULT_BUTTON_CLASS;
  copyBtn.setAttribute('aria-label', '코드 복사');
  copyBtn.setAttribute('title', '코드 복사');

  const copyIcon = document.createElement('span');
  copyIcon.className = 'mermaid-diagram__btn-icon';
  copyIcon.innerHTML = COPY_ICON;

  const copyText = document.createElement('span');
  copyText.className = 'mermaid-diagram__btn-text';
  copyText.textContent = '복사';

  copyBtn.appendChild(copyIcon);
  copyBtn.appendChild(copyText);
  actions.appendChild(copyBtn);

  diagram.insertBefore(actions, viewport);

  // Code view container (toggled via button)
  const codeView = document.createElement('div');
  codeView.className = 'mermaid-diagram__code-view';
  codeView.style.display = 'none';

  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = rawCode;
  pre.appendChild(code);
  codeView.appendChild(pre);

  diagram.appendChild(codeView);

  // Toggle button handler
  let isCodeVisible = false;
  toggleBtn.addEventListener('click', () => {
    isCodeVisible = !isCodeVisible;
    if (isCodeVisible) {
      viewport.style.display = 'none';
      codeView.style.display = 'block';
      diagram.dataset.codeVisible = 'true';
      toggleIcon.innerHTML = DIAGRAM_ICON;
      toggleText.textContent = '다이어그램 보기';
      toggleBtn.setAttribute('aria-label', '다이어그램 보기');
    } else {
      viewport.style.display = 'flex';
      codeView.style.display = 'none';
      delete diagram.dataset.codeVisible;
      toggleIcon.innerHTML = CODE_ICON;
      toggleText.textContent = '코드 보기';
      toggleBtn.setAttribute('aria-label', '코드 보기');
    }
  });

  // Copy button handler
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      copyBtn.dataset.copied = 'true';
      diagram.dataset.copied = 'true';
      copyBtn.className = COPIED_BUTTON_CLASS;
      copyBtn.setAttribute('aria-label', '복사되었습니다');
      copyIcon.innerHTML = CHECK_ICON;
      copyText.textContent = '복사됨';

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        delete copyBtn.dataset.copied;
        delete diagram.dataset.copied;
        copyBtn.className = DEFAULT_BUTTON_CLASS;
        copyBtn.setAttribute('aria-label', '코드 복사');
        copyIcon.innerHTML = COPY_ICON;
        copyText.textContent = '복사';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy mermaid code', err);
    }
  });
}

// Lifecycle registration
if (typeof window !== 'undefined') {
  const init = () => {
    renderMermaidDiagrams().catch((err) =>
      console.error('Mermaid initialization failed:', err),
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', init);

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener('change', init);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'data-theme'
      ) {
        init();
        break;
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
