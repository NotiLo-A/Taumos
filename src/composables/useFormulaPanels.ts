import { ref, type Ref } from "vue";
import type { FormulaPanel } from "../types";
import { getRandomColor } from "../utils/colors";

export interface UseFormulaPanelsReturn {
  panels: Ref<FormulaPanel[]>;
  nextPanelId: Ref<number>;
  expressionVisibility: Ref<Record<number, boolean>>;
  expressionIsGraphable: Ref<Record<number, boolean>>;
  addPanel: () => void;
  removePanel: (id: number) => void;
  updatePanelText: (id: number, text: string) => void;
  updatePanelColor: (id: number, color: string) => void;
  togglePanelVisibility: (id: number) => void;
  setPanels: (panels: FormulaPanel[]) => void;
  setExpressionGraphable: (id: number, isGraphable: boolean) => void;
}


export function useFormulaPanels(): UseFormulaPanelsReturn {
  const panels = ref<FormulaPanel[]>([]);
  const nextPanelId = ref(0);
  const expressionVisibility = ref<Record<number, boolean>>({});
  const expressionIsGraphable = ref<Record<number, boolean>>({});


  const addPanel = (): void => {
    const newPanel: FormulaPanel = {
      id: nextPanelId.value,
      text: "",
      color: getRandomColor(),
      hidden: false,
      isGraphable: false,
    };

    panels.value.push(newPanel);
    nextPanelId.value++;
  };


  const removePanel = (id: number): void => {
    panels.value = panels.value.filter((panel) => panel.id !== id);
    delete expressionVisibility.value[id];
    delete expressionIsGraphable.value[id];
  };


  const updatePanelText = (id: number, text: string): void => {
    const panel = panels.value.find((p) => p.id === id);
    if (panel) {
      panel.text = text;
    }
  };


  const updatePanelColor = (id: number, color: string): void => {
    const panel = panels.value.find((p) => p.id === id);
    if (panel) {
      panel.color = color;
    }
  };


  const togglePanelVisibility = (id: number): void => {
    const panel = panels.value.find((p) => p.id === id);
    if (panel) {
      panel.hidden = !panel.hidden;

      if (panel.hidden && panel.isGraphable) {
        expressionVisibility.value[id] = true;
      }
    }
  };


  const setPanels = (newPanels: FormulaPanel[]): void => {
    panels.value = newPanels;

    newPanels.forEach((panel) => {
      if (panel.isGraphable !== undefined) {
        expressionIsGraphable.value[panel.id] = panel.isGraphable;
      }
    });

    if (newPanels.length > 0) {
      const maxId = Math.max(...newPanels.map((p) => p.id));
      nextPanelId.value = maxId + 1;
    }
  };


  const setExpressionGraphable = (id: number, isGraphable: boolean): void => {
    expressionIsGraphable.value[id] = isGraphable;

    const panel = panels.value.find((p) => p.id === id);
    if (panel) {
      panel.isGraphable = isGraphable;
    }
  };

  return {
    panels,
    nextPanelId,
    expressionVisibility,
    expressionIsGraphable,
    addPanel,
    removePanel,
    updatePanelText,
    updatePanelColor,
    togglePanelVisibility,
    setPanels,
    setExpressionGraphable,
  };
}
