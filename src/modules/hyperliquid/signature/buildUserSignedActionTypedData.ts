import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import {
  HYPERLIQUID_SIGNATURE_CHAIN_ID,
  HYPERLIQUID_USER_SIGNED_DOMAIN,
} from '../constants';
import type {
  ExchangeApproveBuilderFeeAction,
  ExchangeSetAbstractionAction,
  ExchangeWithdraw3Action,
  UserSignedAction,
} from '../actions/types';

const EIP712_DOMAIN_TYPES = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

function buildApproveBuilderFeeTypedData(
  action: ExchangeApproveBuilderFeeAction
): TypedData {
  const primaryType = 'HyperliquidTransaction:ApproveBuilderFee';
  return {
    types: {
      EIP712Domain: EIP712_DOMAIN_TYPES,
      [primaryType]: [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'maxFeeRate', type: 'string' },
        { name: 'builder', type: 'address' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    primaryType,
    domain: {
      ...HYPERLIQUID_USER_SIGNED_DOMAIN,
      chainId: HYPERLIQUID_SIGNATURE_CHAIN_ID,
    },
    message: {
      hyperliquidChain: action.hyperliquidChain,
      maxFeeRate: action.maxFeeRate,
      builder: action.builder,
      nonce: action.nonce,
    },
  };
}

function buildSetAbstractionTypedData(
  action: ExchangeSetAbstractionAction
): TypedData {
  const primaryType = 'HyperliquidTransaction:UserSetAbstraction';
  return {
    types: {
      EIP712Domain: EIP712_DOMAIN_TYPES,
      [primaryType]: [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'user', type: 'address' },
        { name: 'abstraction', type: 'string' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    primaryType,
    domain: {
      ...HYPERLIQUID_USER_SIGNED_DOMAIN,
      chainId: HYPERLIQUID_SIGNATURE_CHAIN_ID,
    },
    message: {
      hyperliquidChain: action.hyperliquidChain,
      user: action.user,
      abstraction: action.abstraction,
      nonce: action.nonce,
    },
  };
}

function buildWithdraw3TypedData(action: ExchangeWithdraw3Action): TypedData {
  const primaryType = 'HyperliquidTransaction:Withdraw';
  return {
    types: {
      EIP712Domain: EIP712_DOMAIN_TYPES,
      [primaryType]: [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'time', type: 'uint64' },
      ],
    },
    primaryType,
    domain: {
      ...HYPERLIQUID_USER_SIGNED_DOMAIN,
      chainId: HYPERLIQUID_SIGNATURE_CHAIN_ID,
    },
    message: {
      hyperliquidChain: action.hyperliquidChain,
      destination: action.destination,
      amount: action.amount,
      time: action.time,
    },
  };
}

export function buildUserSignedActionTypedData(
  action: UserSignedAction
): TypedData {
  switch (action.type) {
    case 'approveBuilderFee':
      return buildApproveBuilderFeeTypedData(action);
    case 'userSetAbstraction':
      return buildSetAbstractionTypedData(action);
    case 'withdraw3':
      return buildWithdraw3TypedData(action);
  }
}
