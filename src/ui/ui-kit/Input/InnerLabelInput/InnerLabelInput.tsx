import React, { useId } from 'react';
import type { ForwardedRef } from 'react';
import type { UITextProps } from '../../UIText';
import { UnstyledInput } from '../../UnstyledInput';
import { InputDecorator } from '../InputDecorator';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  labelTextKind?: UITextProps['kind'];
  inputTextKind?: UITextProps['kind'];
  label: JSX.Element | string;
}

function InnerLabelInputComponent(
  { style, className, ...props }: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const id = useId();
  return (
    <InputDecorator
      htmlFor={id}
      labelTextKind={props.labelTextKind}
      inputTextKind={props.inputTextKind}
      label={props.label}
      style={style}
      className={className}
      input={
        <UnstyledInput ref={ref} id={id} style={{ width: '100%' }} {...props} />
      }
    />
  );
}

export const InnerLabelInput = React.forwardRef(InnerLabelInputComponent);
