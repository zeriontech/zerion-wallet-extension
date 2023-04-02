import { useSelect } from 'downshift';
import React from 'react';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';

export function AbilityMenu({
  isInline,
  onMark,
  onUnmark,
}: {
  isInline: boolean;
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
        style={{ padding: 8, zIndex: 1 }}
        {...getToggleButtonProps()}
      >
        <DotsIcon
          style={{ color: isInline ? 'var(--neutral-500)' : 'var(--black)' }}
        />
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
                    key: 'restore',
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
                          Restore
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
