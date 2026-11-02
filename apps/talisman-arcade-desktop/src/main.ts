import path from 'path';
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  ipcMain,
  shell,
  BrowserWindowConstructorOptions,
} from 'electron';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import type { NewWindowOptions } from '@arcanewizards/sigil/frontend' with {
  'resolution-mode': 'require',
};
import type { SigilAppInstance } from '@arcanewizards/sigil' with {
  'resolution-mode': 'require',
};
import {
  runTalismanArcadeServer,
  type AppApi,
} from '@arcanewizards/talisman-arcade';
import { productName } from '../package.json';

const logger = pino(
  {
    level: 'info',
  },
  pino.multistream([
    // Use multistream to prevent errors when logging during shutdown
    { stream: pinoPretty() },
  ]),
);

type ActiveWindow = {
  shouldPreventClose: boolean;
};

const activeWindows = new Map<BrowserWindow, ActiveWindow>();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const isSquirrelStartup = require('electron-squirrel-startup');
const hasSingleInstanceLock =
  isSquirrelStartup || app.requestSingleInstanceLock();
const shouldStartApp = !isSquirrelStartup && hasSingleInstanceLock;

if (!shouldStartApp) {
  app.quit();
}

app.setAppUserModelId('com.arcanewizards.timecode-toolbox-desktop');

type WindowModes = 'default';

const WINDOW_MODES: Record<WindowModes, BrowserWindowConstructorOptions> = {
  default: {
    width: 1200,
    height: 600,
    minHeight: 500,
    minWidth: 400,
  },
};

const isWindowMode = (mode: string | undefined): mode is WindowModes => {
  return !!mode && mode in WINDOW_MODES;
};

const createWindow = (
  url: string | URL,
  windowOptions: Partial<BrowserWindowConstructorOptions> = WINDOW_MODES.default,
) => {
  const win = new BrowserWindow({
    ...windowOptions,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      autoplayPolicy: 'no-user-gesture-required',
    },
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: 16, y: 16 },
        }
      : {}),
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    createWindow(url);
    return {
      action: 'deny',
    };
  });

  win.loadURL(url.toString());
  const activeWindow: ActiveWindow = {
    shouldPreventClose: true,
  };
  activeWindows.set(win, activeWindow);
  win.on('close', (e) => {
    if (activeWindow.shouldPreventClose) {
      // Run close handlers in the browser window and prevent immediately closing
      win.webContents.send('window-close');
      e.preventDefault();
    }
  });
  return win;
};

let server: SigilAppInstance<AppApi> | null = null;
let windowUrl: URL | null = null;

const focusWindow = (win: BrowserWindow) => {
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
};

const focusOrCreateMainWindow = () => {
  if (windowUrl === null) {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      focusWindow(win);
    }
    return;
  }

  for (const win of BrowserWindow.getAllWindows()) {
    if (win.webContents.getURL() === windowUrl.toString()) {
      focusWindow(win);
      return;
    }
  }

  createWindow(windowUrl);
};

const quit = async () => {
  if (!server) {
    app.quit();
    return;
  }
  await server.shutdown();
  // Prevent intercepting window close events
  for (const activeWindow of activeWindows.values()) {
    activeWindow.shouldPreventClose = false;
  }
  app.quit();
};

if (shouldStartApp) {
  app.whenReady().then(async () => {
    ipcMain.on('open-url', (event, url: string) => {
      shell.openExternal(url);
    });
    ipcMain.on(
      'open-window',
      (event, url: string, options: NewWindowOptions) => {
        if (options?.canUseExisting) {
          for (const win of BrowserWindow.getAllWindows()) {
            if (win.webContents.getURL() === url) {
              win.focus();
              return;
            }
          }
        }
        createWindow(
          url,
          isWindowMode(options.mode) ? WINDOW_MODES[options.mode] : undefined,
        );
      },
    );
    ipcMain.on('confirm-close', (event, message: string) => {
      dialog
        .showMessageBox({
          type: 'warning',
          buttons: ['Close', 'Cancel'],
          title: 'Confirm Close',
          message,
        })
        .then((response) => {
          if (response.response === 0) {
            const win = BrowserWindow.fromWebContents(event.sender);
            const activeWindow = win ? activeWindows.get(win) : null;
            if (activeWindow) {
              activeWindow.shouldPreventClose = false;
            }
            if (win) {
              win.destroy();
            }
          }
        });
    });

    ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0];
    });

    ipcMain.handle('open-dev-tools', async () => {
      // Open dev tools for every window
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.openDevTools({ mode: 'bottom' });
      });
    });

    const url = () => {
      if (!windowUrl) {
        throw new Error('Window URL not set yet');
      }
      return windowUrl;
    };

    const APP_MENU = Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: 'About',
            role: 'about',
          },
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: () => void createWindow(url()),
          },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: quit,
          },
        ],
      },
      {
        role: 'editMenu',
      },
      {
        label: 'Window',
        submenu: [
          {
            role: 'resetZoom',
          },
          {
            role: 'zoomIn',
          },
          {
            role: 'zoomOut',
          },
        ],
      },
    ]);

    Menu.setApplicationMenu(APP_MENU);

    const dataDirectory = app.getPath('userData');

    const arcane = runTalismanArcadeServer({
      logger,
      appProps: {
        dataDirectory,
      },
      toolkitOptions: {
        entrypointJsFile: path.resolve(__dirname, './frontend.js'),
      },
      title: productName,
      edition: 'desktop',
    });
    server = arcane;

    let hasOpenedFirstWindow = false;

    arcane.addEventListener('windowUrlChange', (u) => {
      windowUrl = u;
      if (!hasOpenedFirstWindow) {
        hasOpenedFirstWindow = true;
        createWindow(url());
      }
      for (const win of BrowserWindow.getAllWindows()) {
        try {
          const winUrl = new URL(win.webContents.getURL());
          if (winUrl.hostname !== u.hostname || winUrl.port !== u.port) {
            const newUrl = new URL(winUrl);
            newUrl.port = u.port;
            newUrl.hostname = u.hostname;
            logger.info(`Updating URL for window: ${winUrl} -> ${newUrl}`);
            win.loadURL(newUrl.toString());
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars,unused-imports/no-unused-vars
        } catch (_err) {
          // Ignore windows that don't have a valid URL
        }
      }
    });
  });

  app.on('activate', () => {
    focusOrCreateMainWindow();
  });

  app.on('second-instance', focusOrCreateMainWindow);

  app.on('window-all-closed', () => {
    // Subscribing to this event prevents the app from quitting
    // when all windows are closed
    // we do this to manually handle quitting the app and ensuring everything
    // is shut down as required
    quit();
  });
}
