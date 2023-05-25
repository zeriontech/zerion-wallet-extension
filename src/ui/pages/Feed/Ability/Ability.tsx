import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Tag } from 'src/ui/ui-kit/Tag';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TextAnchor } from 'src/ui/ui-kit/TextAnchor';
import type { WalletAbility } from 'src/shared/types/Daylight';

export function Ability({
  ability,
  mode,
  status,
  loading,
}: {
  ability: WalletAbility;
  mode: 'full' | 'compact';
  status: 'dismissed' | 'completed' | null;
  loading?: boolean;
}) {
  const { singleAddress } = useAddressParams();

  const dateString = useMemo(() => {
    if (ability.closeAt) {
      return `${ability.isClosed ? 'Closed' : 'Closes'} ${dayjs(
        ability.closeAt
      ).fromNow()}`;
    }
    if (ability.openAt) {
      return `Opened ${dayjs(ability.openAt).fromNow()}`;
    }
    if (ability.createdAt) {
      return `Created ${dayjs(ability.createdAt).fromNow()}`;
    }
    return null;
  }, [ability]);

  const dateTitle = useMemo(() => {
    if (ability.closeAt) {
      return `${ability.isClosed ? 'Closed' : 'Closes'} ${dayjs(
        ability.closeAt
      )}`;
    }
    if (ability.openAt) {
      return `Opened ${dayjs(ability.openAt)}`;
    }
    if (ability.createdAt) {
      return `Created ${dayjs(ability.createdAt)}`;
    }
    return undefined;
  }, [ability]);

  return (
    <VStack gap={8}>
      <VStack gap={12}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Tag>{ability.type.toUpperCase()}</Tag>
          {ability.supplier ? (
            <Tag>{ability.supplier.name.toUpperCase()}</Tag>
          ) : null}
          {status || loading ? (
            <Tag kind={status === 'completed' ? 'positive' : 'negative'}>
              {status === 'completed'
                ? 'COMPLETED'
                : status === 'dismissed'
                ? 'DISMISSED'
                : null}
            </Tag>
          ) : null}
        </div>
        <UIText
          kind="headline/h2"
          style={
            mode === 'compact'
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {ability.title}
        </UIText>
      </VStack>
      <HStack gap={16} justifyContent="space-between" alignItems="center">
        <VStack gap={8}>
          {ability.requirements.map((requirement, index) => (
            <HStack gap={8} alignItems="center" key={index}>
              {requirement.type === 'onAllowlist' ? (
                <DoubleCheckIcon style={{ color: 'var(--neutral-600)' }} />
              ) : requirement.community.imageUrl ? (
                <img
                  src={requirement.community.imageUrl}
                  width={20}
                  height={20}
                  style={{ borderRadius: 4 }}
                />
              ) : null}
              {requirement.type === 'onAllowlist' ? (
                <UIText kind="small/accent" color="var(--neutral-600)">
                  On the allowlist
                </UIText>
              ) : requirement.community.currencyCode ? (
                <UIText kind="small/accent" color="var(--neutral-600)">
                  Hold{' '}
                  {mode === 'full' ? (
                    <TextAnchor
                      href={`https://app.zerion.io/tokens/${requirement.community.contractAddress}?address=${singleAddress}}`}
                      target="_blank"
                    >
                      ${requirement.community.currencyCode.toUpperCase()}
                    </TextAnchor>
                  ) : (
                    `$${requirement.community.currencyCode.toUpperCase()}`
                  )}
                </UIText>
              ) : (
                <UIText
                  kind="small/accent"
                  color="var(--neutral-600)"
                >{`Hold ${requirement.community.title}`}</UIText>
              )}
            </HStack>
          ))}
        </VStack>
        {dateString ? (
          <UIText
            kind="small/accent"
            color={
              ability.isClosed ? 'var(--negative-500)' : 'var(--neutral-600)'
            }
            title={dateTitle}
          >
            {dateString}
          </UIText>
        ) : null}
      </HStack>
      {mode === 'compact' ? (
        <UIText
          kind="body/regular"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ability.description}
        </UIText>
      ) : (
        <UIText kind="body/regular" style={{ whiteSpace: 'pre-line' }}>
          <VStack gap={0}>
            {ability.description.split('\\n').map((item, index) => (
              <p key={index} style={{ marginBlock: 0 }}>
                {item}
              </p>
            ))}
          </VStack>
        </UIText>
      )}
    </VStack>
  );
}
