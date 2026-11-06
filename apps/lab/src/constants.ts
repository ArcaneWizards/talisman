import type {
  UpdateBannerStrings,
  UpdateDetailsStrings,
} from '@arcanewizards/sigil/frontend/updates';

export const TALISMAN_LAB_APP_NAME = 'Talisman MIDI Lab';

export const API_APP_ID = 'talisman-lab';

export const HELP_AND_SUPPORT_URL = 'https://arcanewizards.com/discord';

export const SOURCE_CODE_URL = 'https://github.com/ArcaneWizards/talisman';

export const STRINGS = {
  title: TALISMAN_LAB_APP_NAME,
  debugger: 'Debug Tools & Log',
  connectionError: `Disconnected from ${TALISMAN_LAB_APP_NAME} Server`,
  reconnect: 'Reconnect',
  openInNewWindow: 'Open in new window',
  toggle: (text: string) => `Toggle ${text}`,
  close: (text: string) => `Close ${text}`,
  acceptLicense: 'Accept License',
  license: 'License & About',
  licensePrompt: (title: string) =>
    `Please review and accept the ${title} to use ${TALISMAN_LAB_APP_NAME}`,
  licenseLastUpdated: (date: string) => `Last updated: ${date}`,
  sourceCode: 'Source Code',
  helpAndSupport: 'Get Help & Support',
  general: {
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  settings: {
    title: 'Settings',
    animatedLogo: 'Animated Logo',
  },
  updates: {
    banner: {
      updateAvailable: (current: string, latest: string) =>
        `Version ${latest} is available! You are currently on version ${current}.`,
      download: 'Download',
      details: 'Details',
    } satisfies UpdateBannerStrings,
    details: {
      title: 'Update Details',
      close: 'Close',
    } satisfies UpdateDetailsStrings,
    settingsLabel: 'Automatically check for updates',
    settingsDetails: `When enabled, the app will automatically check for updates periodically and display a message when a new version is available.`,
    lastChecked: (time: string) => `Last checked: ${time}`,
  },
} as const;
