import { ethers } from 'ethers';
import { animated } from 'react-spring';
import groupBy from 'lodash/groupBy';
import { useSubscription } from 'defi-sdk';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMutation, useQuery } from 'react-query';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Background } from 'src/ui/components/Background';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { accountPublicRPCPort, walletPort } from 'src/ui/shared/channels';
import { prepareUserInputSeedOrPrivateKey } from 'src/ui/shared/prepareUserInputSeedOrPrivateKey';
import { Button } from 'src/ui/ui-kit/Button';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import QuestionHintIcon from 'src/ui/assets/question-hint.svg';
import ShieldIcon from 'src/ui/assets/shield.svg';
import CheckmarkCheckedIcon from 'src/ui/assets/checkmark-checked.svg';
import CheckmarkUnCheckedIcon from 'src/ui/assets/checkmark-unchecked.svg';
import {
  DecorativeMessage,
  DecorativeMessageDone,
} from '../components/DecorativeMessage';
import { HStack } from 'src/ui/ui-kit/HStack';
import type { ValidationResult } from 'src/shared/validation/ValidationResult';
import { SeedType } from 'src/shared/SeedType';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { getFirstNMnemonicWallets } from './getFirstNMnemonicWallets';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import {
  Item,
  SurfaceItemButton,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
import { Media } from 'src/ui/ui-kit/Media';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { WalletDisplayName } from 'src/ui/components/WalletDisplayName';
import type { BareWallet } from 'src/shared/types/BareWallet';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PortfolioValue } from 'src/ui/shared/requests/PortfolioValue';
import { NeutralDecimals } from 'src/ui/ui-kit/NeutralDecimals';
import { formatCurrencyToParts } from 'src/shared/units/formatCurrencyValue';
import { NBSP } from 'src/ui/shared/typography';
import { useTransformTrigger } from 'src/ui/components/useTransformTrigger';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { getIndexFromPath } from 'src/shared/wallet/getNextAccountPath';
import debounce from 'lodash/debounce';
import { isTruthy } from 'is-truthy-ts';
import { WithConfetti } from '../components/DecorativeMessage/DecorativeMessage';

function AnimatedCheckmark({ checked }: { checked: boolean }) {
  const { style, trigger } = useTransformTrigger({
    scale: 1.15,
    timing: 100,
  });
  useLayoutEffect(() => {
    if (checked) {
      trigger();
    }
  }, [checked, trigger]);
  if (!checked) {
    return (
      <div>
        <CheckmarkUnCheckedIcon />
      </div>
    );
  } else {
    return (
      <animated.div style={style}>
        <CheckmarkCheckedIcon style={{ color: 'var(--primary)' }} />
      </animated.div>
    );
  }
}

function isValidMnemonic(phrase: string) {
  return ethers.utils.isValidMnemonic(phrase);
}
function isValidPrivateKey(key: string) {
  const prefixedKey = key.startsWith('0x') ? key : `0x${key}`;
  return ethers.utils.isHexString(prefixedKey, 32);
}

function getSeedType(value: string) {
  if (isValidMnemonic(value)) {
    return SeedType.mnemonic;
  } else if (isValidPrivateKey(value)) {
    return SeedType.privateKey;
  } else {
    return null;
  }
}

function validate({
  recoveryInput,
}: {
  recoveryInput: string;
}): ValidationResult {
  if (recoveryInput.trim().split(/\s+/).length > 1) {
    // probably a mnemonic
    if (isValidMnemonic(recoveryInput)) {
      return { valid: true, message: '' };
    } else {
      return { valid: false, message: 'Invalid recovery phrase' };
    }
  } else {
    if (isValidPrivateKey(recoveryInput)) {
      return { valid: true, message: '' };
    } else {
      return { valid: false, message: 'Invalid private key' };
    }
  }
}
function ImportForm({
  onSubmit,
}: {
  onSubmit: (result: { value: string; seedType: SeedType }) => void;
}) {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  return (
    <>
      <form
        style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
        onInput={() => setValidationResult(null)}
        onSubmit={(event) => {
          event.preventDefault();
          const userInput = new FormData(event.currentTarget).get(
            'seedOrPrivateKey'
          ) as string;
          const value = prepareUserInputSeedOrPrivateKey(userInput);
          if (!value) {
            return;
          }
          const validity = validate({ recoveryInput: value });
          setValidationResult(validity);
          if (!validity.valid) {
            return;
          }
          const seedType = getSeedType(value);
          if (seedType == null) {
            throw new Error('Unexpected input value');
          }
          onSubmit({ value, seedType });
        }}
      >
        <VStack gap={4}>
          <textarea
            autoFocus={true}
            name="seedOrPrivateKey"
            required={true}
            rows={14}
            placeholder="Use spaces between words if using a seed phrase"
            style={{
              display: 'block',
              color: 'var(--black)',
              resize: 'vertical',
              backgroundColor: 'var(--neutral-200)',
              padding: '7px 11px',
              border: '1px solid var(--neutral-200)',
              fontSize: 16,
              borderRadius: 8,
            }}
          />
          {validationResult?.valid === false ? (
            <UIText kind="caption/reg" color="var(--negative-500)" role="alert">
              {validationResult.message}
            </UIText>
          ) : null}
        </VStack>
        <VStack gap={16} style={{ marginTop: 'auto' }}>
          <UIText kind="caption/reg" color="var(--neutral-500)">
            <HStack
              gap={4}
              alignItems="center"
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                width: 'max-content',
              }}
            >
              <ShieldIcon />
              <span>Zerion passed security audits</span>
            </HStack>
          </UIText>
          <Button style={{ width: '100%' }}>Import</Button>
        </VStack>
      </form>
    </>
  );
}

enum Step {
  loading,
  done,
}

function PrivateKeyImportFlow({
  address,
  errorMessage,
  onSubmit,
  isSubmitting,
}: {
  address: string | null;
  errorMessage: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <>
      <VStack gap={8}>
        <DecorativeMessage
          text={
            <UIText kind="subtitle/m_reg">
              Hi 👋 We're generating your wallet and making sure it's encrypted
              with your passcode. This should only take a couple of minutes.
            </UIText>
          }
        />
        {address ? (
          <DecorativeMessageDone messageKind="import" address={address} />
        ) : null}
        {errorMessage ? (
          <UIText kind="subtitle/m_reg" color="var(--negative-500)">
            Could not import wallet {errorMessage ? `(${errorMessage})` : null}
          </UIText>
        ) : null}
      </VStack>

      <Button
        style={{ marginTop: 'auto', marginBottom: 16 }}
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Recovering...' : 'Finish'}
      </Button>
    </>
  );
}

function useAllExistingAddresses() {
  const { data: walletGroups } = useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true }
  );
  return useMemo(
    () =>
      walletGroups
        ?.flatMap((group) => group.walletContainer.wallets)
        .map(({ address }) => normalizeAddress(address)),
    [walletGroups]
  );
}

function WalletList({
  wallets,
  existingAddressesSet,
  listTitle,
  showPortfolio,
  values,
  onSelect,
  initialCount,
}: {
  wallets: BareWallet[];
  existingAddressesSet: Set<string>;
  listTitle: React.ReactNode;
  showPortfolio: boolean;
  values: Set<string>;
  onSelect: (value: string) => void;
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount ?? wallets.length);
  return (
    <VStack gap={8}>
      {listTitle ? <UIText kind="small/accent">{listTitle}</UIText> : null}
      <SurfaceList
        items={wallets
          .slice(0, count)
          .map<Item>((wallet) => ({
            key: wallet.address,

            onClick: existingAddressesSet.has(normalizeAddress(wallet.address))
              ? undefined
              : () => onSelect(wallet.address),
            component: (
              <HStack
                gap={8}
                alignItems="center"
                justifyContent="space-between"
                style={{
                  gridTemplateColumns: 'minmax(min-content, 18px) 1fr auto',
                }}
              >
                <UIText
                  kind="body/regular"
                  color="var(--neutral-500)"
                  title={`Derivation path: ${wallet.mnemonic?.path}`}
                  style={{ cursor: 'help' }}
                >
                  {wallet.mnemonic
                    ? getIndexFromPath(wallet.mnemonic.path)
                    : null}
                </UIText>
                <Media
                  image={
                    <WalletIcon
                      address={wallet.address}
                      active={false}
                      iconSize={40}
                    />
                  }
                  text={<WalletDisplayName wallet={wallet} />}
                  vGap={0}
                  detailText={
                    showPortfolio ? (
                      <UIText kind="headline/h3">
                        <PortfolioValue
                          address={wallet.address}
                          render={({ value }) =>
                            value ? (
                              <NeutralDecimals
                                parts={formatCurrencyToParts(
                                  value.total_value,
                                  'en',
                                  'usd'
                                )}
                              />
                            ) : (
                              <span>{NBSP}</span>
                            )
                          }
                        />
                      </UIText>
                    ) : null
                  }
                />
                {existingAddressesSet.has(normalizeAddress(wallet.address)) ? (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Already added
                  </UIText>
                ) : (
                  <span>
                    <AnimatedCheckmark checked={values.has(wallet.address)} />
                  </span>
                )}
              </HStack>
            ),
          }))
          .concat(
            count < wallets.length
              ? [
                  {
                    key: -1,
                    isInteractive: true,
                    pad: false,
                    component: (
                      <SurfaceItemButton
                        onClick={() => setCount((count) => count + 3)}
                      >
                        <UIText kind="body/regular" color="var(--primary)">
                          {count === 0 ? 'Show' : 'Show More'}
                        </UIText>
                      </SurfaceItemButton>
                    ),
                  },
                ]
              : []
          )}
      />
    </VStack>
  );
}

function useStaleTime(value: unknown, staleTime: number) {
  const [isStale, setIsStale] = useState(false);

  const valueRef = useRef(value);
  valueRef.current = value;

  const debouncedRef = useRef<() => void>();
  if (!debouncedRef.current) {
    debouncedRef.current = debounce(() => {
      setIsStale(true);
    }, staleTime);
  }

  useEffect(() => {
    setIsStale(false);
    debouncedRef.current?.();
  }, [value]);
  return { isStale };
}

function AddressImportList({
  wallets,
  activeWallets,
  onSubmit,
}: {
  wallets: BareWallet[];
  activeWallets: Record<string, { active: boolean }>;
  onSubmit: (values: BareWallet[]) => void;
}) {
  const grouped = groupBy(wallets, ({ address }) =>
    activeWallets[normalizeAddress(address)]?.active ? 'active' : 'rest'
  );
  const { active, rest } = grouped as Record<
    'active' | 'rest',
    BareWallet[] | undefined
  >;
  const existingAddresses = useAllExistingAddresses();
  const existingAddressesSet = useMemo(
    () => new Set(existingAddresses),
    [existingAddresses]
  );
  const [values, setValue] = useState<Set<string>>(() => new Set());
  const toggleAddress = useCallback((value: string) => {
    setValue((set) => {
      const newSet = new Set(set);
      if (newSet.has(value)) {
        newSet.delete(value);
        return newSet;
      } else {
        return newSet.add(value);
      }
    });
  }, []);
  return (
    <>
      <PageColumn>
        <PageTop />
        <VStack gap={8}>
          <UIText kind="body/regular">
            We found these wallets associated with your seedphrase
          </UIText>
          <VStack gap={20}>
            {active ? (
              <WalletList
                listTitle="Active wallets"
                wallets={active}
                showPortfolio={true}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleAddress}
              />
            ) : null}
            {rest ? (
              <WalletList
                listTitle="Inactive wallets"
                wallets={rest}
                showPortfolio={false}
                existingAddressesSet={existingAddressesSet}
                values={values}
                onSelect={toggleAddress}
                initialCount={active?.length ? 0 : 3}
              />
            ) : null}
          </VStack>
        </VStack>
        <PageBottom />
      </PageColumn>

      <PageStickyFooter lineColor="var(--neutral-300)">
        <VStack
          style={{
            marginTop: 8,
            textAlign: 'center',
          }}
          gap={8}
        >
          <Button
            disabled={values.size === 0}
            onClick={() => {
              const selectedWallets = wallets.filter((wallet) =>
                values.has(wallet.address)
              );
              onSubmit(selectedWallets);
            }}
          >
            Continue{values.size ? ` (${values.size})` : null}
          </Button>
        </VStack>
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

function OnMount({
  children,
  onMount,
}: React.PropsWithChildren<{ onMount: () => void }>) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;
  useEffect(() => {
    onMountRef.current();
  }, []);
  return children as JSX.Element;
}

function AddressImportMessages({ values }: { values: BareWallet[] }) {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState(() => new Set<React.ReactNode>());
  const navigate = useNavigate();
  const addMessage = (message: React.ReactNode) =>
    setMessages((messages) => new Set(messages).add(message));

  const importMutation = useMutation(
    async (mnemonics: NonNullable<BareWallet['mnemonic']>[]) => {
      await new Promise((r) => setTimeout(r, 1000));
      const data = await walletPort.request('uiImportSeedPhrase', mnemonics);
      await accountPublicRPCPort.request('saveUserAndWallet');
      if (data?.address) {
        await walletPort.request('setCurrentAddress', {
          address: data.address,
        });
      }
    },
    {
      onSuccess() {
        navigate('/overview');
      },
    }
  );
  useEffect(() => {
    const ids: NodeJS.Timeout[] = [];
    const msg = (msg: React.ReactNode, delay: number) =>
      setTimeout(() => addMessage(msg), delay);
    ids.push(
      msg(
        <DecorativeMessage
          text={
            <UIText kind="subtitle/m_reg">
              ⏳ Checking your wallet history on the blockchain...
            </UIText>
          }
        />,
        100
      ),
      msg(
        <DecorativeMessage
          isConsecutive={true}
          text={
            <UIText kind="subtitle/m_reg">
              🔐 Encrypting your wallet with your password...
            </UIText>
          }
        />,
        1200
      ),
      msg(
        <DecorativeMessage
          isConsecutive={false}
          text={
            <UIText kind="headline/h3">
              All done!{' '}
              <span style={{ color: 'var(--primary)' }}>
                Your wallets have been imported 🚀
              </span>
            </UIText>
          }
        />,
        2400
      ),
      msg(
        <OnMount onMount={() => setReady(true)}>
          <WithConfetti>
            <DecorativeMessage
              isConsecutive={true}
              text={
                <VStack gap={8}>
                  <UIText kind="headline/h3">
                    <CheckmarkCheckedIcon
                      style={{
                        color: 'var(--positive-500)',
                        verticalAlign: 'middle',
                      }}
                    />{' '}
                    <span style={{ verticalAlign: 'middle' }}>Congrats!</span>
                  </UIText>
                  <UIText kind="small/regular">Welcome on board</UIText>
                  {values.map((wallet) => (
                    <Media
                      image={
                        <WalletIcon
                          address={wallet.address}
                          active={false}
                          iconSize={32}
                        />
                      }
                      text={
                        <UIText kind="body/regular">
                          <WalletDisplayName wallet={wallet} padding={8} />
                        </UIText>
                      }
                      detailText={null}
                    />
                  ))}
                </VStack>
              }
            />
          </WithConfetti>
        </OnMount>,
        3200
      )
    );
    return () => {
      ids.forEach((id) => clearTimeout(id));
    };
  }, [values]);
  const { style, trigger } = useTransformTrigger({
    scale: 1.1,
    timing: 100,
  });
  useEffect(() => {
    if (ready) {
      trigger();
    }
  }, [ready, trigger]);
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8}>{messages}</VStack>

      <Button
        as={animated.button}
        disabled={!ready || importMutation.isLoading}
        style={{ ...style, marginTop: 'auto', marginBottom: 16 }}
        onClick={() => {
          const mnemonics = values
            .map((wallet) => wallet.mnemonic)
            .filter(isTruthy);
          importMutation.mutate(mnemonics);
        }}
      >
        {importMutation.isLoading ? 'Submitting' : 'Finish'}
      </Button>
      <PageBottom />
    </PageColumn>
  );
}

function AddressImportFlow({
  wallets,
  activeWallets,
}: {
  wallets: BareWallet[];
  activeWallets: Record<string, { active: boolean }>;
}) {
  const [valuesToImport, setValuesToImport] = useState<BareWallet[]>();
  return valuesToImport ? (
    <AddressImportMessages values={valuesToImport} />
  ) : (
    <AddressImportList
      wallets={wallets}
      activeWallets={activeWallets}
      onSubmit={(values) => setValuesToImport(values)}
    />
  );
}

function MnemonicImportView() {
  const { state: locationState } = useLocation();
  const { value: phrase } = locationState as { value: string };
  const [count] = useState(100);
  const { data: wallets } = useQuery(
    `getFirstNMnemonicWallets(${phrase}, ${count})`,
    async () => getFirstNMnemonicWallets({ phrase, n: count }),
    { useErrorBoundary: true, keepPreviousData: true }
  );
  const { value } = useSubscription<
    Record<string, { address: string; active: boolean }>,
    'address',
    'activity'
  >({
    namespace: 'address',
    enabled: Boolean(wallets),
    body: useMemo(
      () => ({
        scope: ['activity'],
        payload: wallets ? { addresses: wallets.map((w) => w.address) } : {},
      }),
      [wallets]
    ),
    keepStaleData: true,
  });
  const { isStale: isStaleValue } = useStaleTime(value, 3000);
  const shouldWaitForValue = value == null && !isStaleValue;
  return (
    <>
      <NavigationTitle title="Wallets Ready to Import" />
      {shouldWaitForValue || wallets == null ? (
        <PageColumn>
          <PageTop />
          <ViewLoading />
          <PageBottom />
        </PageColumn>
      ) : (
        <AddressImportFlow wallets={wallets} activeWallets={value ?? {}} />
      )}
    </>
  );
}

function PrivateKeyImportView() {
  const { state: locationState } = useLocation();
  const { value: privateKey } = locationState as { value: string };
  if (!privateKey) {
    throw new Error(
      'Location state for PrivateKeyImportView is expected to have a value property'
    );
  }
  const navigate = useNavigate();
  const { data, mutate, isIdle, ...importWallet } = useMutation(
    async (input: string) => {
      // addStep(Step.loading)
      await new Promise((r) => setTimeout(r, 1000));
      if (isValidPrivateKey(input)) {
        return walletPort.request('uiImportPrivateKey', input);
      } else {
        throw new Error('Not a private key');
      }
    }
  );
  const importError = importWallet.error ? (importWallet.error as Error) : null;

  useEffect(() => {
    // NOTE:
    // In React.StrictMode this gets called twice >:
    // Creating a ref guard didn't work: the component does not receive the success
    // result from useMutation.
    // I'll this as is, this doesn't break anything atm
    mutate(privateKey);
  }, [privateKey, mutate]);

  if (isIdle) {
    return null;
  }
  return (
    <PageColumn>
      <PageTop />

      <PrivateKeyImportFlow
        address={data?.address ?? null}
        errorMessage={importError?.message ?? null}
        isSubmitting={importWallet.isLoading}
        onSubmit={async () => {
          await accountPublicRPCPort.request('saveUserAndWallet');
          if (data?.address) {
            await walletPort.request('setCurrentAddress', {
              address: data.address,
            });
          }
          navigate('/overview');
        }}
      />
      <PageBottom />
    </PageColumn>
  );
}

function ImportWalletView() {
  const [steps] = useState(() => new Set<Step>());
  const navigate = useNavigate();

  return (
    <>
      <NavigationTitle title="Import Wallet" />

      <Background backgroundKind={steps.size === 0 ? 'white' : 'neutral'}>
        <PageColumn>
          <PageTop />
          <UIText kind="h/5_med">
            Enter Recovery Phrase{' '}
            <QuestionHintIcon
              style={{ color: 'var(--neutral-500)', verticalAlign: 'middle' }}
            />{' '}
            <br />
            or Private Key{' '}
            <QuestionHintIcon
              style={{ color: 'var(--neutral-500)', verticalAlign: 'middle' }}
            />
          </UIText>
          <Spacer height={24}></Spacer>
          <ImportForm
            onSubmit={({ value, seedType }) => {
              if (seedType === SeedType.privateKey) {
                navigate('/get-started/import/private-key', {
                  // NOTE: this is just a precaution;
                  // pass as state to avoid storing sensitive data in the URL
                  state: { value },
                });
              } else if (seedType === SeedType.mnemonic) {
                navigate('/get-started/import/mnemonic', {
                  // NOTE: this is just a precaution;
                  // pass as state to avoid storing sensitive data in the URL
                  state: { value },
                });
              }
            }}
          />
          <PageBottom />
        </PageColumn>
      </Background>
    </>
  );
}

export function ImportWallet() {
  return (
    <Routes>
      <Route path="/" element={<ImportWalletView />} />
      <Route path="/private-key" element={<PrivateKeyImportView />} />
      <Route path="/mnemonic" element={<MnemonicImportView />} />
    </Routes>
  );
}
