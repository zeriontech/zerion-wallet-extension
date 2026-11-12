import React, { useMemo } from 'react';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { prepareForHref } from 'src/ui/shared/prepareForHref';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';

/**
 * Who is asking the wallet to sign: the wallet's own UI, a website (linked by
 * hostname), or an origin that is not a web page.
 */
export function RequestInitiator({ origin }: { origin: string }) {
  const originForHref = useMemo(() => prepareForHref(origin), [origin]);
  if (origin === INTERNAL_ORIGIN) {
    return <>Zerion</>;
  }
  if (!originForHref) {
    return <>Unknown Initiator</>;
  }
  return (
    <TextAnchor href={originForHref.href} target="_blank" rel="noopener noreferrer">
      {originForHref.hostname}
    </TextAnchor>
  );
}
