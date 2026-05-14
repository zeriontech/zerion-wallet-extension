import React, { useCallback, useEffect, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AddressBookEntry } from 'src/background/Wallet/model/types';
import { VStack } from 'src/ui/ui-kit/VStack';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import DotsIcon from 'jsx:src/ui/assets/dots.svg';
import DragIcon from 'jsx:src/ui/assets/drag.svg';
import TrashIcon from 'jsx:src/ui/assets/trash.svg';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { AddressBookRow } from './AddressBookRow';

function SortableRow({
  entry,
  onEdit,
  onRemove,
}: {
  entry: AddressBookEntry;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const id = normalizeAddress(entry.address);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <div ref={setNodeRef} style={style}>
      <AddressBookRow
        entry={entry}
        rightSlot={
          <HStack gap={12} alignItems="center">
            <UnstyledButton
              type="button"
              onPointerDown={stop}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              title="Remove"
              style={{ display: 'flex', color: 'var(--negative-500)' }}
            >
              <TrashIcon style={{ width: 20, height: 20 }} />
            </UnstyledButton>
            <UnstyledButton
              type="button"
              onPointerDown={stop}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              title="Edit"
              style={{ display: 'flex' }}
            >
              <DotsIcon />
            </UnstyledButton>
            <div
              {...attributes}
              {...listeners}
              style={{
                display: 'flex',
                color: 'var(--neutral-500)',
                cursor: 'grab',
                touchAction: 'none',
              }}
              title="Drag to reorder"
            >
              <DragIcon />
            </div>
          </HStack>
        }
      />
    </div>
  );
}

export function AddressBookListEdit({
  entries,
  onReorder,
  onEditEntry,
  onRemoveEntry,
}: {
  entries: AddressBookEntry[];
  onReorder: (next: AddressBookEntry[]) => void;
  onEditEntry: (entry: AddressBookEntry) => void;
  onRemoveEntry: (entry: AddressBookEntry) => void;
}) {
  const [localOrder, setLocalOrder] = useState<AddressBookEntry[]>(entries);

  // Keep local order in sync when entries are added/removed/renamed externally
  useEffect(() => {
    const sameLength = localOrder.length === entries.length;
    const sameItems =
      sameLength &&
      localOrder.every(
        (item, i) =>
          normalizeAddress(item.address) ===
            normalizeAddress(entries[i].address) &&
          item.name === entries[i].name
      );
    if (!sameItems) {
      setLocalOrder(entries);
    }
  }, [entries, localOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const oldIndex = localOrder.findIndex(
        (item) => normalizeAddress(item.address) === active.id
      );
      const newIndex = localOrder.findIndex(
        (item) => normalizeAddress(item.address) === over.id
      );
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(localOrder, oldIndex, newIndex);
      setLocalOrder(next);
      onReorder(next);
    },
    [localOrder, onReorder]
  );

  const ids = localOrder.map((item) => normalizeAddress(item.address));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <VStack gap={0}>
          {localOrder.map((entry) => (
            <SortableRow
              key={normalizeAddress(entry.address)}
              entry={entry}
              onEdit={() => onEditEntry(entry)}
              onRemove={() => onRemoveEntry(entry)}
            />
          ))}
        </VStack>
      </SortableContext>
    </DndContext>
  );
}
