import React from 'react';
import { useSelect } from 'downshift';
import { Button } from 'src/ui/ui-kit/Button';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';

export function AbilityMenu({
  onMark,
  onUnmark,
}: {
  onMark?(action: 'dismiss' | 'complete'): void;
  onUnmark?(): void;
}) {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
  } = useSelect({
    items: ['dismiss', 'complete'],
    selectedItem: null,
  });
  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="ghost"
        size={40}
        style={{ padding: 8 }}
        {...getToggleButtonProps()}
      >
        <DotsIcon />
      </Button>
      <div
        {...getMenuProps()}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'var(--white)',
          boxShadow: '0px 8px 16px rgba(22, 22, 26, 0.16)',
          borderRadius: 8,
          width: 180,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <SurfaceList
          items={
            onMark
              ? [
                  {
                    key: 'complete',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        highlighted={highlightedIndex === 0}
                        {...getItemProps({
                          item: 'complete',
                          index: 0,
                          onClick: () => onMark('complete'),
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <DoubleCheckIcon />
                          Mark as complete
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                  {
                    key: 'dissmiss',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        highlighted={highlightedIndex === 1}
                        {...getItemProps({
                          item: 'dissmiss',
                          index: 1,
                          onClick: () => onMark('dismiss'),
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <CloseIcon />
                          Dismiss
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                ]
              : [
                  {
                    key: 'open',
                    isInteractive: true,
                    pad: false,
                    separatorTop: false,
                    component: (
                      <SurfaceItemButton
                        highlighted={highlightedIndex === 0}
                        {...getItemProps({
                          item: 'dissmiss',
                          index: 1,
                          onClick: onUnmark,
                        })}
                      >
                        <HStack gap={4} alignItems="center">
                          <SyncIcon />
                          Open
                        </HStack>
                      </SurfaceItemButton>
                    ),
                  },
                ]
          }
        />
      </div>
    </div>
  );
}
