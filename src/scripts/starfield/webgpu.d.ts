// TypeScript 6 includes the WebGPU interfaces but omits these browser bindings.
export {};

declare global {
  const GPUBufferUsage: {
    readonly COPY_DST: 0x0008;
    readonly UNIFORM: 0x0040;
    readonly STORAGE: 0x0080;
  };

  interface HTMLCanvasElement {
    getContext(contextId: 'webgpu'): GPUCanvasContext | null;
  }
}
