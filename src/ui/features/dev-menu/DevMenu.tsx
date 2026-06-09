import React from 'react';
import { useStore } from '@store-unit/react';
import {
  Popover,
  PopoverDisclosure,
  PopoverProvider,
  usePopoverStore,
} from 'src/ui/ui-kit/Popover';
import { VStack } from 'src/ui/ui-kit/VStack';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { isMacOS } from 'src/ui/shared/isMacos';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { devForceShowSwapOnboarding } from 'src/ui/pages/SwapForm2/SwapOnboardingDialog/devForceShowStore';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import {
  devMenuStore,
  hasAnyOverride,
  setPriceImpactOverride,
  setReadonlyWallOverride,
  setSimulationOutputDiscrepancy,
  setSimulationStatusOverride,
  setSimulationWarningOverride,
  setUSDisclaimerOverride,
} from './store';
import type {
  PriceImpactOverride,
  ReadonlyWallOverride,
  SimulationOutputDiscrepancy,
  SimulationStatusOverride,
  SimulationWarningOverride,
  USDisclaimerOverride,
} from './store-types';
import * as styles from './DevMenu.module.css';

const PRICE_IMPACT_OPTIONS: { value: PriceImpactOverride; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '3', label: '3%' },
  { value: '7', label: '7%' },
  { value: '20', label: '20%' },
];

const WARNING_OPTIONS: { value: SimulationWarningOverride; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'Red', label: 'Red' },
  { value: 'Yellow', label: 'Yellow' },
  { value: 'Gray', label: 'Gray' },
];

const STATUS_OPTIONS: { value: SimulationStatusOverride; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'failed', label: 'Failed' },
];

const OUTPUT_DISCREPANCY_OPTIONS: {
  value: SimulationOutputDiscrepancy;
  label: string;
}[] = [
  { value: 'off', label: 'Off' },
  { value: '50', label: '50%' },
];

const US_DISCLAIMER_OPTIONS: { value: USDisclaimerOverride; label: string }[] =
  [
    { value: 'off', label: 'Off' },
    { value: 'force-on', label: 'On' },
    { value: 'force-off', label: 'Hide' },
  ];

const READONLY_WALL_OPTIONS: { value: ReadonlyWallOverride; label: string }[] =
  [
    { value: 'off', label: 'Off' },
    { value: 'disabled', label: 'Disabled' },
  ];

function ShortcutHint() {
  const modKey = isMacOS() ? '⌘' : 'Ctrl';
  return (
    <span className={styles.kbd}>
      <span className={styles.kbdKey}>{modKey}</span>
      <span className={styles.kbdPlus}>+</span>
      <span className={styles.kbdKey}>↑</span>
    </span>
  );
}

export function DevMenu() {
  const state = useStore(devMenuStore);
  const active = hasAnyOverride(state);
  const popoverStore = usePopoverStore({ placement: 'top-end' });
  const { preferences, setPreferences } = usePreferences();
  const perpsOnboardingDismissed =
    preferences?.perpsOnboardingDismissed === true;

  return (
    <>
      <KeyboardShortcut
        combination="mod+arrowup"
        onKeyDown={() => popoverStore.toggle()}
        availableDuringInputs={true}
      />
      <PopoverProvider store={popoverStore}>
        <PopoverDisclosure
          aria-label="Open dev menu"
          className={`${styles.trigger} ${active ? styles.triggerActive : ''}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4" />
          </svg>
        </PopoverDisclosure>
        <Popover gutter={8} className={styles.popover}>
          <div className={styles.titleBar}>
            <div className={styles.titleBarLeft}>
              <span className={styles.titleDots}>
                <span className={styles.titleDot} />
                <span className={styles.titleDot} />
                <span className={styles.titleDot} />
              </span>
              <span className={styles.titlePath}>~/zerion/dev-tools</span>
            </div>
            <ShortcutHint />
          </div>
          <div className={styles.body}>
            <div className={styles.prompt}>
              <span className={styles.promptCaret}>$</span>
              <span className={styles.promptText}>devmenu --overrides</span>
              <span className={styles.promptCursor} />
            </div>

            <VStack gap={14}>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>quote</span>
                  <span className={styles.sectionRule} />
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>price_impact</span>
                  <SegmentedControlGroup kind="secondary">
                    {PRICE_IMPACT_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-price-impact"
                        value={option.value}
                        checked={state.priceImpactOverride === option.value}
                        onChange={() => setPriceImpactOverride(option.value)}
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>simulation</span>
                  <span className={styles.sectionRule} />
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>inject_warning</span>
                  <SegmentedControlGroup kind="secondary">
                    {WARNING_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-simulation-warning"
                        value={option.value}
                        checked={
                          state.simulationWarningOverride === option.value
                        }
                        onChange={() =>
                          setSimulationWarningOverride(option.value)
                        }
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>force_status</span>
                  <SegmentedControlGroup kind="secondary">
                    {STATUS_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-simulation-status"
                        value={option.value}
                        checked={
                          state.simulationStatusOverride === option.value
                        }
                        onChange={() =>
                          setSimulationStatusOverride(option.value)
                        }
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>output_discrepancy</span>
                  <SegmentedControlGroup kind="secondary">
                    {OUTPUT_DISCREPANCY_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-simulation-output-discrepancy"
                        value={option.value}
                        checked={
                          state.simulationOutputDiscrepancy === option.value
                        }
                        onChange={() =>
                          setSimulationOutputDiscrepancy(option.value)
                        }
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>disclaimers</span>
                  <span className={styles.sectionRule} />
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>us_disclaimer</span>
                  <SegmentedControlGroup kind="secondary">
                    {US_DISCLAIMER_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-us-disclaimer"
                        value={option.value}
                        checked={state.usDisclaimerOverride === option.value}
                        onChange={() => setUSDisclaimerOverride(option.value)}
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>swap_onboarding</span>
                  <div className={styles.navLinks}>
                    <button
                      type="button"
                      className={styles.navLink}
                      onClick={() => {
                        devForceShowSwapOnboarding();
                        popoverStore.hide();
                      }}
                    >
                      show
                    </button>
                  </div>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>
                    swap_button_onboarding
                  </span>
                  <div className={styles.navLinks}>
                    <button
                      type="button"
                      className={styles.navLink}
                      onClick={() => {
                        setPreferences({
                          oneTapCrossChainSwapOnboardingShown: false,
                        });
                        popoverStore.hide();
                      }}
                    >
                      reset
                    </button>
                  </div>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>readonly_wall</span>
                  <SegmentedControlGroup kind="secondary">
                    {READONLY_WALL_OPTIONS.map((option) => (
                      <SegmentedControlRadio
                        key={option.value}
                        name="dev-menu-readonly-wall"
                        value={option.value}
                        checked={state.readonlyWallOverride === option.value}
                        onChange={() => setReadonlyWallOverride(option.value)}
                      >
                        {option.label}
                      </SegmentedControlRadio>
                    ))}
                  </SegmentedControlGroup>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>onboarding</span>
                  <span className={styles.sectionRule} />
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>perps_onboarding</span>
                  <div className={styles.navLinks}>
                    <button
                      type="button"
                      className={styles.navLink}
                      disabled={!perpsOnboardingDismissed}
                      onClick={() => {
                        setPreferences({ perpsOnboardingDismissed: false });
                      }}
                    >
                      reset (dismissed:{' '}
                      {perpsOnboardingDismissed ? 'yes' : 'no'})
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>navigation</span>
                  <span className={styles.sectionRule} />
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>legacy_forms</span>
                  <div className={styles.navLinks}>
                    <UnstyledLink
                      to="/send-form-old"
                      className={styles.navLink}
                      onClick={() => popoverStore.hide()}
                    >
                      send (old)
                    </UnstyledLink>
                    <UnstyledLink
                      to="/swap-form-old"
                      className={styles.navLink}
                      onClick={() => popoverStore.hide()}
                    >
                      swap (old)
                    </UnstyledLink>
                    <UnstyledLink
                      to="/bridge-form-old"
                      className={styles.navLink}
                      onClick={() => popoverStore.hide()}
                    >
                      bridge
                    </UnstyledLink>
                  </div>
                </div>
              </div>
            </VStack>
          </div>
        </Popover>
      </PopoverProvider>
    </>
  );
}
