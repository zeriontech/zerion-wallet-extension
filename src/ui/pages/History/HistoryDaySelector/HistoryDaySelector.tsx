import React, { useMemo, useRef, useState } from 'react';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { DialogTitle } from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import ChevronLeftIcon from 'jsx:src/ui/assets/chevron-left-medium.svg';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import { Button } from 'src/ui/ui-kit/Button';
import * as styles from './styles.module.css';

interface DayPickerProps {
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onDateSelect: (date: Date) => void;
}

function DayPicker({
  selectedDate,
  minDate,
  maxDate,
  onDateSelect,
}: DayPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    () => selectedDate || new Date()
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent, day: number) => {
    let newDate: Date | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newDate = new Date(year, month, day - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newDate = new Date(year, month, day + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newDate = new Date(year, month, day - 7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newDate = new Date(year, month, day + 7);
        break;
      default:
        return;
    }

    if (newDate) {
      // Check if we need to change month
      if (newDate.getMonth() !== month) {
        setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
      }

      // Focus the new date button
      setTimeout(() => {
        const button = document.querySelector(
          `button[data-date="${newDate.toISOString()}"]`
        ) as HTMLButtonElement;
        button?.focus();
      }, 0);
    }
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const disabled = isDateDisabled(date);
    const selected = isDateSelected(date);

    days.push(
      <button
        key={`${month}-${day}`}
        type="button"
        className={styles.dayButton}
        data-selected={selected || undefined}
        autoFocus={selected}
        data-disabled={disabled || undefined}
        data-date={date.toISOString()}
        disabled={disabled}
        onClick={() => !disabled && onDateSelect(date)}
        onKeyDown={(e) => handleKeyDown(e, day)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={styles.dayPicker}>
      <HStack
        gap={12}
        style={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <UnstyledButton
          onClick={goToPreviousMonth}
          className={styles.navButton}
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
        <UIText kind="headline/h3" style={{ userSelect: 'none' }}>
          {monthNames[month]} {year}
        </UIText>
        <UnstyledButton
          onClick={goToNextMonth}
          className={styles.navButton}
          type="button"
          aria-label="Next month"
        >
          <ChevronRightIcon style={{ width: 20, height: 20 }} />
        </UnstyledButton>
      </HStack>
      <Spacer height={24} />
      <div className={styles.calendar}>
        {dayNames.map((name) => (
          <div key={name} className={styles.dayName}>
            <UIText kind="small/regular" color="var(--neutral-500)">
              {name}
            </UIText>
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}

export function HistoryDaySelector({
  trigger,
  selectedDate,
  minDate,
  maxDate,
  onDateSelect,
  className,
  style,
}: {
  trigger: React.ReactNode;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onDateSelect: (date: Date | null) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const currentDate = useMemo(() => selectedDate || new Date(), [selectedDate]);
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const handleTriggerClick = () => {
    if (!dialogRef.current) return;

    showConfirmDialog(dialogRef.current)
      .then((dateString) => {
        const date = dateString !== 'now' ? new Date(dateString) : null;
        onDateSelect(date);
      })
      .catch(() => {
        // User cancelled or closed the dialog
      });
  };

  const handleDateSelect = (date: Date | null) => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = date ? date.toISOString() : 'now';
      dialogRef.current.close();
    }
  };

  return (
    <>
      <UnstyledButton
        onClick={handleTriggerClick}
        style={style}
        className={className}
        title="Select target date"
      >
        {trigger}
      </UnstyledButton>
      <BottomSheetDialog
        ref={dialogRef}
        height="min-content"
        renderWhenOpen={() => (
          <>
            <DialogTitle alignTitle="start" title="Jump to date" />
            <form method="dialog">
              <Spacer height={24} />
              <DayPicker
                selectedDate={currentDate}
                minDate={minDate}
                maxDate={maxDate}
                onDateSelect={handleDateSelect}
              />
              {selectedDate ? (
                <>
                  <Spacer height={24} />
                  <Button
                    onClick={() => handleDateSelect(null)}
                    style={{ width: '100%' }}
                    size={40}
                  >
                    Clear Date
                  </Button>
                </>
              ) : null}
            </form>
          </>
        )}
      />
    </>
  );
}
