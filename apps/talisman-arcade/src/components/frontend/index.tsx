import { FrontendComponentRenderer } from '@arcanejs/toolkit-frontend/types';
import {
  BaseBrowserContext,
  startSigilFrontend,
  createBrowserMediaSession,
} from '@arcanewizards/sigil/frontend';
import { isTalismanArcadeComponent, NAMESPACE } from '../proto';
import { TalismanArcadeRoot } from './workshop/root';
import { LicenseGate } from './workshop/license';

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
