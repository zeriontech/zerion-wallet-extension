import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useNavigationState<T = string>(param: string, defaultValue: T) {
  const navigate = useNavigate();
  const location = useLocation();

  const setState = useCallback(
    (value: T) => {
      const nextState = { ...(location.state || {}), [param]: value };
      navigate('.', { replace: true, state: nextState });
    },
    [location, navigate, param]
  );

  const value =
    ((location.state as Record<string, unknown>)?.[param] as T) || defaultValue;

  return [value, setState] as [T, (value: T) => void];
}
