import type { StarColor } from './types';

export const LOGO_TEXT = 'lemnlabs';
export const MAX_DPR = 2;
export const WORKGROUP_SIZE = 64;
export const EFFECT_STRENGTH = 0.45;
export const EFFECT_DECAY = 0.92;
export const FONT_STYLESHEET_TIMEOUT = 3000;
export const FONT_LOAD_TIMEOUT = 3500;

export const GALAXY_STAR_PALETTE: readonly StarColor[] = [
  // 1. 따뜻한 앰버 / 코랄 항성 (호박색 별빛)
  [1.0, 0.64, 0.34, 1.0], // Luminous Warm Amber
  [1.0, 0.5, 0.28, 1.0], // Sunset Coral
  [1.0, 0.76, 0.5, 1.0], // Golden Peach
  [1.0, 0.88, 0.68, 1.0], // Warm Golden Starlight

  // 2. 차가운 시안 / 아이스 블루 항성 (푸른 별빛)
  [0.4, 0.82, 1.0, 1.0], // Vivid Icy Cyan
  [0.52, 0.76, 1.0, 1.0], // Deep Sky Blue
  [0.66, 0.86, 1.0, 1.0], // Electric Azure
  [0.82, 0.92, 1.0, 1.0], // Sirius Blue-White

  // 3. 백색 및 샴페인 다이아몬드 항성
  [1.0, 1.0, 1.0, 1.0], // Pure Diamond White
  [1.0, 1.0, 1.0, 1.0], // Pure Diamond White
  [1.0, 0.96, 0.88, 1.0], // Soft Champagne
  [0.92, 0.96, 1.0, 1.0], // Ice Diamond
];
