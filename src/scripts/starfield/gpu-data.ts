import type { FrameState, InteractionState, Particle, Viewport } from './types';

// Four vec4 fields, each occupying 16 bytes. Keep aligned with both WGSL structs.
export const PARTICLE_FLOATS = 16;
export const PARTICLE_BYTES = PARTICLE_FLOATS * Float32Array.BYTES_PER_ELEMENT;
export const UNIFORM_BYTES = 64;
export const PARTICLE_OFFSET = {
  positionVelocity: 0,
  originProperties: 4,
  color: 8,
  extra: 12,
} as const;
export const UNIFORM_OFFSET = {
  viewportPointer: 0,
  timeEffects: 4,
  count: 8,
  releasePulse: 12,
} as const;

export function serializeParticles(
  particles: readonly Particle[],
): Float32Array<ArrayBuffer> {
  const data = new Float32Array(particles.length * PARTICLE_FLOATS);
  particles.forEach((p, index) => {
    const start = index * PARTICLE_FLOATS;
    data.set([p.x, p.y, p.vx, p.vy], start + PARTICLE_OFFSET.positionVelocity);
    data.set(
      [p.originX, p.originY, p.size, p.twinklePhase],
      start + PARTICLE_OFFSET.originProperties,
    );
    data.set(p.color, start + PARTICLE_OFFSET.color);
    data.set(
      [p.twinkleSpeed, p.idleSeed, p.isBackground, p.wanderFactor],
      start + PARTICLE_OFFSET.extra,
    );
  });
  return data;
}

export class UniformData {
  readonly buffer = new ArrayBuffer(UNIFORM_BYTES);
  private floats = new Float32Array(this.buffer);
  private uints = new Uint32Array(this.buffer);

  update(
    viewport: Viewport,
    count: number,
    frame: FrameState,
    input: Readonly<InteractionState>,
  ): void {
    this.floats.set(
      [viewport.width, viewport.height, input.mouseX, input.mouseY],
      UNIFORM_OFFSET.viewportPointer,
    );
    this.floats.set(
      [frame.time, frame.dt, Number(input.isPressed), input.releaseBurst],
      UNIFORM_OFFSET.timeEffects,
    );
    this.uints[UNIFORM_OFFSET.count] = count;
    this.floats.set(
      [input.releaseX, input.releaseY, input.pulseTrigger, 0],
      UNIFORM_OFFSET.releasePulse,
    );
  }
}
