<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import MathInput from "./components/MathInput.vue";

declare global {
  interface Window {
    Desmos: any;
  }
}

const calculatorContainer = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
let calculator: any = null;
let ctx: CanvasRenderingContext2D | null = null;

const getColor = (varName: string) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

let scale = ref(40);
let offsetX = ref(150);
let offsetY = ref(0);

let targetScale = 40;
let targetOffsetX = 150;
let targetOffsetY = 0;

let desmosScale = 40;
let desmosOffsetX = 150;
let desmosOffsetY = 0;

let currentGridStep = 1;
let targetGridStep = 1;
let gridTransition = 0;

let isDragging = false;
let lastX = 0;
let lastY = 0;
let animationFrameId: number | null = null;

let isResizing = false;
let panelWidth = ref(300);
let inputPanels = ref<
  Array<{
    id: number;
    text: string;
    color: string;
    hidden?: boolean;
    isGraphable?: boolean;
  }>
>([]);
let nextPanelId = 0;
const expressionVisibility = ref<Record<number, boolean>>({});
const expressionIsGraphable = ref<Record<number, boolean>>({});

const isCtrlPressed = ref(false);

const history = ref<
  Array<{
    panels: Array<{
      id: number;
      text: string;
      color: string;
      hidden?: boolean;
    }>;
    nextId: number;
  }>
>([]);
const historyIndex = ref(-1);
const MAX_HISTORY = 50;
let historyTimeout: number | null = null;

const isSettingsOpen = ref(false);
const isKeyboardOpen = ref(false);
const focusedPanelId = ref<number | null>(null);
const keyboardButtonTop = ref("0px");
const gridSettings = ref({
  showGrid: true,
  showAxes: true,
  showNumbers: true,
  showMinorGrid: false,
  showOriginPoint: true,
  snapToGrid: false,
  polarMode: false,
});

const isSaveMode = ref(false);
const saveName = ref("");
const isMenuOpen = ref(false);
const savedFormulas = ref<
  Array<{
    name: string;
    formulas: Array<{
      id: number;
      text: string;
      color: string;
      hidden?: boolean;
      isGraphable?: boolean;
    }>;
    preview?: string;
  }>
>([]);
const saveInputRef = ref<HTMLInputElement | null>(null);
const saveButtonRef = ref<HTMLButtonElement | null>(null);
const saveModalStyle = ref({ top: "50px", left: "220px" });
const showSuccessNotification = ref(false);
const notificationType = ref<"success" | "error">("success");
const notificationMessage = ref("");
const showDeleteConfirm = ref(false);
const deleteButtonRef = ref<HTMLButtonElement | null>(null);
const deleteConfirmStyle = ref({ top: "0px", left: "0px" });

const colorPickerPanelId = ref<number | null>(null);
const colorPickerStyle = ref({ top: "0px", left: "0px" });

const loadSavedFormulas = () => {
  const saved = localStorage.getItem("taumos-saved-formulas");
  if (saved) {
    try {
      savedFormulas.value = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load saved formulas:", e);
    }
  }
};

const loadGridSettings = () => {
  const saved = localStorage.getItem("taumos-grid-settings");
  if (saved) {
    try {
      gridSettings.value = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load grid settings:", e);
    }
  }
};

const saveGridSettings = () => {
  localStorage.setItem(
    "taumos-grid-settings",
    JSON.stringify(gridSettings.value),
  );
};

const loadLastFormulas = () => {
  const saved = localStorage.getItem("taumos-last-formulas");
  if (saved) {
    try {
      const formulas = JSON.parse(saved);
      inputPanels.value = formulas.map((p: any) => ({
        ...p,
        hidden: p.hidden || false,
        isGraphable: p.isGraphable || false,
      }));
      formulas.forEach((p: any) => {
        if (p.isGraphable) {
          expressionIsGraphable.value[p.id] = true;
        }
      });
      nextPanelId = Math.max(...formulas.map((p: any) => p.id), 0) + 1;
    } catch (e) {
      console.error("Failed to load last formulas:", e);
    }
  }
};

const saveLastFormulas = () => {
  localStorage.setItem(
    "taumos-last-formulas",
    JSON.stringify(inputPanels.value),
  );
};

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value;
};

const handleDocumentClick = () => {
  if (isSettingsOpen.value) {
    isSettingsOpen.value = false;
  }
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false;
  }
  if (colorPickerPanelId.value !== null) {
    colorPickerPanelId.value = null;
  }
};

const toggleKeyboard = () => {
  if (focusedPanelId.value !== null) {
    const focusedPanel = document.querySelector(
      `[data-panel-id="${focusedPanelId.value}"] math-field`,
    ) as any;
    if (focusedPanel) {
      const currentState = focusedPanel.virtualKeyboardState;

      if (currentState === "visible") {
        focusedPanel.executeCommand("hideVirtualKeyboard");
        isKeyboardOpen.value = false;
      } else {
        focusedPanel.executeCommand("showVirtualKeyboard");
        isKeyboardOpen.value = true;
      }
    }
  }
};

const handleMathFieldFocus = (panelId: number) => {
  focusedPanelId.value = panelId;
  updateKeyboardButtonPosition();
};

const handleMathFieldBlur = () => {
  setTimeout(() => {
    const activeElement = document.activeElement;
    if (activeElement?.tagName.toLowerCase() !== "math-field") {
      focusedPanelId.value = null;
    }
  }, 50);
};

const handleKeyboardToggle = (isOpen: boolean) => {
  isKeyboardOpen.value = isOpen;
};

const updateKeyboardButtonPosition = () => {
  if (focusedPanelId.value === null) {
    keyboardButtonTop.value = "0px";
    return;
  }

  const panelElement = document.querySelector(
    `[data-panel-id="${focusedPanelId.value}"]`,
  );
  if (!panelElement) {
    keyboardButtonTop.value = "0px";
    return;
  }

  const rect = panelElement.getBoundingClientRect();
  keyboardButtonTop.value = `${rect.top + rect.height / 2}px`;
};

const toggleSaveMode = () => {
  isSaveMode.value = !isSaveMode.value;
  if (isSaveMode.value) {
    saveName.value = "";
    if (saveButtonRef.value) {
      const rect = saveButtonRef.value.getBoundingClientRect();
      saveModalStyle.value = {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
      };
    }
    setTimeout(() => {
      saveInputRef.value?.focus();
    }, 100);
  }
};

const saveFormulas = async () => {
  if (!saveName.value.trim()) return;

  const nonEmptyFormulas = inputPanels.value
    .filter((panel) => panel.text.trim())
    .map((panel) => ({
      id: panel.id,
      text: panel.text,
      color: panel.color,
      hidden: panel.hidden || false,
      isGraphable: expressionIsGraphable.value[panel.id] || false,
    }));

  const nameToSave = saveName.value.trim();
  isSaveMode.value = false;
  saveName.value = "";

  if (nonEmptyFormulas.length === 0) {
    notificationType.value = "error";
    notificationMessage.value = "Error";
    showSuccessNotification.value = true;
    setTimeout(() => {
      showSuccessNotification.value = false;
    }, 2000);
    return;
  }

  let previewData = "";

  if (window.Desmos) {
    try {
      console.log("Starting preview creation...");
      const tempDiv = document.createElement("div");
      tempDiv.style.width = "200px";
      tempDiv.style.height = "200px";
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      const tempCalc = window.Desmos.GraphingCalculator(tempDiv, {
        keypad: false,
        expressions: false,
        settingsMenu: false,
        zoomButtons: false,
        expressionsTopbar: false,
        border: false,
        branding: false,
        invertedColors: true,
        showGrid: false,
        showXAxis: false,
        showYAxis: false,
      });

      console.log("Temp calculator created with invertedColors: true");

      nonEmptyFormulas.forEach((formula, index) => {
        console.log("Adding formula:", formula.text);
        tempCalc.setExpression({
          id: `preview_${index}`,
          latex: formula.text,
          color: formula.color,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        if (typeof tempCalc.setDefaultState === "function") {
          tempCalc.setDefaultState();
        }
      } catch (e) {
        console.log("Auto-zoom not available, using default bounds");
      }

      tempCalc.setMathBounds({
        left: -5,
        right: 5,
        bottom: -5,
        top: 5,
      });

      console.log("Waiting for render...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("Creating screenshot...");
      previewData = await new Promise((resolve) => {
        tempCalc.asyncScreenshot((dataUrl: string) => {
          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);

              const imageData = ctx.getImageData(0, 0, 200, 200);
              const data = imageData.data;

              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (r > 240 && g > 240 && b > 240) {
                  data[i] = 0x26;
                  data[i + 1] = 0x26;
                  data[i + 2] = 0x25;
                }
              }

              ctx.putImageData(imageData, 0, 0);
              const finalDataUrl = canvas.toDataURL("image/png");
              resolve(finalDataUrl);
            };
            img.src = dataUrl;
          } else {
            resolve(dataUrl);
          }
        });
      });

      console.log("Screenshot created, length:", previewData.length);

      tempCalc.destroy();
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Failed to create preview:", error);
    }
  } else {
    console.log("Desmos not available");
  }

  const newSave = {
    name: nameToSave,
    formulas: nonEmptyFormulas,
    preview: previewData,
  };

  savedFormulas.value.push(newSave);
  localStorage.setItem(
    "taumos-saved-formulas",
    JSON.stringify(savedFormulas.value),
  );

  notificationType.value = "success";
  notificationMessage.value = "Success";
  showSuccessNotification.value = true;
  setTimeout(() => {
    showSuccessNotification.value = false;
  }, 2000);
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const loadFormulas = (save: {
  name: string;
  formulas: Array<{
    id: number;
    text: string;
    color: string;
    hidden?: boolean;
    isGraphable?: boolean;
  }>;
}) => {
  if (calculator) {
    inputPanels.value.forEach((panel) => {
      calculator.removeExpression({ id: `expr_${panel.id}` });
    });
  }
  inputPanels.value = save.formulas.map((f) => ({
    ...f,
    hidden: f.hidden || false,
    isGraphable: f.isGraphable || false,
  }));
  save.formulas.forEach((f) => {
    if (f.isGraphable) {
      expressionIsGraphable.value[f.id] = true;
    }
  });
  nextPanelId = Math.max(...inputPanels.value.map((p) => p.id), 0) + 1;
  isMenuOpen.value = false;
};

const deleteSave = (index: number) => {
  savedFormulas.value.splice(index, 1);
  localStorage.setItem(
    "taumos-saved-formulas",
    JSON.stringify(savedFormulas.value),
  );
};

const deleteAllSaves = () => {
  if (savedFormulas.value.length === 0) return;

  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false;
    return;
  }

  if (deleteButtonRef.value) {
    const rect = deleteButtonRef.value.getBoundingClientRect();
    deleteConfirmStyle.value = {
      top: `${rect.top + rect.height / 2}px`,
      left: `${rect.right + 30}px`,
    };
  }
  showDeleteConfirm.value = true;
};

const confirmDeleteAll = () => {
  savedFormulas.value = [];
  localStorage.setItem(
    "taumos-saved-formulas",
    JSON.stringify(savedFormulas.value),
  );
  showDeleteConfirm.value = false;
};

const getGridStep = (scale: number) => {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const targetPixels = 80;
  const unitsPerPixel = 1 / scale;
  const targetUnits = targetPixels * unitsPerPixel;

  for (let step of steps) {
    if (step >= targetUnits) return step;
  }
  return steps[steps.length - 1];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const animate = () => {
  const gridLerpFactor = 0.15;
  const desmosLerpFactor = 0.18;

  scale.value = lerp(scale.value, targetScale, gridLerpFactor);
  offsetX.value = lerp(offsetX.value, targetOffsetX, gridLerpFactor);
  offsetY.value = lerp(offsetY.value, targetOffsetY, gridLerpFactor);

  desmosScale = lerp(desmosScale, targetScale, desmosLerpFactor);
  desmosOffsetX = lerp(desmosOffsetX, targetOffsetX, desmosLerpFactor);
  desmosOffsetY = lerp(desmosOffsetY, targetOffsetY, desmosLerpFactor);

  const newTargetGridStep = getGridStep(scale.value);
  if (newTargetGridStep !== targetGridStep) {
    currentGridStep = targetGridStep;
    targetGridStep = newTargetGridStep;
    gridTransition = 0;
  }

  if (gridTransition < 1) {
    gridTransition = Math.min(1, gridTransition + 0.1);
  }

  drawCanvas();

  const isAnimating =
    Math.abs(scale.value - targetScale) > 0.01 ||
    Math.abs(offsetX.value - targetOffsetX) > 0.01 ||
    Math.abs(offsetY.value - targetOffsetY) > 0.01 ||
    Math.abs(desmosScale - targetScale) > 0.01 ||
    Math.abs(desmosOffsetX - targetOffsetX) > 0.01 ||
    Math.abs(desmosOffsetY - targetOffsetY) > 0.01 ||
    gridTransition < 1;

  if (isAnimating) {
    syncDesmosWithCanvas();
    animationFrameId = requestAnimationFrame(animate);
  } else {
    syncDesmosWithCanvas();
    animationFrameId = null;
  }
};

const startAnimation = () => {
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(animate);
  }
};

const drawGrid = (gridStep: number, opacity: number) => {
  if (!canvas.value || !ctx || !gridSettings.value.showGrid) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const centerX = width / 2 + offsetX.value;
  const centerY = height / 2 + offsetY.value;

  if (gridSettings.value.polarMode) {
    drawPolarGrid(gridStep, opacity, centerX, centerY);
    return;
  }

  const pixelStep = gridStep * scale.value;
  if (gridSettings.value.showMinorGrid) {
    const minorPixelStep = pixelStep / 2;
    const gridColor = getColor("--grid-line");
    ctx.strokeStyle = gridColor.replace("1)", `${opacity * 0.15})`);
    ctx.lineWidth = 0.5;

    const startX =
      Math.floor(-centerX / minorPixelStep) * minorPixelStep + centerX;
    for (let x = startX; x < width; x += minorPixelStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const startY =
      Math.floor(-centerY / minorPixelStep) * minorPixelStep + centerY;
    for (let y = startY; y < height; y += minorPixelStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  const gridColor = getColor("--grid-line");
  ctx.strokeStyle = gridColor.replace("1)", `${opacity * 0.4})`);
  ctx.lineWidth = 1;

  const startX = Math.floor(-centerX / pixelStep) * pixelStep + centerX;
  for (let x = startX; x < width; x += pixelStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const startY = Math.floor(-centerY / pixelStep) * pixelStep + centerY;
  for (let y = startY; y < height; y += pixelStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (!gridSettings.value.showNumbers) return;

  const textColor = getColor("--grid-text");
  ctx.fillStyle = textColor.replace("1)", `${opacity})`);
  ctx.font = '12px "Anthropic Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let x = startX; x < width; x += pixelStep) {
    const coordX =
      Math.round((x - centerX) / scale.value / gridStep) * gridStep;
    if (coordX !== 0) {
      ctx.fillText(coordX.toString(), x, centerY + 5);
    }
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let y = startY; y < height; y += pixelStep) {
    const coordY =
      Math.round((centerY - y) / scale.value / gridStep) * gridStep;
    if (coordY !== 0) {
      ctx.fillText(coordY.toString(), centerX - 5, y);
    }
  }
};

const drawPolarGrid = (
  gridStep: number,
  opacity: number,
  centerX: number,
  centerY: number,
) => {
  if (!ctx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelStep = gridStep * scale.value;

  const maxRadius = Math.sqrt(
    Math.max(
      centerX * centerX + centerY * centerY,
      (width - centerX) * (width - centerX) + centerY * centerY,
      centerX * centerX + (height - centerY) * (height - centerY),
      (width - centerX) * (width - centerX) +
        (height - centerY) * (height - centerY),
    ),
  );

  const gridColor = getColor("--grid-line");
  ctx.strokeStyle = gridColor.replace("1)", `${opacity * 0.4})`);
  ctx.lineWidth = 1;

  for (let r = pixelStep; r <= maxRadius; r += pixelStep) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();

    if (gridSettings.value.showNumbers && r > 0) {
      const coordR = Math.round(r / scale.value / gridStep) * gridStep;
      const textColor = getColor("--grid-text");
      ctx.fillStyle = textColor.replace("1)", `${opacity})`);
      ctx.font = '12px "Anthropic Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(coordR.toString(), centerX, centerY - r - 3);
    }
  }

  const angleStep = Math.PI / 6;
  ctx.strokeStyle = gridColor.replace("1)", `${opacity * 0.4})`);
  ctx.lineWidth = 1;

  for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * maxRadius,
      centerY + Math.sin(angle) * maxRadius,
    );
    ctx.stroke();

    if (gridSettings.value.showNumbers) {
      const degrees = Math.round((angle * 180) / Math.PI);
      const labelRadius = pixelStep * 1.5;
      const textColor = getColor("--grid-text");
      ctx.fillStyle = textColor.replace("1)", `${opacity})`);
      ctx.font = '12px "Anthropic Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        degrees + "°",
        centerX + Math.cos(angle) * labelRadius,
        centerY + Math.sin(angle) * labelRadius,
      );
    }
  }
  if (gridSettings.value.showMinorGrid) {
    const minorPixelStep = pixelStep / 2;
    ctx.strokeStyle = gridColor.replace("1)", `${opacity * 0.15})`);
    ctx.lineWidth = 0.5;

    for (let r = minorPixelStep; r <= maxRadius; r += minorPixelStep) {
      if (Math.round(r / pixelStep) * pixelStep !== r) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const minorAngleStep = Math.PI / 12;
    for (let angle = minorAngleStep; angle < Math.PI * 2; angle += angleStep) {
      if (Math.abs(Math.round(angle / angleStep) * angleStep - angle) > 0.01) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius,
        );
        ctx.stroke();
      }
      angle += minorAngleStep;
    }
  }
};

const drawCanvas = () => {
  if (!canvas.value || !ctx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2 + offsetX.value;
  const centerY = height / 2 + offsetY.value;

  if (gridTransition < 1 && currentGridStep !== targetGridStep) {
    drawGrid(currentGridStep, 1 - gridTransition);
    drawGrid(targetGridStep, gridTransition);
  } else {
    drawGrid(targetGridStep, 1);
  }

  if (gridSettings.value.showAxes) {
    ctx.strokeStyle = getColor("--axis-line");
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }
  if (gridSettings.value.showOriginPoint) {
    ctx.fillStyle = getColor("--axis-line");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

const syncDesmosWithCanvas = () => {
  if (!calculator) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const centerX = width / 2 + desmosOffsetX;
  const centerY = height / 2 + desmosOffsetY;

  const left = -centerX / desmosScale;
  const right = (width - centerX) / desmosScale;
  const bottom = (centerY - height) / desmosScale;
  const top = centerY / desmosScale;

  calculator.setMathBounds({
    left,
    right,
    bottom,
    top,
  });
};

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();

  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const worldX = (mouseX - width / 2 - targetOffsetX) / targetScale;
  const worldY = (mouseY - height / 2 - targetOffsetY) / targetScale;

  const delta = e.deltaY > 0 ? 0.95 : 1.05;
  const newScale = Math.max(10, Math.min(200, targetScale * delta));

  targetOffsetX = mouseX - width / 2 - worldX * newScale;
  targetOffsetY = mouseY - height / 2 - worldY * newScale;
  targetScale = newScale;

  startAnimation();
};

const handleMouseDown = (e: MouseEvent) => {
  if (isResizing) return;
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
};

const handleMouseMove = (e: MouseEvent) => {
  if (isResizing) {
    panelWidth.value = Math.max(200, Math.min(600, e.clientX - 10));
    return;
  }

  if (!isDragging) return;

  let dx = e.clientX - lastX;
  let dy = e.clientY - lastY;

  if (gridSettings.value.snapToGrid) {
    const snapSize = targetGridStep * targetScale;
    const newOffsetX = targetOffsetX + dx;
    const newOffsetY = targetOffsetY + dy;

    dx = Math.round(newOffsetX / snapSize) * snapSize - targetOffsetX;
    dy = Math.round(newOffsetY / snapSize) * snapSize - targetOffsetY;
  }

  targetOffsetX += dx;
  targetOffsetY += dy;

  lastX = e.clientX;
  lastY = e.clientY;

  startAnimation();
};

const handleMouseUp = () => {
  isDragging = false;
  isResizing = false;
};

const handleResizeStart = (e: MouseEvent) => {
  e.stopPropagation();
  isResizing = true;
};

const resizeCanvas = () => {
  if (!canvas.value) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.value.width = window.innerWidth * dpr;
  canvas.value.height = window.innerHeight * dpr;
  canvas.value.style.width = `${window.innerWidth}px`;
  canvas.value.style.height = `${window.innerHeight}px`;
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  drawCanvas();
  syncDesmosWithCanvas();
};

const getRandomColor = () => {
  const colors = [
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
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const toggleInputPanel = () => {
  saveToHistory();
  inputPanels.value.push({
    id: nextPanelId++,
    text: "",
    color: getRandomColor(),
    hidden: false,
    isGraphable: false,
  });
};

const handlePanelClick = (e: MouseEvent) => {
  if (e.ctrlKey || e.metaKey) return;

  const target = e.target as HTMLElement;
  if (
    target.classList.contains("left-panel") ||
    target.classList.contains("formulas-container")
  ) {
    toggleInputPanel();
  }
};

const handleInputPanelClick = (id: number, e: MouseEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.stopPropagation();
    e.preventDefault();
    removePanel(id);
  }
};

const saveToHistory = () => {
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  history.value.push({
    panels: JSON.parse(JSON.stringify(inputPanels.value)),
    nextId: nextPanelId,
  });

  if (history.value.length > MAX_HISTORY) {
    history.value.shift();
  } else {
    historyIndex.value++;
  }
};

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const state = history.value[historyIndex.value];

    if (calculator) {
      inputPanels.value.forEach((panel) => {
        calculator.removeExpression({ id: `expr_${panel.id}` });
      });
    }

    focusedPanelId.value = null;

    inputPanels.value = JSON.parse(JSON.stringify(state.panels));
    nextPanelId = state.nextId;

    if (calculator) {
      inputPanels.value.forEach((panel) => {
        updateExpression(panel.id, panel.text, panel.color);
      });
    }
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.key === "Control" || e.key === "Meta") {
    isCtrlPressed.value = true;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    toggleSaveMode();
  }

  if (e.key === "Tab") {
    e.preventDefault();
    toggleMenu();
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (!e.ctrlKey && (e.key === "Control" || e.key === "Meta")) {
    isCtrlPressed.value = false;
  }
};

const removePanel = (id: number) => {
  saveToHistory();
  inputPanels.value = inputPanels.value.filter((panel) => panel.id !== id);
  if (calculator) {
    calculator.removeExpression({ id: `expr_${id}` });
  }
  if (focusedPanelId.value === id) {
    focusedPanelId.value = null;
  }
};

const openColorPicker = (panelId: number, event: MouseEvent) => {
  event.stopPropagation();
  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  const pickerWidth = 166;
  const pickerHeight = 166;

  let left = rect.left + rect.width + 10;
  let top = rect.top + rect.height / 2;

  if (left + pickerWidth > window.innerWidth) {
    left = rect.left - pickerWidth - 10;
  }

  if (top + pickerHeight / 2 > window.innerHeight) {
    top = window.innerHeight - pickerHeight / 2 - 10;
  }

  if (top - pickerHeight / 2 < 10) {
    top = pickerHeight / 2 + 10;
  }

  colorPickerPanelId.value = panelId;
  colorPickerStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
};

const changeColor = (panelId: number, hue: number, saturation: number) => {
  const panel = inputPanels.value.find((p) => p.id === panelId);
  if (panel) {
    saveToHistory();
    const lightness = 50;
    panel.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    if (calculator) {
      updateExpression(
        panel.id,
        panel.text,
        panel.color,
        panel.hidden || false,
      );
    }
  }
};

const togglePanelVisibility = (panelId: number) => {
  const panel = inputPanels.value.find((p) => p.id === panelId);
  if (panel) {
    saveToHistory();
    panel.hidden = !panel.hidden;
    if (panel.hidden) {
      panel.isGraphable = expressionIsGraphable.value[panelId] || false;
    }
    if (calculator) {
      updateExpression(panel.id, panel.text, panel.color, panel.hidden);
    }
  }
};

const colorPickerCanvas = ref<HTMLCanvasElement | null>(null);

const handleColorPickerClick = (event: MouseEvent) => {
  if (!colorPickerCanvas.value || colorPickerPanelId.value === null) return;

  const canvas = colorPickerCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const hue = (x / canvas.width) * 360;
  const saturation = 100 - (y / canvas.height) * 100;

  changeColor(colorPickerPanelId.value, hue, saturation);
};

watch(colorPickerPanelId, async (newValue) => {
  if (newValue !== null) {
    await nextTick();
    if (colorPickerCanvas.value) {
      const canvas = colorPickerCanvas.value;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const hue = (x / canvas.width) * 360;
          const saturation = 100 - (y / canvas.height) * 100;
          const lightness = 50;
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
});

const updateExpression = (
  id: number,
  text: string,
  color: string,
  hidden: boolean = false,
) => {
  if (!calculator || !text.trim()) {
    if (calculator && !text.trim()) {
      calculator.removeExpression({ id: `expr_${id}` });
      expressionVisibility.value[id] = false;
      expressionIsGraphable.value[id] = false;
    }
    return;
  }

  const desmosLatex = text;
  console.log("Original LaTeX:", text);
  console.log("Sent to Desmos:", desmosLatex);
  console.log("Formula length:", desmosLatex.length);

  try {
    calculator.setExpression({
      id: `expr_${id}`,
      latex: desmosLatex,
      color: color,
      hidden: hidden,
    });
    console.log("Expression set successfully, hidden:", hidden);
  } catch (error) {
    console.error("Failed to set expression:", error);
    expressionVisibility.value[id] = false;
  }
};

watch(
  inputPanels,
  () => {
    if (focusedPanelId.value !== null) {
      setTimeout(() => {
        updateKeyboardButtonPosition();
      }, 0);
    }
  },
  { deep: true },
);

watch(
  inputPanels,
  (newPanels) => {
    newPanels.forEach((panel) => {
      updateExpression(
        panel.id,
        panel.text,
        panel.color,
        panel.hidden || false,
      );
    });
    saveLastFormulas();

    if (historyTimeout !== null) {
      clearTimeout(historyTimeout);
    }
    historyTimeout = window.setTimeout(() => {
      saveToHistory();
    }, 1000);
  },
  { deep: true },
);

watch(
  gridSettings,
  () => {
    drawCanvas();
    saveGridSettings();
  },
  { deep: true },
);

onMounted(() => {
  loadSavedFormulas();
  loadGridSettings();
  loadLastFormulas();

  saveToHistory();

  if (canvas.value) {
    ctx = canvas.value.getContext("2d", { alpha: true });
    if (ctx) {
      targetGridStep = getGridStep(scale.value);
      currentGridStep = targetGridStep;
      resizeCanvas();
      drawCanvas();
    }
  }

  if (calculatorContainer.value && window.Desmos) {
    calculator = window.Desmos.GraphingCalculator(calculatorContainer.value, {
      keypad: false,
      expressions: false,
      settingsMenu: false,
      zoomButtons: false,
      expressionsTopbar: false,
      border: false,
      branding: false,
      lockViewport: false,
      backgroundColor: "#262625",
      invertedColors: false,
      xAxisNumbers: false,
      yAxisNumbers: false,
      showGrid: false,
      showXAxis: false,
      showYAxis: false,
    });

    calculator.observe("expressionAnalysis", () => {
      inputPanels.value.forEach((panel) => {
        const analysis = calculator.expressionAnalysis[`expr_${panel.id}`];
        if (analysis) {
          const isGraphable = analysis.isGraphable === true;
          expressionVisibility.value[panel.id] = isGraphable;
          expressionIsGraphable.value[panel.id] = isGraphable;
          panel.isGraphable = isGraphable;
        } else {
          expressionVisibility.value[panel.id] = false;
        }
      });
    });

    syncDesmosWithCanvas();
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("click", handleDocumentClick);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("click", handleDocumentClick);
  if (calculator) {
    calculator.destroy();
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <div class="app-root" :style="{ '--panel-width': panelWidth + 'px' }">
    <div ref="calculatorContainer" class="desmos-container"></div>
    <canvas ref="canvas" @wheel="handleWheel" @mousedown="handleMouseDown" />
    <h1 class="panel-logo">Taumos</h1>
    <div class="panel-logo-version">v0.4 alpha</div>
    <div class="left-panel" :style="{ width: panelWidth + 'px' }">
      <div class="panel-top">
        <div class="formulas-label">formulas</div>
        <div class="button-group">
          <button
            class="icon-button tooltip-container"
            @click.stop="toggleMenu"
          >
            <img src="/src/icons/menu.svg" alt="Menu" />
            <span class="tooltip">load</span>
          </button>
          <button
            ref="saveButtonRef"
            class="icon-button tooltip-container"
            :class="{ active: isSaveMode }"
            @click.stop="toggleSaveMode"
          >
            <img src="/src/icons/save.svg" alt="Save" />
            <span class="tooltip">save</span>
          </button>
          <button
            class="icon-button tooltip-container"
            @click.stop="toggleInputPanel"
          >
            <img src="/src/icons/plus.svg" alt="Add" />
            <span class="tooltip">add</span>
          </button>
        </div>
      </div>
      <div class="formulas-container" @click="handlePanelClick">
        <div
          v-for="panel in inputPanels"
          :key="panel.id"
          :data-panel-id="panel.id"
          class="input-panel"
          :class="{ 'delete-mode': isCtrlPressed }"
          @click="handleInputPanelClick(panel.id, $event)"
        >
          <div
            v-if="expressionVisibility[panel.id]"
            class="color-indicator"
            :style="{ backgroundColor: panel.color }"
            @click="openColorPicker(panel.id, $event)"
          ></div>
          <MathInput
            v-model="panel.text"
            class="formula-input"
            :is-ctrl-pressed="isCtrlPressed"
            @focus="handleMathFieldFocus(panel.id)"
            @blur="handleMathFieldBlur"
            @keyboard-toggle="handleKeyboardToggle"
          />
          <button class="delete-button" @click="removePanel(panel.id)">
            <img src="/src/icons/trash.svg" alt="Delete" />
          </button>
          <button
            v-if="expressionIsGraphable[panel.id]"
            class="visibility-button"
            @click.stop="togglePanelVisibility(panel.id)"
          >
            <img
              :src="
                panel.hidden
                  ? '/src/icons/glasoff.svg'
                  : '/src/icons/glason.svg'
              "
              alt="Toggle visibility"
            />
          </button>
        </div>
      </div>
      <div class="resize-handle" @mousedown="handleResizeStart"></div>
    </div>

    <transition name="success-notification">
      <div
        v-if="showSuccessNotification"
        class="success-notification"
        :class="notificationType"
      >
        {{ notificationMessage }}
      </div>
    </transition>

    <transition name="save-modal">
      <div
        v-if="isSaveMode"
        class="save-modal-overlay"
        @click="isSaveMode = false"
      >
        <div class="save-modal" :style="saveModalStyle" @click.stop>
          <input
            ref="saveInputRef"
            v-model="saveName"
            type="text"
            class="save-name-input"
            placeholder="Enter save name..."
            @keyup.enter="saveFormulas"
          />
          <button class="save-confirm-button" @click="saveFormulas">
            <img src="/src/icons/enter.svg" alt="Save" />
          </button>
        </div>
      </div>
    </transition>

    <div class="settings-button" @click.stop="toggleSettings">
      <div class="panel-header">
        <span class="panel-title">Settings</span>
        <svg
          class="panel-icon"
          :class="{ rotated: isSettingsOpen }"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.17574 6.57573C4.41005 6.34142 4.78995 6.34142 5.02426 6.57573L8 9.55147L10.9757 6.57573C11.2101 6.34142 11.5899 6.34142 11.8243 6.57573C12.0586 6.81005 12.0586 7.18994 11.8243 7.42426L8.42426 10.8243C8.31174 10.9368 8.15913 11 8 11C7.84087 11 7.68826 10.9368 7.57574 10.8243L4.17574 7.42426C3.94142 7.18994 3.94142 6.81004 4.17574 6.57573Z"
            fill="white"
            fill-opacity="0.6"
          />
        </svg>
      </div>
    </div>

    <transition name="keyboard-button">
      <div
        v-if="focusedPanelId !== null"
        class="keyboard-button"
        :style="{ top: keyboardButtonTop }"
        @mousedown.prevent
        @click="toggleKeyboard"
      >
        <img src="/src/icons/Keyboard.svg" alt="Keyboard" />
      </div>
    </transition>

    <transition name="settings-modal">
      <div v-if="isSettingsOpen" class="settings-modal" @click.stop>
        <div class="settings-content">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.showGrid"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Show Grid</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.showMinorGrid"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Minor Grid</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.showAxes"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Show Axes</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.showNumbers"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Show Numbers</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.showOriginPoint"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Origin Point</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.snapToGrid"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Snap to Grid</span>
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="gridSettings.polarMode"
              class="custom-checkbox"
            />
            <span class="checkbox-text">Polar Mode</span>
          </label>
        </div>
      </div>
    </transition>

    <transition name="menu-modal">
      <div v-if="isMenuOpen" class="menu-overlay" @click="toggleMenu">
        <div class="menu-modal" @click.stop>
          <div class="menu-header">
            <button
              class="menu-header-button tooltip-container"
              @click.stop="() => {}"
            >
              <img src="/src/icons/stt.svg" alt="Examples" />
              <span class="tooltip">examples</span>
            </button>
            <h2 class="menu-title">Saved Formulas</h2>
            <button
              ref="deleteButtonRef"
              class="menu-header-button tooltip-container"
              @click.stop="deleteAllSaves"
            >
              <img src="/src/icons/delete2.svg" alt="Delete All" />
              <span class="tooltip">delete all formulas</span>
            </button>
          </div>
          <div class="menu-content">
            <div v-if="savedFormulas.length === 0" class="empty-message">
              No saved formulas yet
            </div>
            <div
              v-for="(save, index) in savedFormulas"
              :key="index"
              class="save-item"
            >
              <div class="save-item-content" @click="loadFormulas(save)">
                <span class="save-name">{{ save.name }}</span>
                <span class="save-count"
                  >{{ save.formulas.length }} formulas</span
                >
              </div>
              <div class="save-preview" v-if="save.preview">
                <img :src="save.preview" alt="Preview" />
              </div>
              <div class="save-preview" v-else>
                <span class="no-preview">No preview</span>
              </div>
              <button
                class="delete-save-button"
                @click.stop="deleteSave(index)"
              >
                <img src="/src/icons/trash.svg" alt="Delete" />
              </button>
            </div>
          </div>
          <transition name="delete-confirm">
            <div
              v-if="showDeleteConfirm"
              class="delete-confirm-modal"
              :style="deleteConfirmStyle"
              @click.stop
            >
              <span class="delete-confirm-text">you sure?</span>
              <button class="delete-confirm-button" @click="confirmDeleteAll">
                yes
              </button>
            </div>
          </transition>
        </div>
      </div>
    </transition>

    <transition name="color-picker">
      <div
        v-if="colorPickerPanelId !== null"
        class="color-picker"
        :style="colorPickerStyle"
        @click.stop
      >
        <canvas
          ref="colorPickerCanvas"
          class="color-picker-canvas"
          width="180"
          height="100"
          @click="handleColorPickerClick"
        ></canvas>
      </div>
    </transition>
  </div>
</template>
