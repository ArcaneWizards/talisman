import { prepareComponents } from '@arcanejs/react-toolkit';
import { TalismanArcadeRoot } from './talisman-arcade-root';
import { LicenseGate } from './license-gate';
import { NAMESPACE } from '../proto';
import { MainMenu } from './main-menu';
import { TapAMole } from './tap-a-mole';
import { ScreenSaver } from './screensaver';
import { FxPlayground } from './fx-playground';

export const C = prepareComponents(NAMESPACE, {
  TalismanArcadeRoot,
  LicenseGate,
  FxPlayground,
  MainMenu,
  ScreenSaver,
  TapAMole,
});
