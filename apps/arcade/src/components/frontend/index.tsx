import { FrontendComponentRenderer } from '@arcanejs/toolkit-frontend/types';
import {
  BaseBrowserContext,
  startSigilFrontend,
  createBrowserMediaSession,
} from '@arcanewizards/sigil/frontend';
import { isTalismanArcadeComponent, NAMESPACE } from '../proto';
import { TalismanArcadeRoot } from './arcade/root';
import { LicenseGate } from './arcade/license';
import { MainMenu } from './arcade/games/main-menu';
import { FXPlayground } from './arcade/games/fx-playground';
import { TapAMole } from './arcade/games/tap-a-mole';
import { ScreenSaver } from './arcade/games/screensaver';

export type TalismanArcadeBrowserContext = BaseBrowserContext;

export const talismanArcadeFrontendComponents =
  (): FrontendComponentRenderer => ({
    namespace: NAMESPACE,
    render: (info) => {
      if (!isTalismanArcadeComponent(info)) {
        throw new Error(`Cannot render component ${info.namespace}`);
      }

      switch (info.component) {
        case 'talisman-arcade-root':
          return <TalismanArcadeRoot info={info} />;
        case 'license-gate':
          return <LicenseGate info={info} />;
        case 'main-menu':
          return <MainMenu />;
        case 'fx-playground':
          return <FXPlayground />;
        case 'tap-a-mole':
          return <TapAMole info={info} />;
        case 'screensaver':
          return <ScreenSaver />;
      }
    },
  });

export const startTalismanArcadeServerFrontend = (
  browser?: TalismanArcadeBrowserContext | null,
) => {
  startSigilFrontend<TalismanArcadeBrowserContext>({
    browser,
    appRenderers: [talismanArcadeFrontendComponents()],
    loadingState: () => (
      <div style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
        Loading...
      </div>
    ),
  });
};

declare global {
  interface Window {
    startTalismanArcadeServerFrontend?: typeof startTalismanArcadeServerFrontend;
    createBrowserMediaSession?: typeof createBrowserMediaSession;
  }
}

window.startTalismanArcadeServerFrontend = startTalismanArcadeServerFrontend;
window.createBrowserMediaSession = createBrowserMediaSession;
