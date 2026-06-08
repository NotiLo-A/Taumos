import type { Ref } from "vue";

export interface FormulaPanel {
  id: number;
  text: string;
  color: string;
  hidden?: boolean;
  isGraphable?: boolean;
}

export interface GridSettings {
  showGrid: boolean;
  showAxes: boolean;
  showNumbers: boolean;
  showMinorGrid: boolean;
  showOriginPoint: boolean;
  snapToGrid: boolean;
  polarMode: boolean;
}

export interface SavedFormula {
  name: string;
  formulas: FormulaPanel[];
  preview?: string;
}

export interface HistoryState {
  panels: FormulaPanel[];
  nextId: number;
}


export type NotificationType = "success" | "error";


export interface Position {
  top: string;
  left: string;
}

export interface AnimationState {
  targetScale: number;
  targetOffsetX: number;
  targetOffsetY: number;
  desmosScale: number;
  desmosOffsetX: number;
  desmosOffsetY: number;
  animationFrameId: number | null;
}

export interface GridState {
  scale: Ref<number>;
  offsetX: Ref<number>;
  offsetY: Ref<number>;
  currentGridStep: number;
  targetGridStep: number;
  gridTransition: number;
}

export const COLOR_PALETTE = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#2c3e50",
  "#f1c40f",
  "#e67e22",
  "#c0392b",
  "#d35400",
  "#7f8c8d",
  "#95a5a6",
  "#bdc3c7",
  "#ecf0f1",
  "#1abc9c",
  "#16a085",
  "#2ecc71",
  "#27ae60",
  "#3498db",
  "#2980b9",
  "#9b59b6",
  "#8e44ad",
  "#34495e",
  "#2c3e50",
  "#f39c12",
  "#f1c40f",
  "#e67e22",
  "#d35400",
  "#e74c3c",
  "#c0392b",
] as const;

export const GRID_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] as const;

export const STORAGE_KEYS = {
  SAVED_FORMULAS: "taumos-saved-formulas",
  LAST_FORMULAS: "taumos-last-formulas",
  GRID_SETTINGS: "taumos-grid-settings",
} as const;

export const ANIMATION_CONFIG = {
  GRID_LERP_FACTOR: 0.15,
  DESMOS_LERP_FACTOR: 0.18,
  GRID_TRANSITION_STEP: 0.1,
  ANIMATION_THRESHOLD: 0.01,
} as const;

export const HISTORY_CONFIG = {
  MAX_HISTORY: 50,
  DEBOUNCE_MS: 1000,
} as const;

export const SCALE_CONFIG = {
  MIN_SCALE: 10,
  MAX_SCALE: 200,
  ZOOM_IN_FACTOR: 1.05,
  ZOOM_OUT_FACTOR: 0.95,
  DEFAULT_SCALE: 40,
} as const;

export const PANEL_CONFIG = {
  MIN_WIDTH: 200,
  MAX_WIDTH: 600,
  DEFAULT_WIDTH: 300,
} as const;
