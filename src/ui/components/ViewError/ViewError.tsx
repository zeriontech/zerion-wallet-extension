import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import BugIcon from 'jsx:src/ui/assets/bug.svg';
import CopyIcon from 'jsx:src/ui/assets/copy.svg';
import TickIcon from 'jsx:src/ui/assets/check_double.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { openInNewWindow } from 'src/ui/shared/openInNewWindow';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import { useCopyToClipboard } from 'src/ui/shared/useCopyToClipboard';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { WarningIcon } from '../WarningIcon';
import { FillView } from '../FillView';
import { BUG_REPORT_BUTTON_HEIGHT } from '../BugReportButton';
import { useBugReportURL } from '../BugReportButton/useBugReportURL';

const ICON_SIZE = 20;

export function ViewError({
  title = 'Unable to perform the desired action now',
  subtitle = "Please try again. If the issue keeps happening,\ntell us about the bug you've found.",
  error,
}: {
  title?: string;
  subtitle?: string | null;
  error?: Error | null;
}) {
  const navigate = useNavigate();
  const bugReportURL = useBugReportURL();
  const { handleCopy, isSuccess } = useCopyToClipboard({
    text: error?.message,
  });

  return (
    <FillView>
      <VStack
        gap={24}
        style={{
          padding: '24px 16px 108px',
          minHeight: `calc(100vh - ${BUG_REPORT_BUTTON_HEIGHT}px)`,
          alignContent: 'start',
        }}
      >
        <WarningIcon
          kind="notice"
          size={48}
          glow={true}
          outlineStrokeWidth={8}
        />
        <VStack gap={8}>
          <UIText kind="headline/h1">{title}</UIText>
          {subtitle ? (
            <UIText kind="body/regular" style={{ whiteSpace: 'pre-line' }}>
              {subtitle}
            </UIText>
          ) : null}
        </VStack>
        <VStack
          gap={8}
          style={{
            padding: 16,
            border: '1px solid var(--notice-500)',
            borderRadius: 8,
          }}
        >
          <HStack
            gap={24}
            justifyContent="space-between"
            style={{ gridTemplateColumns: '1fr auto' }}
          >
            <UIText kind="body/accent" color="var(--notice-600)">
              Error Details
            </UIText>
            {error?.message ? (
              <UnstyledButton
                onClick={handleCopy}
                style={{ color: 'var(--primary)' }}
                className={helperStyles.hoverUnderline}
              >
                <HStack gap={4} alignItems="center">
                  <UIText kind="small/accent">
                    {isSuccess ? 'Copied to Clipboard' : 'Copy to Clipboard'}
                  </UIText>
                  {isSuccess ? (
                    <TickIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
                  ) : (
                    <CopyIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
                  )}
                </HStack>
              </UnstyledButton>
            ) : null}
          </HStack>
          <UIText kind="small/regular" color="var(--notice-500)">
            {error?.message || "We crashed. And don't know why"}
          </UIText>
        </VStack>
      </VStack>
      <HStack
        gap={8}
        style={{
          padding: '16px 16px 24px',
          position: 'fixed',
          bottom: BUG_REPORT_BUTTON_HEIGHT,
          left: 0,
          right: 0,
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--background)',
        }}
      >
        <Button
          kind="regular"
          onClick={() => {
            navigate('/overview');
            window.location.reload();
          }}
          style={{ paddingInline: 8 }}
        >
          Back to Home
        </Button>
        <Button
          as={UnstyledAnchor}
          onClick={openInNewWindow}
          href={bugReportURL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ paddingInline: 8 }}
        >
          <HStack gap={8} alignItems="center">
            Bug Report
            <BugIcon />
          </HStack>
        </Button>
      </HStack>
    </FillView>
  );
}
