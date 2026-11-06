import { prepareComponents } from '@arcanejs/react-toolkit';
import { TalismanLabRoot } from './talisman-lab-root';
import { LicenseGate } from './license-gate';
import { NAMESPACE } from '../proto';

export const C = prepareComponents(NAMESPACE, {
  TalismanLabRoot,
  LicenseGate,
});
