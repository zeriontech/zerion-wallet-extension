import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import debounce from 'lodash/debounce';

interface Params {
  text?: string;
}

export const useCopyToClipboard = ({ text }: Params) => {
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const [isSuccess, setIsSuccess] = useState(false);

  const cancelSuccessState = useMemo(
    () =>
      debounce(() => {
        setIsSuccess(false);
      }, 1000),
    []
  );

  const handleCopy = useCallback(() => {
    if (!textRef.current) {
      return;
    }

    copyToClipboard(textRef.current);
    setIsSuccess(true);
    cancelSuccessState();
  }, [cancelSuccessState]);

  return {
    handleCopy,
    isSuccess,
  };
};
