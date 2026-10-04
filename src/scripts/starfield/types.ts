export type StarColor = [number, number, number, number];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  size: number;
  color: StarColor;
  twinklePhase: number;
  twinkleSpeed: number;
  idleSeed: number;
  isBackground: number;
  wanderFactor: number;
}

export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export interface FrameState {
  time: number;
  dt: number;
  static: boolean;
}

export interface InteractionState {
  isPressed: boolean;
  mouseX: number;
  mouseY: number;
  releaseX: number;
  releaseY: number;
  releaseBurst: number;
  pulseTrigger: number;
}

export interface StarfieldEngine {
  init(): void | Promise<void>;
  resize(viewport: Viewport, particles: Particle[]): void;
  render(frame: FrameState, interaction: Readonly<InteractionState>): void;
  destroy(): void;
}
