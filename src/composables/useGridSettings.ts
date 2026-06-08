import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { GridSettings } from "../types";
import { STORAGE_KEYS } from "../types";

export interface UseGridSettingsReturn {
  settings: Ref<GridSettings>;
  loadSettings: () => void;
  saveSettings: () => void;
  toggleSetting: (key: keyof GridSettings) => void;
  resetSettings: () => void;
}


export function useGridSettings(): UseGridSettingsReturn {

  const defaultSettings: GridSettings = {
    showGrid: true,
    showAxes: true,
    showNumbers: true,
    showMinorGrid: false,
    showOriginPoint: true,
    snapToGrid: false,
    polarMode: false,
  };


  const settings = ref<GridSettings>({ ...defaultSettings });


  const loadSettings = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRID_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        settings.value = { ...defaultSettings, ...parsed };
      } catch (e) {
        console.error("Failed to load grid settings:", e);
        settings.value = { ...defaultSettings };
      }
    }
  };


  const saveSettings = () => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.GRID_SETTINGS,
        JSON.stringify(settings.value),
      );
    } catch (e) {
      console.error("Failed to save grid settings:", e);
    }
  };


  const toggleSetting = (key: keyof GridSettings) => {
    if (typeof settings.value[key] === "boolean") {
      settings.value[key] = !settings.value[key] as any;
    }
  };


  const resetSettings = () => {
    settings.value = { ...defaultSettings };
    saveSettings();
  };


  watch(
    settings,
    () => {
      saveSettings();
    },
    { deep: true },
  );

  loadSettings();

  return {
    settings,
    loadSettings,
    saveSettings,
    toggleSetting,
    resetSettings,
  };
}
