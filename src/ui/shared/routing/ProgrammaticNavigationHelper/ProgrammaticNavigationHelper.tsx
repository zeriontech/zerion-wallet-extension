import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitter } from '../../events';

export function ProgrammaticNavigationHelper() {
  const navigate = useNavigate();
  useEffect(() => {
    return emitter.on('navigationRequest', ({ pathname }) => {
      navigate(pathname);
    });
  }, [navigate]);
  return null;
}
