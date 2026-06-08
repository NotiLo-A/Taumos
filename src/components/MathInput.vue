<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import "mathlive";

const props = defineProps<{
  modelValue: string;
  isCtrlPressed?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus"): void;
  (e: "blur"): void;
  (e: "keyboard-toggle", isOpen: boolean): void;
}>();

const mathFieldRef = ref<any>(null);

const handleContainerClick = (e: MouseEvent) => {
  console.log("container click", e.target, e.ctrlKey, e.currentTarget);
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  if (mathFieldRef.value) {
    mathFieldRef.value.focus();
  }
};

watch(
  () => props.isCtrlPressed,
  (isPressed) => {
    if (mathFieldRef.value) {
      if (isPressed) {
        mathFieldRef.value.style.pointerEvents = "none";
        const shadowRoot = mathFieldRef.value.shadowRoot;
        if (shadowRoot) {
          const style = document.createElement("style");
          style.id = "ctrl-disable-pointer";
          style.textContent = "* { pointer-events: none !important; }";
          shadowRoot.appendChild(style);
        }
      } else {
        mathFieldRef.value.style.pointerEvents = "";
        const shadowRoot = mathFieldRef.value.shadowRoot;
        if (shadowRoot) {
          const style = shadowRoot.getElementById("ctrl-disable-pointer");
          if (style) style.remove();
        }
      }
    }
  },
);

onMounted(() => {
  if (window.mathVirtualKeyboard) {
    window.mathVirtualKeyboard.layouts = ["numeric", "symbols", "greek"];
  }

  if (mathFieldRef.value) {
    mathFieldRef.value.value = props.modelValue || "";

    mathFieldRef.value.addEventListener("input", (e: any) => {
      emit("update:modelValue", e.target.value);
    });
    mathFieldRef.value.addEventListener("focus", () => emit("focus"));
    mathFieldRef.value.addEventListener("blur", () => emit("blur"));
    mathFieldRef.value.addEventListener("virtual-keyboard-toggle", (e: any) => {
      emit("keyboard-toggle", e.detail.visible);
    });
  }
});
</script>

<template>
  <div
    ref="containerRef"
    class="math-input-container"
    @click="handleContainerClick"
  >
    <math-field
      ref="mathFieldRef"
      class="formula-input"
      :class="{ 'no-pointer': isCtrlPressed }"
      placeholder="Enter formula..."
    ></math-field>
  </div>
</template>

<style scoped>
.math-input-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: text;
  position: relative;
}

.formula-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  padding: 0 8px;
  display: flex;
  align-items: center;
}

.formula-input.no-pointer {
  pointer-events: none !important;
}

.formula-input.no-pointer::part(content) {
  pointer-events: none !important;
}

.formula-input::part(menu-toggle) {
  display: none;
}

.formula-input::part(virtual-keyboard-toggle) {
  display: none;
}

.formula-input::part(content) {
  padding: 0;
  margin: 0;
}

.formula-input::part(placeholder) {
  color: rgba(255, 255, 255, 0.15);
  opacity: 0.5;
}
</style>
