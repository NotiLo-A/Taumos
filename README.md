# Taumos

Taumos is an advanced, highly interactive web-based graphing calculator built with Vue 3 and TypeScript. It leverages the mathematical rendering power of the Desmos API and synchronizes it seamlessly with a custom-built HTML5 Canvas grid system, offering users deep control over the graphing environment.

## Screenshots
<img width="450" alt="image_2026-06-08_18-59-12" src="https://github.com/user-attachments/assets/6d806e3f-ee08-473c-8426-2d253b2b8ed0" />
<img width="450" alt="image" src="https://github.com/user-attachments/assets/fafa3d10-e4fd-484c-90db-693cdee2e31a" />
<img width="450" alt="image" src="https://github.com/user-attachments/assets/70d66346-d612-46ae-8bec-7961b6ed654a" />
<img width="450" alt="image" src="https://github.com/user-attachments/assets/96ab403c-eaf2-4174-b5d3-bdfea5792554" />

## Features

* **Hybrid Rendering Engine:** Combines a highly customizable HTML5 Canvas grid with the Desmos mathematical engine.
* **Dynamic Grid System:** Granular control over the workspace including Cartesian and Polar modes, minor grid toggles, axis visibility, and snap-to-grid functionality.
* **Infinite Canvas Navigation:** Smooth zooming and panning with dynamic grid step scaling (1, 2, 5, 10, etc.) tailored to the viewport zoom level.
* **Advanced Formula Management:** Add, delete, and temporarily hide mathematical expressions. Includes an integrated virtual math keyboard and a custom Canvas-based color picker.
* **Save & Load System:** Persist your formulas locally. The app automatically generates high-contrast base64 thumbnail previews of your graphs when saving.
* **History & State:** Built-in undo tracking (Ctrl+Z) and automatic local storage synchronization for your latest formulas and grid settings.
* **Responsive UI:** Features a fully resizable side panel to balance the formula editor and the graphing viewport.

## Tech Stack

* **Framework:** Vue 3 (Composition API)
* **Language:** TypeScript
* **Build Tool:** Vite
* **Core APIs:** HTML5 Canvas API, Desmos Graphing Calculator API

## Project Structure

* `src/components/`: Contains isolated UI components like the `MathInput` field.
* `src/composables/`: Modular, reusable composition logic for Canvas handling, panel states, and grid math.
* `src/utils/`: Helper functions for layout math and color conversions.
* `src/examples/`: Built-in formula examples and pre-generated preview assets.

## Getting Started

```bash
git clone git@github.com:NotiLo-A/Taumos.git
cd Taumos
npm install
npm run dev
```
