import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { RiskDisclosureBlock } from '../Blocks/RiskDisclosureBlock';
import * as s from './styles.module.css';

/**
 * Loading placeholder for the deposit form. The data-dependent regions (the
 * input fieldset and the output card) are recreated as neutral-100 divs that
 * mirror the geometry of the real content in `DepositFormBody`. The static
 * informational blocks (settle-time disclosure, risk disclosure) are rendered
 * as-is since they carry no loading state.
 */
export function DepositFormSkeleton() {
  return (
    <VStack gap={24} className={s.root}>
      <div className={s.formContainer}>
        {/* Input card — mirrors FormFieldset inside .inputCard */}
        <div className={s.inputCard}>
          <div style={{ padding: 16 }}>
            <VStack gap={6} style={{ width: '100%' }}>
              {/* Title row: "Pay with" / quick amounts */}
              <HStack
                gap={16}
                justifyContent="space-between"
                alignItems="center"
                style={{ height: 20 }}
              >
                <div className={s.skeleton} style={{ width: 56, height: 16 }} />
                <div className={s.skeleton} style={{ width: 96, height: 16 }} />
              </HStack>
              {/* Main row: asset icon + symbol / amount */}
              <HStack
                gap={16}
                justifyContent="space-between"
                alignItems="center"
                style={{ height: 32 }}
              >
                <HStack gap={8} alignItems="center">
                  <div
                    className={s.skeletonCircle}
                    style={{ width: 32, height: 32 }}
                  />
                  <div
                    className={s.skeleton}
                    style={{ width: 72, height: 24 }}
                  />
                </HStack>
                <div className={s.skeleton} style={{ width: 80, height: 28 }} />
              </HStack>
              {/* Description row: balance / secondary value */}
              <HStack
                gap={16}
                justifyContent="space-between"
                alignItems="center"
                style={{ height: 20 }}
              >
                <div
                  className={s.skeleton}
                  style={{ width: 112, height: 16 }}
                />
                <div className={s.skeleton} style={{ width: 56, height: 16 }} />
              </HStack>
            </VStack>
          </div>
        </div>

        {/* Output card — mirrors .outputCard (USDC on Hyperliquid) */}
        <div className={s.outputCard}>
          <div className={s.outputIconWrapper}>
            <div
              className={s.skeletonCircle}
              style={{ width: 32, height: 32 }}
            />
          </div>
          <VStack gap={2}>
            <div className={s.skeleton} style={{ width: 48, height: 18 }} />
            <div className={s.skeleton} style={{ width: 84, height: 14 }} />
          </VStack>
          <div style={{ marginLeft: 'auto' }}>
            <div className={s.skeleton} style={{ width: 56, height: 18 }} />
          </div>
        </div>
      </div>

      <UIText
        kind="caption/regular"
        color="var(--neutral-600)"
        className={s.disclosure}
      >
        Funds may take a few minutes to settle on Hyperliquid.
      </UIText>
      <RiskDisclosureBlock />
    </VStack>
  );
}
