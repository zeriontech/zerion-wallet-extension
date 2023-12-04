import React from 'react';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { apostrophe } from 'src/ui/shared/typography';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function RpcUrlHelp() {
  return (
    <PageColumn>
      <NavigationTitle title="RPC URLs" />
      <PageTop />
      <VStack gap={16}>
        <UIText kind="body/accent">
          It{apostrophe}s your choice to update the RPC URL or not. You can
          always switch back to the default RPC URL in your network settings if
          you prefer.
        </UIText>
        <UIText kind="headline/h3">What is RPC URL?</UIText>
        <UIText kind="body/regular">
          RPC stands for Remote Procedure Call. In the context of a Web3 wallet,
          it{apostrophe}s a method that allows your wallet to interact and
          communicate with blockchain networks. RPC URL is an 'address' that
          your wallet uses to talk to the specific network.
        </UIText>
        <UIText kind="headline/h3">Why Update Your RPC URL?</UIText>
        <UIText kind="body/regular">
          As networks evolve and improve, new RPC URLs may be released.
        </UIText>
        <UIText kind="headline/h3">Potential Risks</UIText>
        <UIText kind="body/regular">
          While updating the RPC URL is generally safe, it{apostrophe}s crucial
          to ensure that the new URL from a trusted source. Using an incorrect
          or untrusted RPC URL can lead to performance issues and might even
          expose your wallet to security risks.
        </UIText>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
