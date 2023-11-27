import { useCallback, useEffect, useState } from 'react';

export interface FormErrorDescription {
  name: string;
}

interface FormDescription {
  formError: FormErrorDescription | null;
  valid: boolean;
}

function readFormValidity(form: HTMLFormElement): FormDescription {
  for (const element of form.elements) {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement
    ) {
      if ('name' in element && element.name && !element.validity.valid) {
        return {
          valid: form.checkValidity(),
          formError: { name: element.name },
        };
      }
    }
  }
  return { valid: form.checkValidity(), formError: null };
}

const defaultState = { valid: true, formError: null };
export function useFormValidity({
  formRef,
}: {
  formRef: React.RefObject<HTMLFormElement>;
}) {
  const [validity, setCurrentError] = useState<FormDescription>(defaultState);
  const handleFormChange = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      setCurrentError(readFormValidity(form));
    },
    []
  );
  useEffect(() => {
    const form = formRef.current;
    if (form) {
      setCurrentError(readFormValidity(formRef.current));
      const handleInputValueChange = () => {
        setCurrentError(readFormValidity(form));
      };
      form.addEventListener('customInputValueChange', handleInputValueChange);
      return () => {
        form.removeEventListener(
          'customInputValueChange',
          handleInputValueChange
        );
      };
    }
  }, [formRef]);
  return { validity, handleFormChange };
}
