import React, { useEffect, useState } from 'react';
import { useBackgroundKind } from 'src/ui/components/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import {
  useGlobalPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import {
  APPROVE_AND_TRADE_EXPERIMENT,
  ONRAMP_EXPERIMENT_NAME,
} from 'src/modules/statsig/statsig.client';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { Button } from 'src/ui/ui-kit/Button';
import { Frame } from 'src/ui/ui-kit/Frame';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { UnstyledInput } from 'src/ui/ui-kit/UnstyledInput';
import { VStack } from 'src/ui/ui-kit/VStack';

const EXPERIMENT_NAMES = [
  ONRAMP_EXPERIMENT_NAME,
  APPROVE_AND_TRADE_EXPERIMENT,
  'extension-entry_point_premium_purchase',
] as const;

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--neutral-300)',
  borderRadius: 8,
  width: '100%',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 160,
  fontFamily: 'monospace',
  fontSize: 12,
  resize: 'vertical',
};

function JsonEditor({
  label,
  value,
  onSave,
}: {
  label: string;
  value: unknown;
  onSave: (parsed: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(text);
      onSave(parsed);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Frame style={{ padding: 16 }}>
      <VStack gap={8}>
        <UIText kind="body/accent">{label}</UIText>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          style={textareaStyle}
        />
        {error ? (
          <UIText kind="caption/regular" color="var(--negative-500)">
            {error}
          </UIText>
        ) : null}
        <Button kind="primary" size={36} onClick={handleSave}>
          {saved ? 'Saved!' : `Save ${label}`}
        </Button>
      </VStack>
    </Frame>
  );
}

export function StatsigOverrides() {
  const { globalPreferences, setGlobalPreferences } = useGlobalPreferences();
  const { preferences, setPreferences } = usePreferences();
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
      <NavigationTitle title="Dev Menu" />
      <PageTop />
      <VStack gap={16}>
        <UIText kind="body/accent">Statsig Overrides</UIText>
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
              <select
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select experiment...</option>
                {EXPERIMENT_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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

        <UIText kind="body/accent">Preferences</UIText>
        <JsonEditor
          label="Preferences"
          value={preferences}
          onSave={(parsed) => setPreferences(parsed)}
        />

        <UIText kind="body/accent">Global Preferences</UIText>
        <JsonEditor
          label="Global Preferences"
          value={globalPreferences}
          onSave={(parsed) => setGlobalPreferences(parsed)}
        />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
