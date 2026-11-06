import { startTalismanLabServerFrontend, TalismanLabBrowserContext } from '.';

declare global {
  interface Window {
    BROWSER_CONTEXT?: TalismanLabBrowserContext;
  }
}

startTalismanLabServerFrontend(window.BROWSER_CONTEXT);
