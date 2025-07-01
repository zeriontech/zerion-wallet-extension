import { useNavigate } from 'react-router-dom';
import { useEvent } from '../useEvent';
import { getBackOrHome } from './getBackOrHome';

export function useGoBack(home?: string) {
  const navigate = useNavigate();
  return useEvent(() => navigate(getBackOrHome(home) as number));
}
