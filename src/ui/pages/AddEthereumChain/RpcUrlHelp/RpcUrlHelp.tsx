import React from 'react';
import { NavigationBar } from 'src/ui/components/NavigationBar';
import { PageTop } from 'src/ui/components/PageTop';
import { Surface } from 'src/ui/ui-kit/Surface';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function RpcUrlHelp() {
  return (
    <>
      <NavigationBar title="RPC URLs" />
      <PageTop />
      <Surface padding={16}>
        <VStack gap={16}>
          <UIText kind="body/accent">
            It's your choice to update the RPC URL or not. You can always switch
            back to the default RPC URL in your network settings if you prefer.
          </UIText>
          <UIText kind="headline/h3">What is RPC URL?</UIText>
          <UIText kind="body/regular">
            RPC stands for Remote Procedure Call. In the context of a Web3
            wallet, it's a method that allows your wallet to interact and
            communicate with blockchain networks. RPC URL is an 'address' that
            your wallet uses to talk to the specific network.
          </UIText>
          <UIText kind="headline/h3">Why Update Your RPC URL?</UIText>
          <UIText kind="body/regular">
            As networks evolve and improve, new RPC URLs may be released.
          </UIText>
          <UIText kind="headline/h3">Potential Risks</UIText>
          <UIText kind="body/regular">
            While updating the RPC URL is generally safe, it's crucial to ensure
            that the new URL from a trusted source. Using an incorrect or
            untrusted RPC URL can lead to performance issues and might even
            expose your wallet to security risks.
          </UIText>
        </VStack>
      </Surface>
    </>
  );
}
