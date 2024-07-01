import React, { useRef } from 'react';
import cn from 'classnames';
import { VStack } from '../VStack';
import { UIText } from '../UIText';
import { HStack } from '../HStack';
import * as styles from './styles.module.css';

interface FormFieldsetProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
  title: React.ReactNode;
  endTitle?: React.ReactNode;
  startInput: React.ReactNode;
  endInput?: React.ReactNode;
  startDescription?: React.ReactNode;
  endDescription?: React.ReactNode;
  unstyled?: boolean;
  /**
   * Used when you might have more than one input inside the FormFieldset
   * and you need to specify which gets focused on click
   */
  inputSelector?: string;
}

export const FormFieldset = React.forwardRef<
  HTMLFieldSetElement,
  FormFieldsetProps
>(
  (
    {
      title,
      endTitle,
      startInput,
      endInput,
      startDescription,
      endDescription,
      className,
      disabled,
      unstyled,
      inputSelector,
      ...props
    },
    ref
  ) => {
    const labelRef = useRef<HTMLLabelElement | null>(null);
    return (
      <fieldset
        {...props}
        ref={ref}
        className={cn(
          className,
          unstyled ? styles.unstyled : styles.container,
          disabled || unstyled ? null : styles.hoverable
        )}
        onClick={(event) => {
          if (
            event.target === event.currentTarget ||
            event.target === labelRef.current
          ) {
            const input = event.currentTarget.querySelector(
              inputSelector ?? 'input'
            );
            if (input && input instanceof HTMLInputElement) {
              input.focus();
            }
          }
        }}
      >
        <VStack gap={4} style={{ width: '100%' }}>
          <HStack gap={8} justifyContent="space-between" alignItems="center">
            <UIText kind="small/regular" as="label" ref={labelRef}>
              {title}
            </UIText>
            {endTitle ? <UIText kind="small/regular">{endTitle}</UIText> : null}
          </HStack>
          <HStack
            gap={8}
            justifyContent="space-between"
            alignItems="center"
            style={{
              gridTemplateColumns: endInput ? 'minmax(100px, 1fr) auto' : '1fr',
            }}
          >
            <UIText kind="headline/h3">{startInput}</UIText>
            {endInput ? <UIText kind="headline/h3">{endInput}</UIText> : null}
          </HStack>
          {startDescription || endDescription ? (
            <HStack gap={8} justifyContent="space-between">
              <UIText kind="small/regular" color="var(--neutral-600)">
                {startDescription}
              </UIText>
              <UIText kind="small/regular" color="var(--neutral-600)">
                {endDescription}
              </UIText>
            </HStack>
          ) : null}
        </VStack>
      </fieldset>
    );
  }
);
