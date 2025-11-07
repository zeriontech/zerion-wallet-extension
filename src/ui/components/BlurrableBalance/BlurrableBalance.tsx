import React from 'react';
import { useStore } from '@store-unit/react';
import type { UITextProps } from 'src/ui/ui-kit/UIText';
import { preferenceStore } from 'src/ui/features/appearance/preference-store';

interface BlurrableBalanceProps extends Pick<UITextProps, 'kind' | 'color'> {
  children: React.ReactNode;
  className?: string;
}

interface GridConfig {
  count: number;
  squareSize: number;
  height: number;
}

function getGridConfigForKind(kind: UITextProps['kind']): GridConfig {
  const configs: Record<UITextProps['kind'], GridConfig> = {
    'headline/hero': { count: 7, squareSize: 10, height: 48 },
    'headline/h1': { count: 6, squareSize: 9, height: 36 },
    'headline/h2': { count: 5, squareSize: 8, height: 28 },
    'headline/h3': { count: 5, squareSize: 7, height: 24 },
    'body/accent': { count: 4, squareSize: 7, height: 24 },
    'body/regular': { count: 4, squareSize: 7, height: 24 },
    'small/accent': { count: 4, squareSize: 6, height: 20 },
    'small/regular': { count: 4, squareSize: 6, height: 20 },
    'caption/accent': { count: 3, squareSize: 5, height: 16 },
    'caption/regular': { count: 3, squareSize: 5, height: 16 },
  };

  return configs[kind];
}

export function BlurrableBalance({
  children,
  kind,
  color,
  className,
}: BlurrableBalanceProps) {
  const { hideBalances } = useStore(preferenceStore);

  if (!hideBalances) {
    return <>{children}</>;
  }

  const gridConfig = getGridConfigForKind(kind);
  const squareColor = color || 'var(--neutral-600)';

  const numberOfSquares = gridConfig.count * 2;

  return (
    <div
      className={className}
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${gridConfig.count}, ${gridConfig.squareSize}px)`,
        gridTemplateRows: `repeat(2, ${gridConfig.squareSize}px)`,
        paddingTop: (gridConfig.height - gridConfig.squareSize * 2) / 2,
        height: `${gridConfig.height}px`,
      }}
      aria-label="Balance hidden"
    >
      {Array.from({ length: numberOfSquares }).map((_, i) => (
        <div
          key={i}
          style={{
            width: `${gridConfig.squareSize}px`,
            height: `${gridConfig.squareSize}px`,
            backgroundColor: squareColor,
            opacity: Math.random() * 0.4 + 0.1,
            borderTopLeftRadius: i === 0 ? gridConfig.squareSize / 2 : 0,
            borderTopRightRadius:
              i === gridConfig.count - 1 ? gridConfig.squareSize / 2 : 0,
            borderBottomLeftRadius:
              i === gridConfig.count ? gridConfig.squareSize / 2 : 0,
            borderBottomRightRadius:
              i === numberOfSquares - 1 ? gridConfig.squareSize / 2 : 0,
          }}
        />
      ))}
    </div>
  );
}
