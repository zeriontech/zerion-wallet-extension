import path from 'path';
import {
  test as baseTest,
  chromium,
  type BrowserContext,
} from '@playwright/test';
import type { TestWallet } from 'e2e/fixtures/types';
import { onboardExistingWallet } from 'e2e/fixtures/pages/onboarding';
import { testWallets } from 'e2e/fixtures/constants';
import { SeedType } from 'src/shared/SeedType';

const extensionPath = path.resolve(process.cwd(), 'dist');

interface Config {
  headless?: boolean;
  devtools?: boolean;

  password?: string;
  onboarding?: {
    /**
     *
     */
    auto?: boolean;
    /**
     * Whether to use private key or mnemonic phrase during the initial onboarding.
     * @default SeedType.privateKey
     */
    seedType?: SeedType;
    /**
     * The test wallet to be used during the initial onboarding.
     * This wallet will be automatically imported as the first wallet during the onboarding flow.
     * @default testWallets.alice
     */
    wallet?: TestWallet;
  };
}

const DEFAULT_BROWSER_ARGS = [
  // Disable Chrome's native first run experience.
  '--no-first-run',
  // Disables client-side phishing detection
  '--disable-client-side-phishing-detection',
  // Disable some built-in extensions that aren't affected by '--disable-extensions'
  '--disable-component-extensions-with-background-pages',
  // Disable installation of default apps
  '--disable-default-apps',
  // Disables the Discover feed on NTP
  '--disable-features=InterestFeedContentSuggestions',
  // Disables Chrome translation, both the manual option and
  // the popup prompt when a page with differing language is detected.
  '--disable-features=Translate',
  // Hide scrollbars from screenshots.
  '--hide-scrollbars',
  // Mute any audio
  '--mute-audio',
  // Disable the default browser check, do not prompt to set it as such
  '--no-default-browser-check',
  // Skip first run wizards
  '--no-first-run',
  // Avoids blue bubble "user education" nudges
  // (eg., "… give your browser a new look", Memory Saver)
  '--ash-no-nudges',
  // Disable the 2023+ search engine choice screen
  '--disable-search-engine-choice-screen',
  // Avoid the startup dialog for "Do you want the application “Chromium.app” to accept incoming network connections?".
  // Also disables the Chrome Media Router which creates background networking activity to discover cast targets.
  // A superset of disabling DialMediaRouteProvider.
  '--disable-features=MediaRoute',
  // Use mock keychain on Mac to prevent the blocking permissions dialog about
  // "Chrome wants to use your confidential information stored in your keychain"
  '--use-mock-keychain',
  // Disable various background network services, including extension updating,
  // safe browsing service, upgrade detector, translate, UMA
  '--disable-background-networking',
  // Disable crashdump collection (reporting is already disabled in Chromium)
  '--disable-breakpad',
  // Don't update the browser 'components' listed at chrome://components/
  '--disable-component-update',
  // Disables Domain Reliability Monitoring, which tracks whether the browser has
  // difficulty contacting Google-owned sites and uploads reports to Google.
  '--disable-domain-reliability',
  // Disables autofill server communication.
  // This feature isn't disabled via other 'parent' flags.
  '--disable-features=AutofillServerCommunicatio',
  '--disable-features=CertificateTransparencyComponentUpdate',
  // Disable syncing to a Google account
  '--disable-sync',
  // Used for turning on Breakpad crash reporting in a debug environment where
  // crash reporting is typically compiled but disabled.
  // Disable the Chrome Optimization Guide and networking with its service API
  '--disable-features=OptimizationHints',
  // A weaker form of disabling the MediaRouter feature. See that flag's details.
  '--disable-features=DialMediaRouteProvider',
  // Don't send hyperlink auditing pings
  '--no-pings',
  // Ensure the side panel is visible.
  // This is used for testing the side panel feature.
  '--enable-features=SidePanelUpdates',
];

function createBrowserArgs(headless: boolean) {
  return [
    ...DEFAULT_BROWSER_ARGS,
    headless ? '--headless=new' : '',
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ].filter((arg) => Boolean(arg));
}

const getPopupFile = () => {
  /* eslint-disable-next-line security/detect-non-literal-require -- extensionPath is defined in this file*/
  const extensionManifest = require(path.join(extensionPath, '/manifest.json'));
  return extensionManifest.action.default_popup;
};

export type ExtensionPopupUrl = `chrome-extension://${string}`;
export type ExtensionManifestUrl = `chrome-extension://${string}/manifest.json`;

export interface TestContext {
  context: BrowserContext;
  extensionId: string;
  extensionPopupUrl: ExtensionPopupUrl;
  extensionManifestUrl: ExtensionManifestUrl;
}

interface Options {
  password: string;
}

interface Fixtures {
  onboardingWallet: TestWallet;
}

// Allows quick toggling between headless/headed mode in dev env
const RUN_HEADED_IN_DEV = true;

export function createExtensionTest(testConfig?: Config) {
  return baseTest.extend<TestContext & Fixtures & Options>({
    // eslint-disable-next-line no-empty-pattern
    context: async ({}, use) => {
      // Determine headless mode:
      // - in CI: always run headed
      // - in dev: use RUN_HEADED_IN_DEV value unless overridden by testConfig
      const headless =
        !process.env.CI && (testConfig?.headless ?? !RUN_HEADED_IN_DEV);
      const context = await chromium.launchPersistentContext('', {
        headless,
        devtools: Boolean(testConfig?.devtools),
        channel: 'chrome',
        args: createBrowserArgs(headless),
      });
      await use(context);
      await context.close();
    },
    extensionId: async ({ context }, use) => {
      let [background] = context.serviceWorkers();
      if (!background) {
        background = await context.waitForEvent('serviceworker');
      }

      const extensionId = background.url().split('/')[2];
      await use(extensionId);
    },
    extensionPopupUrl: async ({ extensionId }, use) => {
      await use(`chrome-extension://${extensionId}/${getPopupFile()}`);
    },
    extensionManifestUrl: async ({ extensionId }, use) => {
      await use(`chrome-extension://${extensionId}/manifest.json`);
    },

    // Options

    password: [testConfig?.password ?? '123123', { option: true }],

    // Fixtures

    onboardingWallet: [
      async ({ context, password }, use) => {
        const wallet = testConfig?.onboarding?.wallet ?? testWallets.alice;
        const seedType =
          testConfig?.onboarding?.seedType ?? SeedType.privateKey;
        await onboardExistingWallet(context, { wallet, seedType, password });
        await use(wallet);
      },
      { auto: testConfig?.onboarding?.auto !== false },
    ],
  });
}
