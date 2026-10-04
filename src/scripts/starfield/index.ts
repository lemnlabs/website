import { StarfieldController } from './controller';

let controller: StarfieldController | null = null;
let canvasWasFocused = false;

function mount(replaceCanvas = false, restoreFocus = false): void {
  const stage = document.querySelector<HTMLElement>('.starfield');
  let canvas = stage?.querySelector<HTMLCanvasElement>('#space-canvas');
  if (!stage || !canvas) return;
  if (replaceCanvas) {
    const replacement = canvas.cloneNode(true) as HTMLCanvasElement;
    canvas.replaceWith(replacement);
    canvas = replacement;
  }
  const mounted = new StarfieldController(stage, canvas);
  controller = mounted;
  void mounted
    .start()
    .then(() => {
      if (restoreFocus && controller === mounted) {
        mounted.focus();
      }
    })
    .catch((error: unknown) => {
      console.warn(
        '별 애니메이션을 사용할 수 없어 텍스트 로고를 표시합니다.',
        error,
      );
      mounted.destroy();
    });
}

window.addEventListener('pagehide', () => {
  canvasWasFocused = document.activeElement?.id === 'space-canvas';
  controller?.destroy();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) mount(true, canvasWasFocused);
});
mount();
