import { prepareComponents } from '@arcanejs/react-toolkit';
import { TalismanArcadeRoot } from './talisman-arcade-root';
import { LicenseGate } from './license-gate';
import { NAMESPACE } from '../proto';
import { MainMenu } from './main-menu';
import { TapAMole } from './tap-a-mole';
import { ScreenSaver } from './screensaver';
import { FxPlayground } from './fx-playground';
import { FourInARow } from './four-in-a-row';

export const C = prepareComponents(NAMESPACE, {
  TalismanArcadeRoot,
  LicenseGate,
  FourInARow,
  FxPlayground,
  MainMenu,
  ScreenSaver,
  TapAMole,
});
