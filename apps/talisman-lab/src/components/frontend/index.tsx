import { FrontendComponentRenderer } from '@arcanejs/toolkit-frontend/types';
import {
  BaseBrowserContext,
  startSigilFrontend,
  createBrowserMediaSession,
} from '@arcanewizards/sigil/frontend';
import { isTalismanLabComponent, NAMESPACE } from '../proto';
import { TalismanLabRoot } from './workshop/root';

export type TalismanLabBrowserContext = BaseBrowserContext;

export const manaWorkshopFrontendComponents =
  (): FrontendComponentRenderer => ({
    namespace: NAMESPACE,
    render: (info) => {
      if (!isTalismanLabComponent(info)) {
        throw new Error(`Cannot render component ${info.namespace}`);
      }

      switch (info.component) {
        case 'mana-workshop-root':
          return <TalismanLabRoot info={info} />;
      }
    },
  });

export const startTalismanLabServerFrontend = (
  browser?: TalismanLabBrowserContext | null,
) => {
  startSigilFrontend<TalismanLabBrowserContext>({
    browser,
    appRenderers: [manaWorkshopFrontendComponents()],
    loadingState: () => (
      <div style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
        Loading...
      </div>
    ),
  });
};

declare global {
  interface Window {
    startTalismanLabServerFrontend?: typeof startTalismanLabServerFrontend;
    createBrowserMediaSession?: typeof createBrowserMediaSession;
  }
}

window.startTalismanLabServerFrontend = startTalismanLabServerFrontend;
window.createBrowserMediaSession = createBrowserMediaSession;
