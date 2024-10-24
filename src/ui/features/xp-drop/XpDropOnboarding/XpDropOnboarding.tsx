import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageTop } from 'src/ui/components/PageTop';
import { Frame } from 'src/ui/ui-kit/Frame';
import { XpDropScoring } from './XpDropScoring';

function XpDropRewards() {
  return (
    <PageColumn>
      <NavigationTitle title="Rewards" />
      <PageTop />
      <Frame>Rewards</Frame>
    </PageColumn>
  );
}

function XpDropQuests() {
  return (
    <PageColumn>
      <NavigationTitle title="Quests" />
      <PageTop />
      <Frame>Quests</Frame>
    </PageColumn>
  );
}

function XpDropNewHomeForDna() {
  return (
    <PageColumn>
      <NavigationTitle title="New Home for DNA" />
      <PageTop />
      <Frame>New Home for DNA</Frame>
    </PageColumn>
  );
}

function XpDropLevels() {
  return (
    <PageColumn>
      <NavigationTitle title="Levels" />
      <PageTop />
      <Frame>Levels</Frame>
    </PageColumn>
  );
}

export function XpDropOnboarding() {
  return (
    <Routes>
      <Route path="/" element={<XpDropRewards />} />
      <Route path="/quests" element={<XpDropQuests />} />
      <Route path="/new-home-for-dna" element={<XpDropNewHomeForDna />} />
      <Route path="/levels" element={<XpDropLevels />} />
      <Route path="/scoring" element={<XpDropScoring />} />
    </Routes>
  );
}
