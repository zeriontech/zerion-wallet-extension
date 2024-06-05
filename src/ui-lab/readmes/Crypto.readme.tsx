import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useBackgroundKind } from 'src/ui/components/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import {
  arrayBufferToBase64,
  createCryptoKey,
  createSalt,
  decrypt,
  encrypt,
} from 'src/modules/crypto';
import { Input } from 'src/ui/ui-kit/Input';
import { Surface } from 'src/ui/ui-kit/Surface';
import { PageTop } from 'src/ui/components/PageTop';
import { PageBottom } from 'src/ui/components/PageBottom';
import CheckmarkCheckedIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { NBSP } from 'src/ui/shared/typography';
import { neutralBackgroundKind } from 'src/ui/components/Background/Background';

type Secret = {
  text: string;
};

const Crypto = () => {
  useBackgroundKind(neutralBackgroundKind);
  const [password, setPassword] = useState('secret');
  const [salt, setSalt] = useState(createSalt());
  const [text, setText] = useState('zerion');
  const [encryptedJSON, setEncryptedJSON] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [_cryptoKey, setCryptoKey] = useState<CryptoKey>();
  const [cryptoKeyRaw, setCryptoKeyRaw] = useState('');
  const [passed, setPassed] = useState<boolean | null>(null);

  const onGenerateSalt = () => setSalt(createSalt());

  const onCreateKey = async () => {
    const key = await createCryptoKey(password, salt);
    setCryptoKey(key);
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    setCryptoKeyRaw(arrayBufferToBase64(rawKey));
  };

  async function test() {
    const secret: Secret = { text };
    const encryptedJSON = await encrypt(password, secret);
    setEncryptedJSON(encryptedJSON);
    const decrypted = await decrypt<Secret>(password, encryptedJSON);
    setDecryptedText(decrypted.text);
    setPassed(text === decrypted.text);
  }

  const { mutate: testMutate, isLoading } = useMutation({
    mutationFn: () => test(),
  });
  useEffect(() => {
    testMutate();
  }, [testMutate]);

  return (
    <PageColumn>
      <PageTop />
      <VStack gap={16}>
        {isLoading ? (
          <UIText kind="body/accent">Running...</UIText>
        ) : passed === true ? (
          <HStack gap={8}>
            <CheckmarkCheckedIcon style={{ color: 'var(--positive-500)' }} />
            <UIText kind="body/accent" color="var(--positive-500)">
              Pass
            </UIText>
          </HStack>
        ) : passed === false ? (
          <HStack gap={8}>
            <div
              style={{
                borderRadius: '50%',
                height: 24,
                width: 24,
                backgroundColor: 'var(--negative-500)',
              }}
            />
            <UIText kind="body/accent" color="var(--negative-500)">
              Fail
            </UIText>
          </HStack>
        ) : (
          <UIText kind="body/accent" color="var(--positive-500)">
            {NBSP}
          </UIText>
        )}
        <VStack gap={4}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Text
          </UIText>
          <Input
            style={{ backgroundColor: 'var(--white)' }}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus={true}
            name="text"
            placeholder="text"
            required={true}
          />
        </VStack>
        <VStack gap={4}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Password
          </UIText>
          <Input
            style={{ backgroundColor: 'var(--white)' }}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            name="password"
            placeholder="password"
            required={true}
          />
        </VStack>
        <VStack gap={8}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Salt
          </UIText>
          <UIText
            kind="body/regular"
            style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            {salt}
          </UIText>
          <Button onClick={onGenerateSalt}>Generate salt</Button>
        </VStack>
        <VStack gap={8}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Encrypted JSON
          </UIText>
          <Surface padding="10px 12px">
            <UIText
              kind="small/regular"
              color="var(--neutral-700)"
              style={{
                fontFamily: 'monospace',
                textAlign: 'center',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {encryptedJSON}
            </UIText>
          </Surface>
        </VStack>
        <VStack gap={8}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Decrypted text
          </UIText>
          <Surface padding="10px 12px">
            <UIText
              kind="small/regular"
              color="var(--neutral-700)"
              style={{
                fontFamily: 'monospace',
                textAlign: 'center',
              }}
            >
              {decryptedText}
            </UIText>
          </Surface>
        </VStack>
        <Button onClick={() => testMutate()}>Test</Button>
        <VStack gap={8}>
          <Surface padding="10px 12px">
            <UIText
              kind="small/regular"
              color="var(--neutral-700)"
              style={{
                fontFamily: 'monospace',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {cryptoKeyRaw ? cryptoKeyRaw : 'Crypto key is not created yet'}
            </UIText>
          </Surface>
          <Button onClick={onCreateKey}>Create key</Button>
        </VStack>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
};

export const readme: Readme = {
  id: 'crypto',
  name: 'Crypto',
  description: null,
  component: () => (
    <WindowSize style={{ height: 800 }}>
      <Crypto />
    </WindowSize>
  ),
};
