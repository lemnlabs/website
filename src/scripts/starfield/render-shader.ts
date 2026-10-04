export const renderWGSL = `
struct Particle {
  pos_vel: vec4<f32>,
  origin_props: vec4<f32>,
  color: vec4<f32>,
  extra: vec4<f32>,
};

struct SimUniforms {
  u0: vec4<f32>,
  u1: vec4<f32>,
  u2: vec4<u32>,
  u3: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localUV: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) size: f32,
  @location(3) twinkle: f32,
  @location(4) isBackground: f32,
};

@group(0) @binding(0) var<uniform> uniforms: SimUniforms;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;

@vertex
fn vs_particle(
  @builtin(vertex_index) vIdx: u32,
  @builtin(instance_index) iIdx: u32
) -> VertexOutput {
  let p = particles[iIdx];
  let pos = p.pos_vel.xy;
  let vel = p.pos_vel.zw;
  let baseSize = p.origin_props.z;
  let twinklePhase = p.origin_props.w;
  let color = p.color;
  let isBackground = p.extra.z;

  var offsets = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );

  let offset = offsets[vIdx];
  let twinkleVal = sin(twinklePhase) * 0.28 + 0.72;
  let speed = length(vel);
  let currentSize = baseSize * (1.0 + min(speed * 0.03, 0.6)) * (0.88 + twinkleVal * 0.2);
  let quadRadius = currentSize * 3.4;

  let screenPos = pos + offset * quadRadius;
  let screenSize = uniforms.u0.xy;
  let ndc = (screenPos / screenSize) * 2.0 - 1.0;

  var out: VertexOutput;
  out.position = vec4<f32>(ndc.x, -ndc.y, 0.0, 1.0);
  out.localUV = offset;
  out.color = color;
  out.size = baseSize;
  out.twinkle = twinkleVal;
  out.isBackground = isBackground;
  return out;
}

@fragment
fn fs_particle(in: VertexOutput) -> @location(0) vec4<f32> {
  let uv = in.localUV;
  let dist = length(uv);
  if (dist > 1.0) {
    discard;
  }

  // [광학 색수차 (Chromatic Aberration)]
  // 유리에 빛이 비추어질 때 파장에 따른 굴절각 차이로 발생하는 색수차:
  // - 적색(R) 파장: 위쪽(-y)으로 미세하게 편향 (위에는 빨간색)
  // - 녹색(G) 파장: 중심 기준
  // - 청색(B) 파장: 아래쪽(+y)으로 미세하게 편향 (아래는 파란색)
  let caDist = 0.085;
  let uvR = uv - vec2<f32>(0.0, -caDist);
  let uvG = uv;
  let uvB = uv - vec2<f32>(0.0, caDist);

  let distR = length(uvR);
  let distG = length(uvG);
  let distB = length(uvB);

  // 각 파장 채널별 코어 & 글로우
  let coreR = smoothstep(0.36, 0.0, distR) * 1.4;
  let coreG = smoothstep(0.36, 0.0, distG) * 1.4;
  let coreB = smoothstep(0.36, 0.0, distB) * 1.4;

  let glowR = exp(-distR * 4.0) * 0.95;
  let glowG = exp(-distG * 4.0) * 0.95;
  let glowB = exp(-distB * 4.0) * 0.95;

  // 항성 고유 천체 색상(R, G, B)에 색수차 채널별 분산 결합
  var finalRGB = vec3<f32>(
    (coreR + glowR) * in.color.r,
    (coreG + glowG) * in.color.g,
    (coreB + glowB) * in.color.b
  );

  // 유리에 굴절된 빛의 프리즘 색수차 가장자리 틴트 (상단 레드, 하단 블루)
  let caRedFringe = vec3<f32>(1.0, 0.22, 0.32) * glowR * max(0.0, -uv.y) * 0.75;
  let caBlueFringe = vec3<f32>(0.22, 0.62, 1.0) * glowB * max(0.0, uv.y) * 0.75;
  finalRGB += caRedFringe + caBlueFringe;

  // 중심 순백 다이아몬드 코어 (모든 별의 중심은 눈부신 백색 항성광)
  let whiteCore = vec3<f32>(1.0, 1.0, 1.0) * smoothstep(0.24, 0.0, dist) * 1.5;
  finalRGB += whiteCore;

  // 십자 회절 플레어 (색수차 적용: 상단 루비 레드, 하단 사파이어 블루)
  var flareRGB = vec3<f32>(0.0);
  if (in.isBackground < 0.5 && in.size > 3.3) {
    let flareX = exp(-abs(uv.x) * 16.0) * exp(-abs(uv.y) * 2.8);
    let flareY = exp(-abs(uv.y) * 16.0) * exp(-abs(uv.x) * 2.8);

    // 수평 플레어: 별의 기본 색상
    let spikeH = flareX * (in.color.rgb * 0.65 + vec3<f32>(0.35));

    // 수직 플레어: 색수차 분산광 (상단 루비 레드, 하단 사파이어 블루)
    var spikeVColor = vec3<f32>(1.0, 1.0, 1.0);
    if (uv.y < 0.0) {
      spikeVColor = mix(
        vec3<f32>(1.0, 1.0, 1.0),
        vec3<f32>(1.0, 0.35, 0.45),
        clamp(-uv.y * 1.4, 0.0, 1.0)
      );
    } else {
      spikeVColor = mix(
        vec3<f32>(1.0, 1.0, 1.0),
        vec3<f32>(0.35, 0.68, 1.0),
        clamp(uv.y * 1.4, 0.0, 1.0)
      );
    }
    let spikeV = flareY * spikeVColor;

    flareRGB = (spikeH + spikeV) * 0.45 * in.twinkle;
  }

  let resultRGB = finalRGB * in.twinkle + flareRGB;
  let maxBright = max(resultRGB.r, max(resultRGB.g, resultRGB.b));
  let finalAlpha = clamp(maxBright * in.color.a, 0.0, 1.0);

  return vec4<f32>(resultRGB, finalAlpha);
}
`;
