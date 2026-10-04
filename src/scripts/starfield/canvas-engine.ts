import type {
  FrameState,
  InteractionState,
  Particle,
  StarfieldEngine,
  Viewport,
} from './types';

export class Canvas2DEngine implements StarfieldEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private viewport: Viewport = { width: 0, height: 0, dpr: 1 };

  constructor(private canvas: HTMLCanvasElement) {}

  init(): void {
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D를 사용할 수 없습니다.');
  }

  resize(viewport: Viewport, particles: Particle[]): void {
    this.viewport = viewport;
    this.canvas.width = Math.floor(viewport.width * viewport.dpr);
    this.canvas.height = Math.floor(viewport.height * viewport.dpr);
    this.ctx!.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    this.particles = particles;
  }

  render(frame: FrameState, interaction: Readonly<InteractionState>): void {
    if (!this.ctx || !this.viewport.width || !this.viewport.height) return;
    const { width: w, height: h } = this.viewport;
    const { time } = frame;
    const {
      isPressed,
      mouseX: mx,
      mouseY: my,
      releaseX: rx,
      releaseY: ry,
      releaseBurst: rBurst,
    } = interaction;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (!frame.static) {
        const idleTime = time * (0.45 + p.idleSeed * 0.15) + p.twinklePhase;
        let idleOffsetX = Math.sin(idleTime) * 1.1;
        let idleOffsetY = Math.cos(idleTime * 1.25) * 1.1;

        if (p.isBackground < 0.5 && p.wanderFactor > 0.05) {
          const wanderRadius = 14.0 + p.wanderFactor * 20.0;
          const wanderSpeed = 0.5 + p.idleSeed * 0.22;
          const tWander = time * wanderSpeed + p.idleSeed * 2.5;
          idleOffsetX =
            Math.sin(tWander) * wanderRadius +
            Math.cos(tWander * 0.6) * (wanderRadius * 0.4);
          idleOffsetY =
            Math.cos(tWander * 0.8) * wanderRadius +
            Math.sin(tWander * 1.3) * (wanderRadius * 0.35);
        }

        const targetX = p.originX + idleOffsetX;
        const targetY = p.originY + idleOffsetY;

        if (p.isBackground > 0.5) {
          // 배경 별
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.hypot(dx, dy);
          if (isPressed && dist < 300 && dist > 1) {
            p.vx += (dx / dist) * (1 - dist / 300) * 0.4;
            p.vy += (dy / dist) * (1 - dist / 300) * 0.4;
          }
          p.vx += (targetX - p.x) * 0.04;
          p.vy += (targetY - p.y) * 0.04;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          // 글자 별
          if (isPressed) {
            const dx = mx - p.x;
            const dy = my - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const gravityRadius = 420;

            if (dist > 1 && dist < gravityRadius) {
              const nx = dx / dist;
              const ny = dy / dist;
              const force = (1 - dist / gravityRadius) * 20;
              const tx = -ny * 0.48;
              const ty = nx * 0.48;

              if (dist < 26) {
                p.vx += tx * 7.5 - nx * 2.2;
                p.vy += ty * 7.5 - ny * 2.2;
              } else {
                p.vx += (nx * 1.25 + tx * 0.5) * force;
                p.vy += (ny * 1.25 + ty * 0.5) * force;
              }
            } else if (dist >= gravityRadius) {
              p.vx += (dx / dist) * 1.0;
              p.vy += (dy / dist) * 1.0;
            }
            p.vx *= 0.88;
            p.vy *= 0.88;
            p.x += p.vx;
            p.y += p.vy;
          } else {
            if (p.wanderFactor > 0.1) {
              const dxM = mx - p.x;
              const dyM = my - p.y;
              const distM = Math.hypot(dxM, dyM);
              if (distM < 160 && distM > 1) {
                const repel = (1 - distM / 160) * p.wanderFactor * 1.4;
                p.vx -= (dxM / distM) * repel;
                p.vy -= (dyM / distM) * repel;
              }
            }

            if (rBurst > 0.01) {
              const dx = p.x - rx;
              const dy = p.y - ry;
              const rDist = Math.max(Math.hypot(dx, dy), 1);
              const normX = dx / rDist;
              const normY = dy / rDist;

              const coreBoost = Math.min(Math.max(60 / (rDist + 30), 1.0), 1.4);
              const burstForce = rBurst * 18 * coreBoost;
              const angle = p.twinklePhase * 6.28 + p.idleSeed;
              const turbX = Math.cos(angle) * 4 * rBurst;
              const turbY = Math.sin(angle) * 4 * rBurst;

              p.vx += normX * burstForce + turbX;
              p.vy += normY * burstForce + turbY;
            }

            p.vx *= 0.88;
            p.vy *= 0.88;

            const returnSuppress = Math.min(
              Math.max(1 - rBurst * 0.25, 0.65),
              1.0,
            );
            const easeRate = 0.026 * returnSuppress;

            const dx = targetX - p.x;
            const dy = targetY - p.y;
            p.x += p.vx + dx * easeRate;
            p.y += p.vy + dy * easeRate;
          }
        }

        if (interaction.pulseTrigger > 0.01) {
          const cx = w * 0.5;
          const cy = h * 0.5;
          const fromCX = p.x - cx;
          const fromCY = p.y - cy;
          const cDist = Math.max(Math.hypot(fromCX, fromCY), 1.0);
          p.vx += (fromCX / cDist) * interaction.pulseTrigger * 26;
          p.vy += (fromCY / cDist) * interaction.pulseTrigger * 26;
        }

        p.twinklePhase += p.twinkleSpeed;
      }
      const twinkle = Math.sin(p.twinklePhase) * 0.28 + 0.72;

      const [r, g, b, a] = p.color;
      const alpha = (a || 1.0) * twinkle;
      const currentSize = p.size * (0.88 + twinkle * 0.2);

      // 1. 광학 색수차 (Chromatic Aberration: 상단 레드, 하단 블루 분산)
      const caOffset = Math.max(1.0, currentSize * 0.26);

      // 상단 레드 채널 편향 분산광 (-y 방향)
      this.ctx.fillStyle = `rgba(255, 45, 75, ${alpha * 0.45})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - caOffset, currentSize * 1.15, 0, Math.PI * 2);
      this.ctx.fill();

      // 하단 블루 채널 편향 분산광 (+y 방향)
      this.ctx.fillStyle = `rgba(45, 140, 255, ${alpha * 0.45})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y + caOffset, currentSize * 1.15, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. 별 본연의 은하 천체 색상 헤일로 (중심)
      this.ctx.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha * 0.85})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentSize * 1.25, 0, Math.PI * 2);
      this.ctx.fill();

      // 3. 중심 순백 다이아몬드 코어 (모든 별의 중심은 눈부신 백색 항성광)
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, alpha * 1.3)})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentSize * 0.42, 0, Math.PI * 2);
      this.ctx.fill();

      // 4. 십자 플레어 색수차 (상단 루비 레드, 하단 사파이어 블루)
      if (p.isBackground < 0.5 && p.size > 3.3) {
        const flareLen = currentSize * 2.8;
        this.ctx.lineWidth = 0.8;

        // 수평 플레어 (부드러운 백색 별빛)
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x - flareLen, p.y);
        this.ctx.lineTo(p.x + flareLen, p.y);
        this.ctx.stroke();

        // 수직 상단 플레어 (색수차 적색광)
        this.ctx.strokeStyle = `rgba(255, 60, 90, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x, p.y - flareLen);
        this.ctx.stroke();

        // 수직 하단 플레어 (색수차 청색광)
        this.ctx.strokeStyle = `rgba(60, 150, 255, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x, p.y + flareLen);
        this.ctx.stroke();
      }
    }
  }

  destroy(): void {
    this.particles = [];
    this.ctx = null;
  }
}
