import { createDataFileDefinition } from '@arcanejs/react-toolkit/data';
import { DEFAULT_CONFIG, ARCADE_CONFIG } from './components/proto';

export const LabConfigData = createDataFileDefinition({
  schema: ARCADE_CONFIG,
  defaultValue: DEFAULT_CONFIG,
});
