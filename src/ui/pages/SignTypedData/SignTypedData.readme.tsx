import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { SignTypedData } from './SignTypedData';

const samples: Array<{ typedDataRaw: string }> = [
  {
    typedDataRaw:
      '{"types":{"SetMasterContractApproval":[{"name":"warning","type":"string"},{"name":"user","type":"address"},{"name":"masterContract","type":"address"},{"name":"approved","type":"bool"},{"name":"nonce","type":"uint256"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"BentoBox V1","chainId":"137","verifyingContract":"0x0319000133d3ada02600f0875d2cf03d442c3367"},"primaryType":"SetMasterContractApproval","message":{"warning":"Give FULL access to funds in (and approved to) BentoBox?","user":"0x42b9df65b219b3dd36ff330a4dd8f327a6ada990","masterContract":"0xc5017be80b4446988e8686168396289a9a62668e","approved":true,"nonce":"0"}}',
  },
  {
    typedDataRaw:
      '{"domain":{"chainId":"1","name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}',
  },
  {
    typedDataRaw:
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"verifyingContract","type":"address"},{"name":"chainId","type":"uint256"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"0x3083A9c26582C01Ec075373A8327016A15c1269B","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}',
  },
  {
    typedDataRaw:
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"dYdX","verifyingContract":"0x92d6c1e31e14520e676a687f0a93788b716beff5","chainId":1,"version":"1"},"message":{"deadline":1688319162,"nonce":0,"spender":"0x1111111254eeb25477b68fb85ed929f73a960582","owner":"0x3083a9c26582c01ec075373a8327016a15c1269b","value":"115792089237316195423570985008687907853269984665640564039457584007913129639935"}}',
  },
];

const sampleOrigins = [
  'https://app.zerion.io/',
  'https://app.uniswap.org/',
  'https://app.sushi.com/',
];

export const readme: Readme = {
  id: 'signTypedData',
  name: 'SignTypedData',
  description: null,
  component: () => (
    <div
      style={{
        display: 'grid',
        gridGap: 12,
        gridTemplateColumns: 'repeat(5, minmax(360px, 700px))',
        overflowX: 'auto',
      }}
    >
      {samples.map((sample, index) => (
        <MemoryRouter
          key={index}
          initialEntries={[
            `/signTypedData?${new URLSearchParams({
              origin: sampleOrigins[index % sampleOrigins.length],
              windowId: String(index),
              typedDataRaw: sample.typedDataRaw,
            })}`,
          ]}
        >
          <WindowSize>
            <ViewSuspense>
              <SignTypedData />
            </ViewSuspense>
          </WindowSize>
        </MemoryRouter>
      ))}
    </div>
  ),
};
