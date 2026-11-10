/**
 * Blockies identicon renderer, ported from @download/blockies 1.0.3 (MIT).
 * Kept local so the unmaintained package (last release 2018) drops out of the
 * dependency tree. The algorithm, including the Xorshift PRNG and color
 * generation, is preserved verbatim to keep avatars pixel-identical.
 */
const randseed = [0, 0, 0, 0];

function seedrand(seed: string) {
  randseed.fill(0);
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] = (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
  }
}

function rand() {
  const t = randseed[0] ^ (randseed[0] << 11);
  randseed[0] = randseed[1];
  randseed[1] = randseed[2];
  randseed[2] = randseed[3];
  randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);
  return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
}

function createColor() {
  const h = Math.floor(rand() * 360);
  const s = rand() * 60 + 40 + '%';
  const l = (rand() + rand() + rand() + rand()) * 25 + '%';
  return `hsl(${h},${s},${l})`;
}

function createImageData(size: number) {
  const width = size;
  const height = size;
  const dataWidth = Math.ceil(width / 2);
  const mirrorWidth = width - dataWidth;
  const data: number[] = [];

  for (let y = 0; y < height; y++) {
    let row: number[] = [];
    for (let x = 0; x < dataWidth; x++) {
      row[x] = Math.floor(rand() * 2.3);
    }
    const mirrored = row.slice(0, mirrorWidth).reverse();
    row = row.concat(mirrored);
    data.push(...row);
  }

  return data;
}

export interface BlockiesOptions {
  seed?: string;
  size?: number;
  scale?: number;
  color?: string;
  bgcolor?: string;
  spotcolor?: string;
}

function buildOpts(opts: BlockiesOptions) {
  const next = {
    seed: opts.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16),
    size: opts.size || 8,
    scale: opts.scale || 4,
    color: opts.color || '',
    bgcolor: opts.bgcolor || '',
    spotcolor: opts.spotcolor || '',
  };
  seedrand(next.seed);
  next.color = next.color || createColor();
  next.bgcolor = next.bgcolor || createColor();
  next.spotcolor = next.spotcolor || createColor();
  return next;
}

export function renderIcon(opts: BlockiesOptions, canvas: HTMLCanvasElement): HTMLCanvasElement {
  const options = buildOpts(opts);
  const imageData = createImageData(options.size);
  const width = Math.sqrt(imageData.length);

  canvas.width = canvas.height = options.size * options.scale;
  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  context.fillStyle = options.bgcolor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.color;

  for (let i = 0; i < imageData.length; i++) {
    if (imageData[i]) {
      const row = Math.floor(i / width);
      const col = i % width;
      context.fillStyle = imageData[i] === 1 ? options.color : options.spotcolor;
      context.fillRect(col * options.scale, row * options.scale, options.scale, options.scale);
    }
  }

  return canvas;
}

export function createIcon(opts: BlockiesOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  renderIcon(opts, canvas);
  return canvas;
}
