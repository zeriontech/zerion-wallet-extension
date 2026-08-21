import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
} from '@ariakit/react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { normalizedIncludes } from 'src/shared/normalizedIncludes';
import type { OnrampCountry } from 'src/modules/zerion-api/types/DepositFlow';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { CountryFlag } from '../shared/country';
import * as styles from './styles.module.css';

/**
 * Split out of the dialog so that closing it discards the search query along
 * with everything else: `Dialog2` unmounts its children, but not the component
 * that renders it, so a query held one level up would survive the close and
 * filter a list whose search box looks empty.
 */
function CountryList({
  countries,
  value,
  onSelect,
  onClose,
}: {
  countries: OnrampCountry[];
  value: string | undefined;
  onSelect: (countryId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  // 200-odd rows deep, the current country is well below the fold on open
  const selectedRowRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return countries;
    }
    return countries.filter(
      (country) =>
        normalizedIncludes(country.name, trimmed) ||
        normalizedIncludes(country.id, trimmed)
    );
  }, [countries, query]);

  return (
    <ComboboxProvider
      open={true}
      focusLoop={true}
      includesBaseElement={true}
      setValue={setQuery}
    >
      <VStack gap={8} style={{ paddingInline: 16, paddingBottom: 16 }}>
        <VStack gap={4} className={styles.stickyHeader}>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Pick the country where your card was issued or your bank account is
            held.
          </UIText>
          <div className={styles.searchWrapper}>
            <SearchIcon role="presentation" className={styles.searchIcon} />
            <Combobox
              autoSelect="always"
              placeholder="Search countries..."
              render={<Input style={{ paddingLeft: 40 }} />}
            />
          </div>
        </VStack>
        <ComboboxList render={<VStack gap={0} />}>
          {filtered.length ? (
            filtered.map((country) => (
              <ComboboxItem
                key={country.id}
                value={`${country.name} ${country.id}`}
                setValueOnClick={false}
                focusOnHover={true}
                className={styles.listRow}
                ref={
                  country.id === value
                    ? (node: HTMLDivElement | null) => {
                        selectedRowRef.current = node;
                      }
                    : undefined
                }
                onClick={() => {
                  onSelect(country.id);
                  onClose();
                }}
              >
                <HStack
                  gap={12}
                  alignItems="center"
                  justifyContent="space-between"
                  style={{ width: '100%', gridTemplateColumns: '1fr auto' }}
                >
                  <HStack gap={12} alignItems="center">
                    <CountryFlag code={country.id} />
                    <UIText kind="body/regular">{country.name}</UIText>
                  </HStack>
                  {country.id === value ? (
                    <CheckIcon
                      style={{
                        width: 20,
                        height: 20,
                        color: 'var(--primary)',
                      }}
                    />
                  ) : null}
                </HStack>
              </ComboboxItem>
            ))
          ) : (
            <div className={styles.emptyState}>
              <UIText kind="small/regular" color="var(--neutral-500)">
                No countries match this search
              </UIText>
            </div>
          )}
        </ComboboxList>
      </VStack>
    </ComboboxProvider>
  );
}

/**
 * Filtering happens here rather than server-side: `supported-countries` returns
 * the whole list in one response and never changes, so there is nothing to
 * debounce or refetch.
 */
export function CountrySelectDialog({
  open,
  onClose,
  countries,
  value,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  countries: OnrampCountry[];
  value: string | undefined;
  onSelect: (countryId: string) => void;
}) {
  return (
    <Dialog2
      open={open}
      onClose={onClose}
      title="Country"
      size="full"
      autoFocusInput={false}
    >
      <CountryList
        countries={countries}
        value={value}
        onSelect={onSelect}
        onClose={onClose}
      />
    </Dialog2>
  );
}
