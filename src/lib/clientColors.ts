// Generates a consistent HSL color per client id (stable across renders).
// Saturation/luminosity tuned for the dark theme so all clients are legible.

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function clientColor(id: string) {
  const hue = hashString(id) % 360;
  return {
    hue,
    bg: `hsl(${hue} 70% 55% / 0.18)`,
    border: `hsl(${hue} 70% 55% / 0.45)`,
    fg: `hsl(${hue} 85% 75%)`,
    dot: `hsl(${hue} 75% 60%)`,
  };
}
