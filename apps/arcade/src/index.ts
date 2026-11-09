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
import { AppApi, createApp, TalismanArcadeAppProps } from './app';
import { C } from './components/backend';
import { version } from '../package.json';
import { AppEdition } from '@arcanewizards/apis';
import { readFile } from 'fs/promises';
import {
  LOGO_STATIC_URL_PATH,
  LOGO_URL_PATH,
  TALISMAN_LOGO_URL_PATH,
} from './components/proto';

export type { AppApi };

export type TalismanArcadeOptions = {
  logger: pino.Logger;
  appProps: TalismanArcadeAppProps;
  toolkitOptions?: Omit<Partial<ToolkitOptions>, 'logger'>;
  title: string;
  edition: AppEdition;
};

export const runTalismanArcadeServer = ({
  logger,
  appProps,
  toolkitOptions,
  title,
  edition,
}: TalismanArcadeOptions): SigilAppInstance<AppApi> =>
  runSigilApp<AppApi, TalismanArcadeAppProps>({
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
        [TALISMAN_LOGO_URL_PATH]: async () => ({
          content: await readFile(
            require.resolve('@talisman-midi/assets/logo-static.svg'),
          ),
          contentType: 'image/svg+xml',
        }),
        [LOGO_URL_PATH]: async () => ({
          content: await readFile(
            require.resolve('@talisman-midi/assets/arcade-logo-animated.svg'),
          ),
          contentType: 'image/svg+xml',
        }),
        [LOGO_STATIC_URL_PATH]: async () => ({
          content: await readFile(
            require.resolve('@talisman-midi/assets/arcade-logo-static.svg'),
          ),
          contentType: 'image/svg+xml',
        }),
      }) satisfies SigilServerAssets & ToolkitAdditionalFiles,
  });
