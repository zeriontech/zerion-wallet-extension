import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import DoubleCheckIcon from 'jsx:src/ui/assets/check_double.svg';
import { VStack } from 'src/ui/ui-kit/VStack';
import { Tag } from 'src/ui/ui-kit/Tag';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
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
      <VStack gap={mode === 'compact' ? 8 : 16}>
        <VStack gap={12}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag>{ability.type.toUpperCase()}</Tag>
            {ability.supplier ? (
              <Tag>{ability.supplier.name.toUpperCase()}</Tag>
            ) : null}
            {mode === 'full' && (status || loading) ? (
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
            <HStack gap={8} alignItems="center">
              {ability.reason.type === 'allowlist' ? (
                <DoubleCheckIcon style={{ color: 'var(--neutral-600)' }} />
              ) : ability.reason.imageUrl ? (
                <img
                  src={ability.reason.imageUrl}
                  width={20}
                  height={20}
                  style={{ borderRadius: 4 }}
                  alt={ability.title}
                />
              ) : null}
              <UIText kind="small/accent" color="var(--neutral-600)">
                {ability.reason.text}
              </UIText>
            </HStack>
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
      </VStack>
      {mode === 'compact' ? (
        <VStack gap={16}>
          {ability.imageUrl ? (
            <img
              alt={ability.title}
              src={ability.imageUrl}
              style={{
                width: '100%',
                maxHeight: 160,
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
          ) : null}
          <UIText
            kind="body/regular"
            style={{
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {ability.description}
          </UIText>
        </VStack>
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
