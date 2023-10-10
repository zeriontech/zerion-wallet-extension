import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackOrHome } from 'src/ui/shared/navigation/getBackOrHome';
import { BackButton } from '../BackButton';

export function NavigationBackButton() {
  const navigate = useNavigate();
  return <BackButton onClick={() => navigate(getBackOrHome() as number)} />;
}
