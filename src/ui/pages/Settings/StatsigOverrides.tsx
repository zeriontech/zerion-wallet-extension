import React, { useState } from 'react';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { VStack } from 'src/ui/ui-kit/VStack';

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--neutral-300)',
  borderRadius: 8,
  width: '100%',
};

export function StatsigOverrides() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  useBackgroundKind({ kind: 'white' });

  const overrides = globalPreferences?.statsigOverrides ?? {};

  const [experimentName, setExperimentName] = useState('');
  const [groupName, setGroupName] = useState('');

  const handleAdd = () => {
    if (!experimentName.trim()) {
      return;
    }
    const newOverrides = {
      ...overrides,
      [experimentName.trim()]: {
        group: groupName.trim() || 'test',
        group_name: groupName.trim() || 'test',
      },
    };
    setGlobalPreferences({ statsigOverrides: newOverrides });
    queryClient.invalidateQueries([
      'getStatsigExperiment',
      experimentName.trim(),
    ]);
    setExperimentName('');
    setGroupName('');
  };

  const handleRemove = (name: string) => {
    const { [name]: _, ...rest } = overrides;
    setGlobalPreferences({ statsigOverrides: rest });
    queryClient.invalidateQueries(['getStatsigExperiment', name]);
  };

  return (
    <PageColumn>
      <NavigationTitle title="Statsig Overrides" />
      <PageTop />
      <VStack gap={16}>
        <UIText kind="small/regular" color="var(--neutral-500)">
          Override Statsig experiment values locally. Changes take effect
          immediately.
        </UIText>
        {Object.entries(overrides).length > 0 ? (
          <Frame style={{ padding: 16 }}>
            <VStack gap={12}>
              {Object.entries(overrides).map(([name, value]) => (
                <HStack
                  key={name}
                  gap={8}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <VStack gap={2} style={{ minWidth: 0, flex: 1 }}>
                    <UIText
                      kind="small/accent"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </UIText>
                    <UIText kind="caption/regular" color="var(--neutral-500)">
                      group_name: {value.group_name ?? 'null'}
                    </UIText>
                  </VStack>
                  <UnstyledButton
                    onClick={() => handleRemove(name)}
                    style={{ color: 'var(--negative-500)', flexShrink: 0 }}
                  >
                    <UIText kind="small/accent">Remove</UIText>
                  </UnstyledButton>
                </HStack>
              ))}
            </VStack>
          </Frame>
        ) : null}
        <Frame style={{ padding: 16 }}>
          <VStack gap={12}>
            <VStack gap={4}>
              <UIText kind="small/accent">Experiment Name</UIText>
              <UnstyledInput
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                placeholder="e.g. extension-approve_and_trade_in_1_action"
                style={inputStyle}
              />
            </VStack>
            <VStack gap={4}>
              <UIText kind="small/accent">Group Name</UIText>
              <UnstyledInput
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. test or control"
                style={inputStyle}
              />
            </VStack>
            <Button
              kind="primary"
              size={36}
              onClick={handleAdd}
              disabled={!experimentName.trim()}
            >
              Add Override
            </Button>
          </VStack>
        </Frame>
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
