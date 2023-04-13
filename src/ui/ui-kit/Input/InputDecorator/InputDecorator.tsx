import type { ForwardedRef } from 'react';
import React from 'react';
import { Surface } from '../../Surface';
import { VStack } from '../../VStack';
import type { UITextProps } from '../../UIText';
import { UIText } from '../../UIText';

interface Props extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  labelTextKind?: UITextProps['kind'];
  inputTextKind?: UITextProps['kind'];
  label: JSX.Element | string;
  input: JSX.Element;
  htmlFor: string;
}

function handleInputWrapperClick(
  event: React.MouseEvent<HTMLFieldSetElement, MouseEvent>
) {
  if (event.target === event.currentTarget) {
    const input = event.currentTarget.querySelector('input');
    if (input) {
      input.focus();
    }
  }
}

function InputDecoratorComponent(
  {
    className,
    labelTextKind = 'caption/regular',
    inputTextKind = 'body/regular',
    label,
    input,
    htmlFor,
    ...props
  }: Props,
  ref: ForwardedRef<HTMLFieldSetElement>
) {
  return (
    <Surface
      as="fieldset"
      padding="8px 12px"
      style={{ border: '1px solid var(--neutral-400)' }}
      onClick={handleInputWrapperClick}
      ref={ref}
      {...props}
    >
      <VStack gap={0}>
        {label ? (
          <UIText
            as="label"
            htmlFor={htmlFor}
            kind={labelTextKind}
            color="var(--neutral-500)"
          >
            {label}
          </UIText>
        ) : null}
        <UIText kind={inputTextKind}>{input}</UIText>
      </VStack>
    </Surface>
  );
}

export const InputDecorator = React.forwardRef(InputDecoratorComponent);
