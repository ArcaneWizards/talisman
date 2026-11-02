import { CoreComponents } from '@arcanejs/react-toolkit';
import {
  runSigilApp,
  SigilAppInstance,
  SIGIL_COMPONENTS,
  getSigilServerAssets,
  SigilServerAssets,
} from '@arcanewizards/sigil';
import { ToolkitAdditionalFiles, ToolkitOptions } from '@arcanejs/toolkit';
import pino from 'pino';
import { AppApi, createApp, TalismanLabAppProps } from './app';
import { C } from './components/backend';
import { version } from '../package.json';
import { AppEdition } from '@arcanewizards/apis';
import { readFile } from 'fs/promises';
import { LOGO_STATIC_URL_PATH, LOGO_URL_PATH } from './components/proto';

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
    additionalFiles: () =>
      ({
        ...getSigilServerAssets(),
        [LOGO_URL_PATH]: async () => ({
          content: await readFile(
            require.resolve('@arcanewizards/talisman-lab/assets/logo-animated.svg'),
          ),
          contentType: 'image/svg+xml',
        }),
        [LOGO_STATIC_URL_PATH]: async () => ({
          content: await readFile(
            require.resolve('@arcanewizards/talisman-lab/assets/logo-static.svg'),
          ),
          contentType: 'image/svg+xml',
        }),
      }) satisfies SigilServerAssets & ToolkitAdditionalFiles,
  });
