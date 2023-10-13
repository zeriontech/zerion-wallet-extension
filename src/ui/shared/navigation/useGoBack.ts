import { useNavigate } from 'react-router-dom';
import { useEvent } from '../useEvent';
import { getBackOrHome } from './getBackOrHome';

export function useGoBack() {
  const navigate = useNavigate();
  return useEvent(() => navigate(getBackOrHome() as number));
}
