import { useNavigate, useSearchParams } from 'react-router-dom';
import { phishingDefencePort, windowPort } from 'src/ui/shared/channels';
import { invariant } from 'src/shared/invariant';
import { usePhishingDefenceStatus } from './usePhishingDefenceStatus';

export function usePhishingDefenceProtection() {
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const origin = params.get('origin');
  const windowId = params.get('windowId');

  const { data } = usePhishingDefenceStatus(origin || '');

  if (origin && data?.status === 'phishing' && !data.isWhitelisted) {
    invariant(windowId, 'windowId get-parameter is required');
    phishingDefencePort.request('blockOriginWithWarning', { origin });
    windowPort.reject(windowId);
    navigate(-1);
  }
}
