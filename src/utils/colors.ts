


export const COLOR_PALETTE = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#27ae60',
  '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22',
  '#c0392b', '#d35400', '#7f8c8d', '#95a5a6', '#bdc3c7',
  '#ecf0f1', '#1abc9c', '#16a085', '#2ecc71', '#27ae60',
  '#3498db', '#2980b9', '#9b59b6', '#8e44ad', '#34495e',
  '#2c3e50', '#f39c12', '#f1c40f', '#e67e22', '#d35400',
  '#e74c3c', '#c0392b'
] as const


export function getColor(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
}


export function getRandomColor(): string {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
}
