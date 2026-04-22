import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { useBackgroundKind } from 'src/ui/components/Background';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { StickyBottomPanel } from 'src/ui/ui-kit/BottomPanel';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledAnchor } from 'src/ui/ui-kit/UnstyledAnchor';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import type { ChangelogEntry, ChangelogItem } from './changelog-data';
import { changelog, latestChangelogVersion } from './changelog-data';
import * as styles from './WhatsNew.module.css';

const SECTION_CONFIG = {
  new: { label: 'New', color: 'var(--positive-500)' },
  improvements: { label: 'Improved', color: 'var(--primary)' },
  fixes: { label: 'Fixed', color: 'var(--notice-500)' },
} as const;

function ItemRow({ item }: { item: ChangelogItem }) {
  return (
    <li className={styles.itemRow}>
      <span className={styles.itemDash}>–</span>
      <span className={styles.itemContent}>
        <UIText
          as="span"
          kind={item.highlight ? 'small/accent' : 'small/regular'}
          color={item.highlight ? 'var(--black)' : 'var(--neutral-700)'}
        >
          {item.text}
        </UIText>
        {item.link ? (
          <Link to={item.link.to} className={styles.badge}>
            <UIText
              as="span"
              inline={true}
              kind="caption/accent"
              color="var(--primary)"
            >
              {item.link.label}
            </UIText>
            <span
              className={styles.badgeArrow}
              style={{ color: 'var(--primary)' }}
            >
              ›
            </span>
          </Link>
        ) : null}
      </span>
    </li>
  );
}

function Section({
  type,
  items,
}: {
  type: 'new' | 'improvements' | 'fixes';
  items: ChangelogItem[];
}) {
  const config = SECTION_CONFIG[type];
  return (
    <VStack gap={4}>
      <HStack gap={5} alignItems="center">
        <div
          className={styles.sectionDot}
          style={{ backgroundColor: config.color }}
        />
        <UIText kind="caption/accent" color={config.color}>
          {config.label}
        </UIText>
      </HStack>
      <ul className={styles.itemList} style={{ display: 'grid', gap: 4 }}>
        {items.map((item) => (
          <ItemRow key={item.text} item={item} />
        ))}
      </ul>
    </VStack>
  );
}

function TimelineSeparator() {
  return (
    <div className={styles.timelineConnector}>
      <div className={styles.timelineLine} />
      <div className={styles.timelineDot} />
      <div className={styles.timelineLine} />
    </div>
  );
}

function ReleaseCard({ entry }: { entry: ChangelogEntry }) {
  const sections: Array<{
    type: 'new' | 'improvements' | 'fixes';
    items: ChangelogItem[];
  }> = [];

  if (entry.new?.length) {
    sections.push({ type: 'new', items: entry.new });
  }
  if (entry.improvements?.length) {
    sections.push({ type: 'improvements', items: entry.improvements });
  }
  if (entry.fixes?.length) {
    sections.push({ type: 'fixes', items: entry.fixes });
  }

  return (
    <div>
      <HStack
        gap={8}
        alignItems="baseline"
        justifyContent="space-between"
        className={styles.versionHeader}
      >
        <UIText kind="body/accent">v{entry.version}</UIText>
        <UIText kind="caption/regular" color="var(--neutral-500)">
          {entry.date}
        </UIText>
      </HStack>
      <div className={styles.releaseCard}>
        <VStack gap={10}>
          {entry.image ? (
            <img
              src={entry.image.src}
              alt={entry.image.alt}
              className={styles.releaseImage}
            />
          ) : null}
          {sections.map((section) => (
            <Section
              key={section.type}
              type={section.type}
              items={section.items}
            />
          ))}
        </VStack>
      </div>
    </div>
  );
}

export function WhatsNew() {
  useBackgroundKind({ kind: 'white' });
  const { setGlobalPreferences } = useGlobalPreferences();

  useEffect(() => {
    setGlobalPreferences({ lastVisitedChangelog: latestChangelogVersion });
  }, [setGlobalPreferences]);

  return (
    <PageColumn>
      <NavigationTitle title="What's New" />
      <PageTop />
      <div className={styles.page}>
        <VStack gap={0}>
          {changelog.map((entry, index) => (
            <React.Fragment key={entry.version}>
              {index > 0 ? <TimelineSeparator /> : null}
              <ReleaseCard entry={entry} />
            </React.Fragment>
          ))}
        </VStack>
      </div>
      <Spacer height={16} />
      <PageBottom />
      <StickyBottomPanel>
        <VStack gap={0} style={{ padding: 16 }}>
          <UnstyledAnchor
            className={styles.beamerLink}
            href="https://app.getbeamer.com/zerion/en?category=extension"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button as="span" kind="primary" style={{ width: '100%' }}>
              View all updates on Beamer
            </Button>
          </UnstyledAnchor>
        </VStack>
      </StickyBottomPanel>
    </PageColumn>
  );
}
