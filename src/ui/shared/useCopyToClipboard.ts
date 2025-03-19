import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { copy } from 'src/modules/copy-to-clipboard';
import { useEvent } from './useEvent';

interface Params {
  text?: string;
  onSuccess?: () => void;
}

export const useCopyToClipboard = ({
  text,
  onSuccess = () => null,
}: Params) => {
  const textRef = useRef(text);
  const onSuccessEvent = useEvent(onSuccess);

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

    copy(textRef.current);
    setIsSuccess(true);
    onSuccessEvent();
    cancelSuccessState();
  }, [cancelSuccessState, onSuccessEvent]);

  return {
    handleCopy,
    isSuccess,
  };
};
