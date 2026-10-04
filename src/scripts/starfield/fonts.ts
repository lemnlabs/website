import { FONT_LOAD_TIMEOUT, FONT_STYLESHEET_TIMEOUT } from './config';

// Each wait removes its listeners and timer on success, timeout, or disposal.
function boundedWait(
  signal: AbortSignal,
  timeout: number,
  subscribe: (finish: () => void) => () => void,
): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      unsubscribe();
      resolve();
    };
    const timer = window.setTimeout(finish, timeout);
    signal.addEventListener('abort', finish, { once: true });
    unsubscribe = subscribe(finish);
  });
}

export async function waitForFonts(signal: AbortSignal): Promise<void> {
  const link = document.getElementById('font-stylesheet');
  if (link instanceof HTMLLinkElement && !link.sheet) {
    await boundedWait(signal, FONT_STYLESHEET_TIMEOUT, (finish) => {
      link.addEventListener('load', finish);
      link.addEventListener('error', finish);
      return () => {
        link.removeEventListener('load', finish);
        link.removeEventListener('error', finish);
      };
    });
  }
  if (signal.aborted || !document.fonts) return;
  await boundedWait(signal, FONT_LOAD_TIMEOUT, (finish) => {
    let active = true;
    void Promise.all([
      document.fonts.load('200 48px "JetBrains Mono"'),
      document.fonts.load('400 48px "JetBrains Mono"'),
      document.fonts.ready,
    ])
      .catch((error: unknown) => {
        if (active)
          console.warn('로고 폰트 대신 기본 폰트를 사용합니다.', error);
      })
      .finally(() => {
        if (active) finish();
      });
    return () => {
      active = false;
    };
  });
}
