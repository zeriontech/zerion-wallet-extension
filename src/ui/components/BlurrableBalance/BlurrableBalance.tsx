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
    'headline/hero': { count: 6, squareSize: 10, height: 48 },
    'headline/h1': { count: 5, squareSize: 9, height: 36 },
    'headline/h2': { count: 4, squareSize: 8, height: 28 },
    'headline/h3': { count: 4, squareSize: 7, height: 24 },
    'body/accent': { count: 3, squareSize: 7, height: 24 },
    'body/regular': { count: 3, squareSize: 7, height: 24 },
    'small/accent': { count: 3, squareSize: 6, height: 20 },
    'small/regular': { count: 3, squareSize: 6, height: 20 },
    'caption/accent': { count: 2, squareSize: 5, height: 16 },
    'caption/regular': { count: 2, squareSize: 5, height: 16 },
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

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        gap: '3px',
        alignItems: 'center',
        height: `${gridConfig.height}px`,
      }}
      aria-label="Balance hidden"
    >
      {Array.from({ length: gridConfig.count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: `${gridConfig.squareSize}px`,
            height: `${gridConfig.squareSize}px`,
            backgroundColor: squareColor,
            borderRadius: '2px',
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}
