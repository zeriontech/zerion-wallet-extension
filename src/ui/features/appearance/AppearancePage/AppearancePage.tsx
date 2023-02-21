import { useStore } from '@store-unit/react';
import React from 'react';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Radio } from 'src/ui/ui-kit/Radio';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { ItemLabel } from 'src/ui/ui-kit/SurfaceList/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ThemePreference, preferenceStore } from '../preference-store';

const preferenceStrings = {
  [ThemePreference.light]: 'Always Light',
  [ThemePreference.dark]: 'Always Dark',
  [ThemePreference.system]: 'System',
};

export function AppearancePage() {
  const { mode } = useStore(preferenceStore);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    preferenceStore.setState({
      mode: Number(event.currentTarget.value),
    });
  };
  return (
    <PageColumn>
      <PageTop />
      <VStack gap={8}>
        <SurfaceList
          items={[
            ThemePreference.light,
            ThemePreference.system,
            ThemePreference.dark,
          ].map((preference, index) => ({
            key: index,
            isInteractive: true,
            pad: false,
            component: (
              <ItemLabel>
                <UIText
                  kind="body/regular"
                  color={mode === preference ? 'var(--primary)' : undefined}
                >
                  <HStack gap={8} alignItems="center">
                    <Radio
                      name="preference"
                      value={preference}
                      checked={mode === preference}
                      onChange={handleChange}
                    />
                    <span>{preferenceStrings[preference]}</span>
                  </HStack>
                </UIText>
              </ItemLabel>
            ),
          }))}
        />
      </VStack>
      <PageBottom />
    </PageColumn>
  );
}
