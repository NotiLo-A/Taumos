import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface UseCanvasReturn {
  canvas: Ref<HTMLCanvasElement | null>;
  ctx: Ref<CanvasRenderingContext2D | null>;
  initialize: () => void;
  resize: () => void;
  clear: () => void;
}

export function useCanvas(): UseCanvasReturn {
  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);


  const initialize = () => {
    if (!canvas.value) {
      console.warn("Canvas element not found");
      return;
    }

    const context = canvas.value.getContext("2d", { alpha: true });
    if (!context) {
      console.error("Failed to get 2D context");
      return;
    }

    ctx.value = context;

    resize();
  };


  const resize = () => {
    if (!canvas.value) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.value.width = width * dpr;
    canvas.value.height = height * dpr;

    canvas.value.style.width = `${width}px`;
    canvas.value.style.height = `${height}px`;

    if (ctx.value) {
      ctx.value.scale(dpr, dpr);
    }
  };


  const clear = () => {
    if (!canvas.value || !ctx.value) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.value.clearRect(0, 0, width, height);
  };

  onMounted(() => {
    window.addEventListener("resize", resize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", resize);
  });

  return {
    canvas,
    ctx,
    initialize,
    resize,
    clear,
  };
}
