import { prepareComponents } from '@arcanejs/react-toolkit';
import { TalismanArcadeRoot } from './talisman-arcade-root';
import { LicenseGate } from './license-gate';
import { NAMESPACE } from '../proto';

export const C = prepareComponents(NAMESPACE, {
  TalismanArcadeRoot,
  LicenseGate,
});
