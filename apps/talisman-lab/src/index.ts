import { CoreComponents } from '@arcanejs/react-toolkit';
import {
  runSigilApp,
  SigilAppInstance,
  SIGIL_COMPONENTS,
} from '@arcanewizards/sigil';
import { ToolkitOptions } from '@arcanejs/toolkit';
import pino from 'pino';
import { AppApi, createApp, TalismanLabAppProps } from './app';
import { C } from './components/backend';
import { version } from '../package.json';
import { AppEdition } from '@arcanewizards/apis';

export type { AppApi };

export type TalismanLabOptions = {
  logger: pino.Logger;
  appProps: TalismanLabAppProps;
  toolkitOptions?: Omit<Partial<ToolkitOptions>, 'logger'>;
  title: string;
  edition: AppEdition;
};

export const runTalismanLabServer = ({
  logger,
  appProps,
  toolkitOptions,
  title,
  edition,
}: TalismanLabOptions): SigilAppInstance<AppApi> =>
  runSigilApp<AppApi, TalismanLabAppProps>({
    logger,
    title,
    version,
    edition,
    appProps,
    toolkitOptions: {
      ...toolkitOptions,
      clockSync: {
        pingIntervalMs: 1000,
      },
    },
    createApp,
    componentNamespaces: [CoreComponents, SIGIL_COMPONENTS, C],
  });
