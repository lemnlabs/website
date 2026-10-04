import { GALAXY_STAR_PALETTE, LOGO_TEXT } from './config';
import type { Particle, StarColor, Viewport } from './types';

function sampleGalaxyStarColor(isBackground = false): StarColor {
  const base =
    GALAXY_STAR_PALETTE[Math.floor(Math.random() * GALAXY_STAR_PALETTE.length)];
  if (isBackground) {
    return [base[0], base[1], base[2], Math.random() * 0.35 + 0.42];
  }
  return [base[0], base[1], base[2], base[3]];
}

export function sampleAllStars({ width, height }: Viewport): Particle[] {
  if (width <= 0 || height <= 0) return [];
  const offscreen = document.createElement('canvas');
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) throw new Error('별 샘플링용 Canvas 2D를 사용할 수 없습니다.');
  offscreen.width = width;
  offscreen.height = height;

  // 화면 너비와 높이에 맞춘 반응형 폰트 크기 계산
  // 모바일(세로 화면)에서도 8글자가 잘리지 않고 좌우 여백을 편안하게 확보하도록 보장
  let fontSize = Math.min(width * 0.145, height * 0.22);
  if (fontSize < 38) fontSize = 38;
  if (fontSize > 260) fontSize = 260; // 초대형 모니터에서도 과도하게 비대해지지 않도록 정돈

  offCtx.font = `200 ${fontSize}px "JetBrains Mono", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillStyle = '#ffffff';
  offCtx.fillText(LOGO_TEXT, width / 2, height / 2);

  // 글자 획을 도톰하고 뚜렷하게 보강하기 위한 외곽선 렌더링
  offCtx.lineWidth = Math.max(2.4, fontSize * 0.024);
  offCtx.strokeStyle = '#ffffff';
  offCtx.strokeText(LOGO_TEXT, width / 2, height / 2);

  const imgData = offCtx.getImageData(0, 0, width, height).data;
  const particles: Particle[] = [];

  // - 모바일: gap=3.4~4.2px (적정 수량으로 여백과 가독성 확보)
  // - 데스크톱: gap=6.5~8.8px (별과 별 사이의 은은한 우주 공간감 확보)
  const gap = Math.max(3.4, Math.min(8.8, fontSize * 0.0382));
  const starScale = Math.max(0.72, Math.min(1.28, Math.sqrt(fontSize / 150)));

  // 1. Logo Stars ('lemnlabs') - 유기적 비격자 성단 샘플링 (Organic Celestial Sampling)
  let rowIndex = 0;
  for (let y = 0; y < height; y += gap) {
    rowIndex++;
    // 홀수/짝수 행 엇갈림 오프셋 (수직 격자 정렬 해제)
    const staggerX = rowIndex % 2 === 1 ? gap * 0.5 : 0.0;

    for (let x = -gap; x < width + gap; x += gap) {
      // 셀 내에서 불규칙하게 흩뿌려지는 유기적 지터 (수평/수직 격자감 완전 해소)
      const jitterX = (Math.random() - 0.5) * (gap * 0.88);
      const jitterY = (Math.random() - 0.5) * (gap * 0.88);
      const posX = x + staggerX + jitterX;
      const posY = y + jitterY;

      const ix = Math.floor(Math.max(0, Math.min(width - 1, posX)));
      const iy = Math.floor(Math.max(0, Math.min(height - 1, posY)));
      const idx = (iy * width + ix) * 4;

      // 글자 획 내부인지 확인 (외곽선 포함)
      if (imgData[idx + 3] > 65) {
        const rand = Math.random();
        let baseSize: number;
        if (rand > 0.88)
          baseSize = 4.3; // 눈부신 주요 항성 (십자 플레어와 색수차)
        else if (rand > 0.65)
          baseSize = 3.7; // 밝은 항성
        else if (rand > 0.35)
          baseSize = 3.1; // 중간 항성
        else baseSize = 2.6; // 미세 은하 성진

        const size = baseSize * starScale;

        // 항성 팔레트에서 색상을 선택합니다.
        const color = sampleGalaxyStarColor(false);

        // 글자 별의 12%만 유영하도록 하여 글자의 가독성을 88%의 뼈대가 또렷하게 유지
        const isFreeStar = Math.random() < 0.12;
        const wanderFactor = isFreeStar ? Math.random() * 0.35 + 0.65 : 0.0;

        particles.push({
          x: posX,
          y: posY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          originX: posX,
          originY: posY,
          size: size,
          color: color,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.02 + Math.random() * 0.035,
          idleSeed: Math.random() * 10.0,
          isBackground: 0.0, // 0 = Logo star
          wanderFactor: wanderFactor,
        });

        // 약 10%의 확률로 자연스러운 쌍성/성단 미세 성진(Companion dust star) 추가
        if (rand < 0.1) {
          const compAngle = Math.random() * Math.PI * 2;
          const compDist = 2.2 + Math.random() * 3.0;
          const compX = posX + Math.cos(compAngle) * compDist;
          const compY = posY + Math.sin(compAngle) * compDist;
          const cix = Math.floor(Math.max(0, Math.min(width - 1, compX)));
          const ciy = Math.floor(Math.max(0, Math.min(height - 1, compY)));
          if (imgData[(ciy * width + cix) * 4 + 3] > 60) {
            particles.push({
              x: compX,
              y: compY,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              originX: compX,
              originY: compY,
              size: (2.0 + Math.random() * 0.8) * starScale,
              color: sampleGalaxyStarColor(false),
              twinklePhase: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.025 + Math.random() * 0.03,
              idleSeed: Math.random() * 10.0,
              isBackground: 0.0,
              wanderFactor: 0.0,
            });
          }
        }
      }
    }
  }

  // 2. 배경에 흩뿌려진 별들 (화면 면적 비례 적정 수량 산출)
  const fieldStarCount = Math.floor(Math.sqrt(width * height) * 0.09) + 35;
  for (let i = 0; i < fieldStarCount; i++) {
    const posX = Math.random() * width;
    const posY = Math.random() * height;

    // 배경 별 크기: 모바일과 데스크톱에 맞춰 우아하게 스케일
    const size = (Math.random() * 1.2 + 1.2) * Math.max(0.75, starScale * 0.9);
    const color = sampleGalaxyStarColor(true);

    particles.push({
      x: posX,
      y: posY,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      originX: posX,
      originY: posY,
      size: size,
      color: color,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.03,
      idleSeed: Math.random() * 10.0,
      isBackground: 1.0, // 1 = Background scattered star
      wanderFactor: 0.0,
    });
  }

  return particles;
}
