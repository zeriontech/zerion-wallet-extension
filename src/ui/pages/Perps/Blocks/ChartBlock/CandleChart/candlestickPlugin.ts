import { BarController, BarElement, type Element } from 'chart.js';

export interface CandlestickPoint {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface CandlestickElementOptions {
  upColor: string;
  downColor: string;
  borderUpColor: string;
  borderDownColor: string;
  wickUpColor: string;
  wickDownColor: string;
  bodyWidth: number;
}

interface CandlestickElementProps {
  x: number;
  yOpen: number;
  yHigh: number;
  yLow: number;
  yClose: number;
  width: number;
}

export class CandlestickElement extends BarElement {
  static id = 'candlestick';

  static defaults = {
    ...BarElement.defaults,
    upColor: '#01a345',
    downColor: '#e02f44',
    borderUpColor: '#01a345',
    borderDownColor: '#e02f44',
    wickUpColor: '#01a345',
    wickDownColor: '#e02f44',
    bodyWidth: 8,
  };

  static defaultRoutes = {};

  // @ts-expect-error custom options shape diverges from BarElement's BarOptions
  declare options: CandlestickElementOptions;

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, yOpen, yHigh, yLow, yClose, width } =
      this as unknown as CandlestickElementProps;
    const opts = this.options;

    const isUp = yClose <= yOpen;
    const bodyColor = isUp ? opts.upColor : opts.downColor;
    const wickColor = isUp ? opts.wickUpColor : opts.wickDownColor;
    const bodyWidth = Math.max(1, Math.min(width, opts.bodyWidth));

    ctx.save();

    ctx.strokeStyle = wickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    const top = Math.min(yOpen, yClose);
    const bottom = Math.max(yOpen, yClose);
    const height = Math.max(1, bottom - top);
    const left = x - bodyWidth / 2;
    const radius = Math.min(2, bodyWidth / 2, height / 2);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(left, top, bodyWidth, height, radius);
    ctx.fill();

    ctx.restore();
  }

  tooltipPosition(): { x: number; y: number } {
    const { x, yHigh, yLow } = this as unknown as CandlestickElementProps;
    return { x, y: (yHigh + yLow) / 2 };
  }

  getRange(axis: 'x' | 'y'): number {
    const { width } = this as unknown as CandlestickElementProps;
    return axis === 'x' ? width / 2 : 0;
  }

  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    const { x, yHigh, yLow, width } =
      this as unknown as CandlestickElementProps;
    void useFinalPosition;
    return (
      mouseX >= x - width / 2 &&
      mouseX <= x + width / 2 &&
      mouseY >= yHigh &&
      mouseY <= yLow
    );
  }

  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    const { x, width } = this as unknown as CandlestickElementProps;
    void useFinalPosition;
    return mouseX >= x - width / 2 && mouseX <= x + width / 2;
  }

  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    const { yHigh, yLow } = this as unknown as CandlestickElementProps;
    void useFinalPosition;
    return mouseY >= yHigh && mouseY <= yLow;
  }

  getCenterPoint(): { x: number; y: number } {
    return this.tooltipPosition();
  }
}

interface ParsedCandle {
  x: number;
  y: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export class CandlestickController extends BarController {
  static id = 'candlestick';

  static defaults = {
    ...BarController.defaults,
    dataElementType: CandlestickElement.id,
    datasets: {
      categoryPercentage: 1,
      barPercentage: 0.9,
    },
  };

  static overrides = {
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: { type: 'time' as const },
      y: { type: 'linear' as const },
    },
  };

  parseObjectData(
    meta: { iScale?: { parse: (value: unknown) => unknown } },
    data: CandlestickPoint[],
    start: number,
    count: number
  ): ParsedCandle[] {
    const parsed: ParsedCandle[] = [];
    for (let i = start; i < start + count; i += 1) {
      const point = data[i];
      const parsedX = meta.iScale ? meta.iScale.parse(point.x) : point.x;
      parsed.push({
        x: typeof parsedX === 'number' ? parsedX : Number(parsedX),
        y: point.c,
        o: point.o,
        h: point.h,
        l: point.l,
        c: point.c,
      });
    }
    return parsed;
  }

  getMinMax(scale: { axis: string }): {
    min: number;
    max: number;
  } {
    const meta = this.getMeta();
    const parsed = (meta._parsed ?? []) as ParsedCandle[];
    if (parsed.length === 0) {
      return { min: 0, max: 1 };
    }
    if (scale.axis === 'y') {
      const xScale = this.chart.scales.x as
        | {
            min?: number;
            max?: number;
            _userMin?: number;
            _userMax?: number;
          }
        | undefined;
      const xMin = Number.isFinite(xScale?._userMin)
        ? (xScale?._userMin as number)
        : xScale?.min;
      const xMax = Number.isFinite(xScale?._userMax)
        ? (xScale?._userMax as number)
        : xScale?.max;
      const useViewport =
        Number.isFinite(xMin) &&
        Number.isFinite(xMax) &&
        (xMax as number) > (xMin as number);

      const candleInterval =
        parsed.length > 1
          ? (parsed[parsed.length - 1].x - parsed[0].x) / (parsed.length - 1)
          : 0;

      let lo: ParsedCandle | null = null;
      let hi: ParsedCandle | null = null;
      const collect = (p: ParsedCandle) => {
        if (lo == null || p.l < lo.l) lo = p;
        if (hi == null || p.h > hi.h) hi = p;
      };

      if (useViewport) {
        const viewportMin = (xMin as number) - candleInterval;
        const viewportMax = xMax as number;
        for (const p of parsed) {
          if (p.x >= viewportMin && p.x <= viewportMax) collect(p);
        }
        if (lo == null || hi == null) {
          const fallbackStart = Math.max(0, parsed.length - 10);
          for (let i = fallbackStart; i < parsed.length; i += 1) {
            collect(parsed[i]);
          }
        }
      } else {
        for (const p of parsed) collect(p);
      }

      const minLow = (lo as ParsedCandle | null)?.l ?? 0;
      const maxHigh = (hi as ParsedCandle | null)?.h ?? 1;
      const range = Math.max(maxHigh - minLow, 1e-9);
      const pad = range * 0.08;
      return { min: minLow - pad, max: maxHigh + pad };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const p of parsed) {
      if (p.x < min) min = p.x;
      if (p.x > max) max = p.x;
    }
    return { min, max };
  }

  getLabelAndValue(index: number): { label: string; value: string } {
    const meta = this.getMeta();
    const parsed = (meta._parsed?.[index] ?? {}) as ParsedCandle;
    return {
      label: String(parsed.x ?? ''),
      value: `O ${parsed.o} H ${parsed.h} L ${parsed.l} C ${parsed.c}`,
    };
  }

  updateElements(
    elements: Element[],
    start: number,
    count: number,
    mode: 'default' | 'reset' | 'hide' | 'show' | 'none' | 'active' | 'resize'
  ): void {
    const meta = this.getMeta();
    const dataset = this.getDataset() as { data: CandlestickPoint[] };
    const xScale = meta.xScale;
    const yScale = meta.yScale;
    if (!xScale || !yScale) {
      return;
    }
    const reset = mode === 'reset';
    const baseY = yScale.getBasePixel();

    let pixelWidth = 8;
    if (count > 1) {
      const first = (meta._parsed?.[0] ?? {}) as ParsedCandle;
      const last = (meta._parsed?.[count - 1] ?? {}) as ParsedCandle;
      if (first.x != null && last.x != null) {
        pixelWidth = Math.max(
          2,
          Math.min(
            14,
            Math.abs(
              (xScale.getPixelForValue(last.x) -
                xScale.getPixelForValue(first.x)) /
                Math.max(1, count - 1)
            ) * 0.8
          )
        );
      }
    }

    for (let i = start; i < start + count; i += 1) {
      const element = elements[i] as unknown as CandlestickElementProps & {
        active?: boolean;
        options?: CandlestickElementOptions;
      };
      const parsed = (meta._parsed?.[i] ?? {}) as ParsedCandle;
      const raw = dataset.data[i];
      const xValue = parsed.x ?? raw?.x ?? 0;

      const x = xScale.getPixelForValue(xValue);
      const yOpen = reset ? baseY : yScale.getPixelForValue(parsed.o ?? raw.o);
      const yHigh = reset ? baseY : yScale.getPixelForValue(parsed.h ?? raw.h);
      const yLow = reset ? baseY : yScale.getPixelForValue(parsed.l ?? raw.l);
      const yClose = reset ? baseY : yScale.getPixelForValue(parsed.c ?? raw.c);

      const properties: CandlestickElementProps & {
        options?: CandlestickElementOptions;
      } = {
        x,
        yOpen,
        yHigh,
        yLow,
        yClose,
        width: pixelWidth,
      };

      const sharedOptions = this.resolveDataElementOptions(i, mode);
      properties.options =
        sharedOptions as unknown as CandlestickElementOptions;

      this.updateElement(
        element as unknown as Element,
        i,
        properties as unknown as Record<string, unknown>,
        mode
      );
    }
  }
}

declare module 'chart.js' {
  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: ChartTypeRegistry['bar']['chartOptions'];
      datasetOptions: ChartTypeRegistry['bar']['datasetOptions'];
      defaultDataPoint: CandlestickPoint;
      metaExtensions: ChartTypeRegistry['bar']['metaExtensions'];
      parsedDataType: ParsedCandle;
      scales: 'time' | 'linear';
    };
  }
}
