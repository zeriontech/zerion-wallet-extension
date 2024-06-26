import type { ExternallyOwnedAccount } from './AccountContainer';
import type { MaskedSignerObject, SignerObject } from './SignerObject';

// TODO: rename BareWallet to SignerWallet?
export interface BareWallet extends ExternallyOwnedAccount, SignerObject {}

export interface MaskedBareWallet
  extends ExternallyOwnedAccount,
    MaskedSignerObject {}
