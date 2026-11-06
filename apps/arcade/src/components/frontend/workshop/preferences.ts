import {
  BrowserPreferencesDefinition,
  createBrowserPreferencesHook,
} from '@arcanewizards/sigil/frontend/preferences';
import { SIGIL_COLOR } from '@arcanewizards/sigil/frontend/styling';
import z from 'zod';
import { API_APP_ID } from '../../../constants';

const BROWSER_PREFERENCES_KEY = `${API_APP_ID}-preferences`;

const BROWSER_PREFERENCES = z.object({
  color: SIGIL_COLOR,
});

type BrowserPreferences = z.infer<typeof BROWSER_PREFERENCES>;

const TALISMAN_LAB_PREFERENCES: BrowserPreferencesDefinition<BrowserPreferences> =
  {
    key: BROWSER_PREFERENCES_KEY,
    zodType: BROWSER_PREFERENCES,
    defaultValue: {
      color: 'red',
    },
  };

export const useBrowserPreferences = createBrowserPreferencesHook(
  TALISMAN_LAB_PREFERENCES,
);
