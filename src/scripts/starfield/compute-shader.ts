import { WORKGROUP_SIZE } from './config';

export const computeWGSL = `
struct Particle {
  pos_vel: vec4<f32>,       // xy = pos, zw = vel
  origin_props: vec4<f32>,  // xy = origin, z = baseSize, w = twinklePhase
  color: vec4<f32>,         // rgba
  extra: vec4<f32>,         // x = twinkleSpeed, y = idleSeed, z = isBackground, w = wanderFactor
};

struct SimUniforms {
  u0: vec4<f32>, // x = width, y = height, z = mouseX, w = mouseY
  u1: vec4<f32>, // x = time, y = dt, z = isPressed, w = releaseBurst
  u2: vec4<u32>, // x = particleCount, yzw = pad
  u3: vec4<f32>, // x = releaseX, y = releaseY, z = pulse, w = pad
};

@group(0) @binding(0) var<uniform> uniforms: SimUniforms;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= uniforms.u2.x) {
    return;
  }

  var p = particles[index];

  var pos = p.pos_vel.xy;
  var vel = p.pos_vel.zw;
  let origin = p.origin_props.xy;
  let baseSize = p.origin_props.z;
  var twinklePhase = p.origin_props.w;
  let twinkleSpeed = p.extra.x;
  let idleSeed = p.extra.y;
  let isBackground = p.extra.z;
  let wanderFactor = p.extra.w;

  // Idle calm wobble
  let idleTime = uniforms.u1.x * (0.45 + idleSeed * 0.15) + twinklePhase;
  var idleOffset = vec2<f32>(
    sin(idleTime) * 1.1,
    cos(idleTime * 1.25) * 1.1
  );

  // 글자의 별 일부(약 12%, wanderFactor > 0.05)는 넓고 유려한 궤도로 유영
  if (isBackground < 0.5 && wanderFactor > 0.05) {
    let wanderRadius = 14.0 + wanderFactor * 20.0;
    let wanderSpeed = 0.5 + idleSeed * 0.22;
    let tWander = uniforms.u1.x * wanderSpeed + idleSeed * 2.5;
    let wanderX = sin(tWander) * wanderRadius + cos(tWander * 0.6) * (wanderRadius * 0.4);
    let wanderY = cos(tWander * 0.8) * wanderRadius + sin(tWander * 1.3) * (wanderRadius * 0.35);
    idleOffset = vec2<f32>(wanderX, wanderY);
  }
  let targetPos = origin + idleOffset;

  let mousePos = uniforms.u0.zw;
  let isPressed = uniforms.u1.z;
  let releaseBurst = uniforms.u1.w;
  let releasePos = uniforms.u3.xy;

  // 1. 배경에 흩뿌려진 별 (isBackground > 0.5)
  if (isBackground > 0.5) {
    // 배경 별은 제자리에서 잔잔하게 유영하며, 마우스에 아주 미세하게만 호버 반응
    let diff = mousePos - pos;
    let dist = length(diff);
    if (isPressed > 0.5 && dist < 300.0 && dist > 1.0) {
      vel += (diff / dist) * (1.0 - dist / 300.0) * 0.4;
    }
    let toOrigin = targetPos - pos;
    vel += toOrigin * 0.04;
    vel *= 0.92;
    pos += vel;
  } else {
    // 2. 글자 별 (Logo Stars)
    if (isPressed > 0.5) {
      let toMouse = mousePos - pos;
      let dist = length(toMouse);
      let gravityRadius = 420.0;

      if (dist > 1.0 && dist < gravityRadius) {
        let norm = toMouse / dist;
        let force = (1.0 - dist / gravityRadius) * 20.0;
        let tangent = vec2<f32>(-norm.y, norm.x) * 0.48;

        if (dist < 26.0) {
          vel += tangent * 7.5 - norm * 2.2;
        } else {
          vel += (norm * 1.25 + tangent * 0.5) * force;
        }
      } else if (dist >= gravityRadius) {
        let norm = toMouse / dist;
        vel += norm * 1.0;
      }
      vel *= 0.88;
      pos += vel;
    } else {
      // 평상시 마우스가 근처를 지나갈 때 자유로운 별은 부드럽게 마우스 바람을 탐
      if (wanderFactor > 0.1) {
        let diffM = mousePos - pos;
        let distM = length(diffM);
        if (distM < 160.0 && distM > 1.0) {
          let normM = diffM / distM;
          let repel = (1.0 - distM / 160.0) * wanderFactor * 1.4;
          vel -= normM * repel;
        }
      }

      if (releaseBurst > 0.01) {
        let fromRelease = pos - releasePos;
        let rDist = max(length(fromRelease), 1.0);
        let norm = fromRelease / rDist;

        // 은은하고 차분한 소프트 릴리즈
        let coreBoost = clamp(60.0 / (rDist + 30.0), 1.0, 1.4);
        let burstForce = releaseBurst * 18.0 * coreBoost;
        let angle = p.origin_props.w * 6.28 + p.extra.y;
        let turbulence = vec2<f32>(cos(angle), sin(angle)) * 4.0 * releaseBurst;

        vel += (norm * burstForce) + turbulence;
      }

      vel *= 0.88;

      // 탄성 없이 제자리로 직행 (차분하고 정돈된 안착)
      let toTarget = targetPos - pos;
      let returnSuppress = clamp(1.0 - releaseBurst * 0.25, 0.65, 1.0);
      let easeRate = 0.026 * returnSuppress;

      pos += vel + toTarget * easeRate;
    }
  }

  // Pulse (Supernova)
  let pulse = uniforms.u3.z;
  if (pulse > 0.01) {
    let center = uniforms.u0.xy * 0.5;
    let fromCenter = pos - center;
    let cDist = max(length(fromCenter), 1.0);
    vel += (fromCenter / cDist) * pulse * 26.0;
  }

  twinklePhase += twinkleSpeed;

  p.pos_vel = vec4<f32>(pos, vel);
  p.origin_props.w = twinklePhase;
  particles[index] = p;
}
`;
