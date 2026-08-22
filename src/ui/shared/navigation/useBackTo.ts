import { useNavigate } from 'react-router-dom';
import { useEvent } from '../useEvent';

function isTheEntryBehindUs(hashPathname: string) {
  if (!('navigation' in window)) {
    // Firefox has no way to inspect the stack. Callers use this for a view
    // whose normal way in is the very one they're returning to, so assume it.
    return true;
  }
  const { currentEntry } = window.navigation;
  const entries = window.navigation.entries();
  const index = currentEntry?.index ?? -1;
  const previous = index > 0 ? entries[index - 1] : null;
  if (!previous?.url) {
    return false;
  }
  const { hash } = new URL(previous.url);
  return hash.replace(/^#/, '').split('?')[0] === hashPathname;
}

/**
 * Returns to a view that is normally one step behind this one: pops when it
 * really is the entry behind us, and navigates there replacing the current
 * entry when it isn't (a popup reopened straight onto this view, say).
 *
 * Popping is the point. A two-step flow whose second step *pushes* its way back
 * to the first leaves a duplicate entry behind on every round trip, so leaving
 * the flow costs the user one back-click per lap they did inside it.
 */
export function useBackTo({
  hashPathname,
  to,
}: {
  /** Route path of the view being returned to, e.g. `/deposit`. */
  hashPathname: string;
  /** Where to go when that view isn't behind us; may carry a search string. */
  to: string;
}) {
  const navigate = useNavigate();
  return useEvent(() => {
    if (isTheEntryBehindUs(hashPathname)) {
      navigate(-1);
    } else {
      navigate(to, { replace: true });
    }
  });
}
