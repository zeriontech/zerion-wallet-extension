import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
} from 'react';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';

interface CallbackProps {
  value: string | number;
  handleChange: (value: string) => void;
}

type Value = string | number;
interface Props {
  onChange: (value: string) => void;
  delay?: number;
  value: Value;
  render: (props: CallbackProps) => React.ReactElement;
}

export interface InputHandle {
  setValue: (value: Value) => void;
}

function DebouncedInputComponent(
  { onChange, delay = 500, render, value }: Props,
  ref: React.Ref<InputHandle>
) {
  const [innerValue, setInnerValue] = useState(value);
  const pendingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    setValue: setInnerValue,
  }));

  const debouncedSetValue = useDebouncedCallback(
    useCallback((inputValue: string) => {
      pendingRef.current = false;
      onChangeRef.current(inputValue);
    }, []),
    delay
  );

  const handleChange = useCallback(
    (newValue: string) => {
      pendingRef.current = true;
      debouncedSetValue(newValue);
      setInnerValue(newValue);
    },
    [debouncedSetValue]
  );

  useEffect(() => {
    if (!pendingRef.current) {
      setInnerValue(value);
    }
  }, [value]);

  return render({
    value: innerValue,
    handleChange,
  });
}

export const DebouncedInput = React.forwardRef(DebouncedInputComponent);
