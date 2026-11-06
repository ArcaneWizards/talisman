import {
  ControlLabel,
  ControlParagraph,
  ControlSelect,
} from '@arcanewizards/sigil/frontend/controls';
import {
  ArcadeDeviceConfig,
  MidiDeviceState,
  MIDINetworkState,
} from '../../proto';
import { TooltipWrapper } from '@arcanewizards/sigil/frontend/tooltip';
import { cn } from '@arcanejs/toolkit-frontend/util';
import { cnd } from '@arcanewizards/sigil/frontend/styling';

export type DeviceConfigProps = {
  midi: MIDINetworkState;
  state: MidiDeviceState | null;
  config: ArcadeDeviceConfig;
  update: (change: (config: ArcadeDeviceConfig) => ArcadeDeviceConfig) => void;
};

export const DeviceConfig = ({
  config,
  update,
  midi,
  state,
}: DeviceConfigProps) => {
  if (!state) return null;

  const profileId = config.selectedProfile?.[0] ?? '';
  const selectedProfile = midi.profiles[profileId];

  // TODO: extract shared config components between lab & arcade
  return (
    <div className="flex max-w-full flex-wrap items-stretch justify-center gap-2">
      <div
        className="
          control-grid-large w-[500px] max-w-full gap-1 rounded-md
          bg-sigil-bg-dark
        "
      >
        <ControlLabel>Input Device</ControlLabel>
        <ControlSelect
          value={config.input}
          placeholder="Select an input device"
          options={midi.endpoints.inputs.map((input) => ({
            value: input.name,
            label: input.name,
          }))}
          variant="large"
          onChange={(input) =>
            update((current) => ({
              ...current,
              input,
              // Make blank so auto-selection will trigger
              output: '',
              // Make blank so auto-selection will trigger
              selectedProfile: null,
            }))
          }
          position="both"
        />
        <TooltipWrapper tooltip={state.input.status}>
          <div
            className="
              control-grid-pos-extra flex items-center justify-center p-2
            "
          >
            <div
              className={cn(
                'size-1 rounded-full',
                cnd(
                  state.input.status === 'disabled',
                  'bg-sigil-usage-gray-foreground',
                ),
                cnd(
                  state.input.status === 'connected',
                  'bg-sigil-usage-green-foreground',
                ),
                cnd(
                  state.input.status === 'connecting',
                  'bg-sigil-usage-orange-foreground',
                ),
                cnd(
                  state.input.status === 'error',
                  'bg-sigil-usage-red-foreground',
                ),
              )}
            />
          </div>
        </TooltipWrapper>
        {state.input.status === 'error' &&
          state.input.errors.map((error, index) => (
            <ControlParagraph position="row" mode="error" key={index}>
              {error}
            </ControlParagraph>
          ))}
        <ControlLabel>Output Device</ControlLabel>
        <ControlSelect
          value={config.output}
          placeholder="Select an output device"
          options={midi.endpoints.outputs.map((output) => ({
            value: output.name,
            label: output.name,
          }))}
          variant="large"
          onChange={(output) =>
            update((current) => ({
              ...current,
              output,
            }))
          }
          position="both"
        />
        <TooltipWrapper tooltip={state.output.status}>
          <div
            className="
              control-grid-pos-extra flex items-center justify-center p-2
            "
          >
            <div
              className={cn(
                'size-1 rounded-full',
                cnd(
                  state.output.status === 'disabled',
                  'bg-sigil-usage-gray-foreground',
                ),
                cnd(
                  state.output.status === 'connected',
                  'bg-sigil-usage-green-foreground',
                ),
                cnd(
                  state.output.status === 'connecting',
                  'bg-sigil-usage-orange-foreground',
                ),
                cnd(
                  state.output.status === 'error',
                  'bg-sigil-usage-red-foreground',
                ),
              )}
            />
          </div>
        </TooltipWrapper>
        {state.output.status === 'error' &&
          state.output.errors.map((error, index) => (
            <ControlParagraph position="row" mode="error" key={index}>
              {error}
            </ControlParagraph>
          ))}
        <ControlLabel>Profile</ControlLabel>
        <ControlSelect
          value={config.selectedProfile?.[0] ?? ''}
          placeholder="Select a profile"
          options={Object.entries(midi.profiles).map(([key, profile]) => ({
            value: key,
            label: profile.name,
          }))}
          variant="large"
          onChange={(primaryProfile) =>
            update((current) => ({
              ...current,
              selectedProfile: [primaryProfile, 'default'],
            }))
          }
          position="both"
        />
        {Object.keys(selectedProfile?.subProfiles ?? {}).length > 1 ||
        selectedProfile?.subProfiles.default !== 'Default' ? (
          <>
            <ControlLabel>Sub-Profile</ControlLabel>

            <ControlSelect
              value={config.selectedProfile?.[1] ?? ''}
              placeholder="Select a sub-profile"
              options={Object.entries(selectedProfile?.subProfiles ?? {}).map(
                ([key, label]) => ({
                  value: key,
                  label,
                }),
              )}
              variant="large"
              onChange={(subProfile) =>
                update((current) => ({
                  ...current,
                  selectedProfile: [
                    current.selectedProfile?.[0] ?? '',
                    subProfile,
                  ],
                }))
              }
              position="both"
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
