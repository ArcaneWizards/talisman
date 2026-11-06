import { createDataFileDefinition } from '@arcanejs/react-toolkit/data';
import { DEFAULT_CONFIG, LAB_CONFIG } from './components/proto';

export const LabConfigData = createDataFileDefinition({
  schema: LAB_CONFIG,
  defaultValue: DEFAULT_CONFIG,
});
