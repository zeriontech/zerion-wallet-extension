export function generateSolanaBlockie(
  address: string,
  size: number
): HTMLCanvasElement {
  const blocksCount = 8;
  const scale = (size / blocksCount) * window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * window.devicePixelRatio;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function pseudoRandom(seed: string): () => number {
    let value = hashCode(seed);
    return function () {
      value = (value * 16807) % 2147483647;
      return (value & 0xffffff) / 0x1000000;
    };
  }

  const rand = pseudoRandom(address);
  const colors = [
    `hsl(${Math.floor(rand() * 360)}, 80%, 60%)`,
    `hsl(${Math.floor(rand() * 360)}, 70%, 50%)`,
    `hsl(${Math.floor(rand() * 360)}, 60%, 40%)`,
    `hsl(${Math.floor(rand() * 360)}, 90%, 70%)`,
  ];
  const bgColor = colors[Math.floor(rand() * colors.length)];
  const fgColor = colors[Math.floor(rand() * colors.length)];

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, blocksCount, blocksCount);

  for (let x = 0; x < blocksCount; x++) {
    for (let y = 0; y < blocksCount; y++) {
      if (rand() > 0.5) {
        ctx.fillStyle = fgColor;
        ctx.beginPath();
        ctx.arc(x + 0.5, y + 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${rand() * 0.3 + 0.2})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas;
}
