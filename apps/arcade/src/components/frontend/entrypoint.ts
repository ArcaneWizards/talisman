import {
  startTalismanArcadeServerFrontend,
  TalismanArcadeBrowserContext,
} from '.';

declare global {
  interface Window {
    BROWSER_CONTEXT?: TalismanArcadeBrowserContext;
  }
}

startTalismanArcadeServerFrontend(window.BROWSER_CONTEXT);
