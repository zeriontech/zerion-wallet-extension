import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WindowSize } from 'src/ui-lab/components/WindowSize';
import type { Readme } from 'src/ui-lab/types';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Background } from 'src/ui/components/Background';
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

type Secret = {
  text: string;
};

const Crypto = () => {
  const [password, setPassword] = useState('secret');
  const [salt, setSalt] = useState(createSalt());
  const [text, setText] = useState('zerion');
  const [encryptedJSON, setEncryptedJSON] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [_cryptoKey, setCryptoKey] = useState<CryptoKey>();
  const [cryptoKeyRaw, setCryptoKeyRaw] = useState('');

  const onGenerateSalt = () => setSalt(createSalt());

  const onCreateKey = async () => {
    const key = await createCryptoKey(password, salt);
    setCryptoKey(key);
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    setCryptoKeyRaw(arrayBufferToBase64(rawKey));
  };
  const onEncrypt = async () => {
    const secret: Secret = { text };
    const result = await encrypt(password, secret);
    setEncryptedJSON(result);
  };
  const onDecrypt = async () => {
    const secret = await decrypt<Secret>(password, encryptedJSON);
    setDecryptedText(secret.text);
  };

  return (
    <Background backgroundKind="neutral">
      <PageColumn>
        <VStack gap={16}>
          <VStack gap={4}>
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
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
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
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
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
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
            <Surface padding="10px 12px">
              <UIText
                kind="body/s_reg"
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
          <VStack gap={8}>
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
              Encrypted JSON
            </UIText>
            <Surface padding="10px 12px">
              <UIText
                kind="body/s_reg"
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
            <Button onClick={onEncrypt}>Encrypt</Button>
          </VStack>
          <VStack gap={8}>
            <UIText kind="subtitle/s_reg" color="var(--neutral-500)">
              Decrypted text
            </UIText>
            <Surface padding="10px 12px">
              <UIText
                kind="body/s_reg"
                color="var(--neutral-700)"
                style={{
                  fontFamily: 'monospace',
                  textAlign: 'center',
                }}
              >
                {decryptedText}
              </UIText>
            </Surface>
            <Button onClick={onDecrypt}>Decrypt</Button>
          </VStack>
        </VStack>
      </PageColumn>
    </Background>
  );
};

export const readme: Readme = {
  name: 'Crypto',
  description: null,
  component: () => (
    <MemoryRouter
      initialEntries={[
        `/crypto?${new URLSearchParams({
          origin: 'https://zerion.io',
          windowId: '1',
        })}`,
      ]}
    >
      <WindowSize>
        <Crypto />
      </WindowSize>
    </MemoryRouter>
  ),
};
