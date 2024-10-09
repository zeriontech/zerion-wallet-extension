import React from 'react';
import { getWalletDisplayName } from 'src/ui/shared/getWalletDisplayName';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import cx from 'classnames';
import * as styles from './styles.module.css';

export function ReferrerLink({
  handle,
  address,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  handle: string | null;
  address: string;
}) {
  const displayName = getWalletDisplayName({
    name: handle,
    address,
  });

  return (
    <TextAnchor
      href={`https://app.zerion.io/${address}/overview`}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(styles.referrerLink, className)}
      {...props}
    >
      {displayName}
    </TextAnchor>
  );
}
