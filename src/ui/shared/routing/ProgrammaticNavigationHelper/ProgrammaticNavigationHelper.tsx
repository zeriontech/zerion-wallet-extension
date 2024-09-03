import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitter } from '../../events';

/**
 * TODO: migrate to {const router = createBrowserRouter(...) + <RouterProvider router={router} />}:
 * https://reactrouter.com/en/main/upgrading/v6-data
 */
export function ProgrammaticNavigationHelper() {
  const navigate = useNavigate();
  useEffect(() => {
    return emitter.on('navigationRequest', ({ pathname }) => {
      navigate({ pathname });
    });
  }, [navigate]);
  return null;
}
