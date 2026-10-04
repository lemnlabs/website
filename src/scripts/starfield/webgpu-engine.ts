import { WORKGROUP_SIZE } from './config';
import { computeWGSL } from './compute-shader';
import { renderWGSL } from './render-shader';
import {
  PARTICLE_BYTES,
  UNIFORM_BYTES,
  UniformData,
  serializeParticles,
} from './gpu-data';
import type {
  FrameState,
  InteractionState,
  Particle,
  StarfieldEngine,
  Viewport,
} from './types';

export class WebGPUEngine implements StarfieldEngine {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private particleBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private computePipeline!: GPUComputePipeline;
  private renderPipeline!: GPURenderPipeline;
  private computeBindGroup!: GPUBindGroup;
  private renderBindGroup!: GPUBindGroup;
  private viewport: Viewport = { width: 0, height: 0, dpr: 1 };
  private particleCount = 0;
  private uniforms = new UniformData();
  private destroyed = false;
  private failure: Error | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private onFailure: (error: Error) => void,
  ) {}

  private reportFailure(error: Error): void {
    if (this.destroyed || this.failure) return;
    this.failure = error;
    this.onFailure(error);
  }

  private onGPUError = (event: GPUUncapturedErrorEvent): void => {
    this.reportFailure(new Error(event.error.message));
  };

  async init(): Promise<void> {
    if (!navigator.gpu) throw new Error('WebGPU를 사용할 수 없습니다.');
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (this.destroyed) return;
    if (!adapter) throw new Error('GPU 어댑터를 찾을 수 없습니다.');
    const device = await adapter.requestDevice();
    if (this.destroyed) {
      device.destroy();
      return;
    }
    this.device = device;
    device.addEventListener('uncapturederror', this.onGPUError);
    void device.lost.then((info) =>
      this.reportFailure(new Error(`GPU 장치 연결 종료: ${info.message}`)),
    );
    this.context = this.canvas.getContext('webgpu');
    if (!this.context) throw new Error('WebGPU 캔버스를 사용할 수 없습니다.');
    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device, format, alphaMode: 'premultiplied' });

    device.pushErrorScope('validation');
    let validationError: GPUError | null;
    try {
      this.computePipeline = await device.createComputePipelineAsync({
        layout: 'auto',
        compute: {
          module: device.createShaderModule({ code: computeWGSL }),
          entryPoint: 'main',
        },
      });
      if (this.destroyed) return;
      const renderModule = device.createShaderModule({ code: renderWGSL });
      this.renderPipeline = await device.createRenderPipelineAsync({
        layout: 'auto',
        vertex: { module: renderModule, entryPoint: 'vs_particle' },
        fragment: {
          module: renderModule,
          entryPoint: 'fs_particle',
          targets: [
            {
              format,
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one',
                  operation: 'add',
                },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
              },
            },
          ],
        },
        primitive: { topology: 'triangle-list' },
      });
      if (this.destroyed) return;
      this.uniformBuffer = device.createBuffer({
        size: UNIFORM_BYTES,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    } finally {
      validationError = await device.popErrorScope();
    }
    if (validationError && !this.destroyed)
      throw new Error(validationError.message);
    if (this.failure) throw this.failure;
  }

  resize(viewport: Viewport, particles: Particle[]): void {
    if (!this.device || this.destroyed) return;
    this.viewport = viewport;
    this.canvas.width = Math.floor(viewport.width * viewport.dpr);
    this.canvas.height = Math.floor(viewport.height * viewport.dpr);
    this.particleCount = particles.length;
    this.particleBuffer?.destroy();
    const data = serializeParticles(particles);
    this.particleBuffer = this.device.createBuffer({
      size: Math.max(PARTICLE_BYTES, data.byteLength),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    if (data.byteLength)
      this.device.queue.writeBuffer(this.particleBuffer, 0, data);
    const entries: GPUBindGroupEntry[] = [
      { binding: 0, resource: { buffer: this.uniformBuffer! } },
      { binding: 1, resource: { buffer: this.particleBuffer } },
    ];
    this.computeBindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries,
    });
    this.renderBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries,
    });
  }

  render(frame: FrameState, interaction: Readonly<InteractionState>): void {
    if (!this.device || !this.context || this.destroyed || !this.particleCount)
      return;
    if (this.failure) throw this.failure;
    this.uniforms.update(this.viewport, this.particleCount, frame, interaction);
    this.device.queue.writeBuffer(this.uniformBuffer!, 0, this.uniforms.buffer);
    const encoder = this.device.createCommandEncoder();
    if (!frame.static) {
      const compute = encoder.beginComputePass();
      compute.setPipeline(this.computePipeline);
      compute.setBindGroup(0, this.computeBindGroup);
      compute.dispatchWorkgroups(
        Math.ceil(this.particleCount / WORKGROUP_SIZE),
      );
      compute.end();
    }
    const render = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    render.setPipeline(this.renderPipeline);
    render.setBindGroup(0, this.renderBindGroup);
    render.draw(6, this.particleCount);
    render.end();
    this.device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.particleBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.context?.unconfigure();
    this.device?.removeEventListener('uncapturederror', this.onGPUError);
    this.device?.destroy();
    this.particleBuffer = null;
    this.uniformBuffer = null;
    this.context = null;
    this.device = null;
  }
}
