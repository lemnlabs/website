import { Canvas2DEngine } from './canvas-engine';
import { EFFECT_DECAY, EFFECT_STRENGTH, MAX_DPR } from './config';
import { waitForFonts } from './fonts';
import { sampleAllStars } from './particles';
import { WebGPUEngine } from './webgpu-engine';
import type { InteractionState, StarfieldEngine, Viewport } from './types';

function idleInteraction(): InteractionState {
  return {
    isPressed: false,
    mouseX: -1000,
    mouseY: -1000,
    releaseX: -1000,
    releaseY: -1000,
    releaseBurst: 0,
    pulseTrigger: 0,
  };
}

export class StarfieldController {
  private engine: StarfieldEngine | null = null;
  private viewport: Viewport | null = null;
  private interaction = idleInteraction();
  private lifetime = new AbortController();
  private canvasEvents = new AbortController();
  private motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private observer: ResizeObserver | null = null;
  private activePointer: number | null = null;
  private animationFrame = 0;
  private lastTime = 0;
  private disposed = false;
  private initializing = true;
  private fallbackUsed = false;

  constructor(
    private stage: HTMLElement,
    private canvas: HTMLCanvasElement,
  ) {}

  async start(): Promise<void> {
    await waitForFonts(this.lifetime.signal);
    if (this.disposed) return;
    const gpu = new WebGPUEngine(this.canvas, (error) => {
      if (!this.initializing && this.engine === gpu) this.recover(error);
    });
    this.engine = gpu;
    try {
      await gpu.init();
      if (this.disposed) return;
      this.initializing = false;
      this.bindCanvas();
      this.resize(true);
    } catch (error) {
      if (this.disposed) return;
      this.initializing = false;
      this.recover(error);
    }
    if (this.disposed || !this.engine) return;
    const { signal } = this.lifetime;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.stage);
    this.motion.addEventListener(
      'change',
      () => {
        this.stopLoop();
        this.resetInteraction();
        this.resize(true);
      },
      { signal },
    );
    document.fonts?.addEventListener('loadingdone', () => this.resize(true), {
      signal,
    });
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  private startLoop(): void {
    if (
      this.disposed ||
      !this.engine ||
      this.motion.matches ||
      this.animationFrame ||
      !this.viewport?.width ||
      !this.viewport.height
    )
      return;
    this.lastTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    this.animationFrame = 0;
    const dt = Math.min((now - this.lastTime) * 0.001, 0.033);
    this.lastTime = now;
    if (this.draw(now * 0.001, dt)) {
      this.interaction.releaseBurst =
        this.interaction.releaseBurst > 0.005
          ? this.interaction.releaseBurst * EFFECT_DECAY
          : 0;
      this.interaction.pulseTrigger =
        this.interaction.pulseTrigger > 0.01
          ? this.interaction.pulseTrigger * EFFECT_DECAY
          : 0;
    }
    if (
      !this.disposed &&
      this.engine &&
      !this.motion.matches &&
      this.viewport?.width &&
      this.viewport.height &&
      !this.animationFrame
    ) {
      this.animationFrame = requestAnimationFrame(this.tick);
    }
  };

  private draw(time: number, dt: number): boolean {
    if (
      this.disposed ||
      !this.engine ||
      !this.viewport?.width ||
      !this.viewport.height
    )
      return false;
    try {
      this.engine.render(
        { time, dt, static: this.motion.matches },
        this.interaction,
      );
      this.stage.dataset.ready = 'true';
      return true;
    } catch (error) {
      this.recover(error);
      return false;
    }
  }

  private resize(force = false): void {
    if (this.disposed || !this.engine) return;
    const viewport = {
      width: Math.floor(this.canvas.clientWidth),
      height: Math.floor(this.canvas.clientHeight),
      dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
    };
    if (
      !force &&
      this.viewport?.width === viewport.width &&
      this.viewport.height === viewport.height &&
      this.viewport.dpr === viewport.dpr
    )
      return;
    this.stopLoop();
    this.viewport = viewport;
    if (!viewport.width || !viewport.height) {
      delete this.stage.dataset.ready;
      return;
    }
    try {
      const particles = sampleAllStars(viewport);
      if (this.motion.matches)
        particles.forEach((p) => {
          p.vx = 0;
          p.vy = 0;
        });
      this.engine.resize(viewport, particles);
      if (this.draw(this.motion.matches ? 0 : performance.now() * 0.001, 0))
        this.startLoop();
    } catch (error) {
      this.recover(error);
    }
  }

  private recover(error: unknown): void {
    if (this.disposed) return;
    this.stopLoop();
    delete this.stage.dataset.ready;
    this.resetInteraction();
    this.engine?.destroy();
    this.engine = null;
    if (this.fallbackUsed) {
      console.warn(
        '별 애니메이션을 사용할 수 없어 텍스트 로고를 표시합니다.',
        error,
      );
      this.destroy();
      return;
    }
    console.warn('별 애니메이션을 Canvas 2D로 전환합니다.', error);
    this.fallbackUsed = true;
    const focused = document.activeElement === this.canvas;
    this.canvasEvents.abort();
    // A canvas cannot switch context types after a WebGPU context was acquired.
    const replacement = this.canvas.cloneNode(true) as HTMLCanvasElement;
    this.canvas.replaceWith(replacement);
    this.canvas = replacement;
    this.viewport = null;
    this.canvasEvents = new AbortController();
    this.engine = new Canvas2DEngine(this.canvas);
    try {
      this.engine.init();
      this.bindCanvas();
      this.resize(true);
      if (focused && this.engine) this.canvas.focus({ preventScroll: true });
    } catch (fallbackError) {
      this.recover(fallbackError);
    }
  }

  private setPointerPosition(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.interaction.mouseX = event.clientX - rect.left;
    this.interaction.mouseY = event.clientY - rect.top;
  }

  private releasePointer(burst: boolean): void {
    const pointer = this.activePointer;
    this.activePointer = null;
    this.interaction.isPressed = false;
    if (burst && !this.motion.matches) {
      this.interaction.releaseX = this.interaction.mouseX;
      this.interaction.releaseY = this.interaction.mouseY;
      this.interaction.releaseBurst = EFFECT_STRENGTH;
    }
    if (pointer !== null && this.canvas.hasPointerCapture(pointer))
      this.canvas.releasePointerCapture(pointer);
  }

  private resetInteraction(): void {
    this.releasePointer(false);
    this.interaction = idleInteraction();
  }

  private bindCanvas(): void {
    const { signal } = this.canvasEvents;
    this.canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (
          event.button !== 0 ||
          this.motion.matches ||
          this.activePointer !== null ||
          !this.stage.dataset.ready
        )
          return;
        this.canvas.setPointerCapture(event.pointerId);
        this.activePointer = event.pointerId;
        this.interaction.isPressed = true;
        this.setPointerPosition(event);
      },
      { signal },
    );
    this.canvas.addEventListener(
      'pointermove',
      (event) => {
        if (
          this.motion.matches ||
          (this.activePointer !== null &&
            event.pointerId !== this.activePointer) ||
          (this.activePointer === null && !event.isPrimary)
        )
          return;
        this.setPointerPosition(event);
      },
      { signal },
    );
    this.canvas.addEventListener(
      'pointerup',
      (event) => {
        if (event.pointerId !== this.activePointer) return;
        this.setPointerPosition(event);
        this.releasePointer(true);
      },
      { signal },
    );
    this.canvas.addEventListener(
      'pointercancel',
      (event) => {
        if (event.pointerId === this.activePointer) this.releasePointer(true);
      },
      { signal },
    );
    this.canvas.addEventListener(
      'lostpointercapture',
      (event) => {
        if (event.pointerId === this.activePointer) this.releasePointer(false);
      },
      { signal },
    );
    this.canvas.addEventListener('blur', () => this.resetInteraction(), {
      signal,
    });
    this.canvas.addEventListener(
      'pointerleave',
      () => {
        if (this.activePointer === null) {
          this.interaction.mouseX = -1000;
          this.interaction.mouseY = -1000;
        }
      },
      { signal },
    );
    this.canvas.addEventListener(
      'keydown',
      (event) => {
        if (
          event.code !== 'Space' ||
          this.motion.matches ||
          !this.stage.dataset.ready
        )
          return;
        event.preventDefault();
        this.interaction.pulseTrigger = EFFECT_STRENGTH;
      },
      { signal },
    );
  }

  focus(): void {
    if (!this.disposed && this.stage.dataset.ready) {
      this.canvas.focus({ preventScroll: true });
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.resetInteraction();
    this.lifetime.abort();
    this.canvasEvents.abort();
    this.observer?.disconnect();
    this.engine?.destroy();
    this.engine = null;
    delete this.stage.dataset.ready;
  }
}
