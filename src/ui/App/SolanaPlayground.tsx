import React from 'react';
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

const keypair = Keypair.generate();
console.log({ keypair });
Object.assign(window, { ethers, Keypair, bs58, bip39, derivePath });

export function SolanaPlayground() {
  return <div>Solana..</div>;
}
