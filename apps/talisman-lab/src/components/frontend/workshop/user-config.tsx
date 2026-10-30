import { FC } from 'react';
import {
  ControlButton,
  ControlButtonGroup,
  ControlInput,
  ControlLabel,
  ControlParagraph,
  ControlSelect,
} from '@arcanewizards/sigil/frontend/controls';
import { TooltipWrapper } from '@arcanewizards/sigil/frontend/tooltip';
import { cn } from '@arcanejs/toolkit-frontend/util';
import { cnd } from '@arcanewizards/sigil/frontend/styling';
import {
  TalismanLabRootComponent,
  MIDINetworkState,
  UserConfig,
} from '../../proto';

type UserConfigProps = {
  midi: MIDINetworkState;
  status: TalismanLabRootComponent['status'];
  config: UserConfig;
  updateConfig: (update: (config: UserConfig) => UserConfig) => void;
  performModeSwitch: () => void;
};

export const UserConfigEditor: FC<UserConfigProps> = ({
  midi,
  status,
  config,
  updateConfig,
  performModeSwitch,
}) => {
  const selectedProfile = midi.profiles[config.selectedProfile?.[0] ?? ''];

  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      <div
        className="
          control-grid-large w-[500px] max-w-full gap-1 rounded-arcane-btn
          bg-sigil-bg-dark
        "
      >
        <ControlLabel>Input Device</ControlLabel>
        <ControlSelect
          value={config.selectedInput}
          placeholder="Select an input device"
          options={midi.endpoints.inputs.map((input) => ({
            value: input.name,
            label: input.name,
          }))}
          variant="large"
          onChange={(selectedInput) =>
            updateConfig((current) => ({
              ...current,
              selectedInput,
            }))
          }
          position="both"
        />
        <TooltipWrapper tooltip={status.input.status}>
          <div
            className="
              control-grid-pos-extra flex items-center justify-center p-2
            "
          >
            <div
              className={cn(
                'size-1 rounded-full',
                cnd(
                  status.input.status === 'disabled',
                  'bg-sigil-usage-gray-foreground',
                ),
                cnd(
                  status.input.status === 'connected',
                  'bg-sigil-usage-green-foreground',
                ),
                cnd(
                  status.input.status === 'connecting',
                  'bg-sigil-usage-orange-foreground',
                ),
                cnd(
                  status.input.status === 'error',
                  'bg-sigil-usage-red-foreground',
                ),
              )}
            />
          </div>
        </TooltipWrapper>
        {status.input.status === 'error' &&
          status.input.errors.map((error, index) => (
            <ControlParagraph position="row" mode="error" key={index}>
              {error}
            </ControlParagraph>
          ))}
        <ControlLabel>Output Device</ControlLabel>
        <ControlSelect
          value={config.selectedOutput}
          placeholder="Select an output device"
          options={midi.endpoints.outputs.map((output) => ({
            value: output.name,
            label: output.name,
          }))}
          variant="large"
          onChange={(selectedOutput) =>
            updateConfig((current) => ({
              ...current,
              selectedOutput,
            }))
          }
          position="both"
        />
        <TooltipWrapper tooltip={status.output.status}>
          <div
            className="
              control-grid-pos-extra flex items-center justify-center p-2
            "
          >
            <div
              className={cn(
                'size-1 rounded-full',
                cnd(
                  status.output.status === 'disabled',
                  'bg-sigil-usage-gray-foreground',
                ),
                cnd(
                  status.output.status === 'connected',
                  'bg-sigil-usage-green-foreground',
                ),
                cnd(
                  status.output.status === 'connecting',
                  'bg-sigil-usage-orange-foreground',
                ),
                cnd(
                  status.output.status === 'error',
                  'bg-sigil-usage-red-foreground',
                ),
              )}
            />
          </div>
        </TooltipWrapper>
        {status.output.status === 'error' &&
          status.output.errors.map((error, index) => (
            <ControlParagraph position="row" mode="error" key={index}>
              {error}
            </ControlParagraph>
          ))}
        {config.selectedOutput &&
          config.selectedOutput !== config.selectedInput && (
            <ControlParagraph position="row" mode="warning">
              Output has a different name to input, this is usually incorrect.
            </ControlParagraph>
          )}
        <ControlLabel>Profile</ControlLabel>
        <ControlSelect
          value={config.selectedProfile?.[0] ?? ''}
          placeholder="Select a profile"
          options={Object.entries(midi.profiles).map(([key, profile]) => ({
            value: key,
            label: profile.name,
          }))}
          variant="large"
          onChange={(selectedProfile) =>
            updateConfig((current) => ({
              ...current,
              selectedProfile: [selectedProfile, 'default'],
            }))
          }
          position="both"
        />
        {/* {config.selectedProfile &&
          config.selectedInput &&
          selectedProfile &&
          !profileMatches(config.selectedInput, selectedProfile) && (
            <ControlParagraph position="row" mode="warning">
              The current device is not included in the auto-select list for the
              selected profile, this means users will need to manually select
              this profile.
            </ControlParagraph>
          )} */}
        {Object.keys(selectedProfile?.subProfiles ?? {}).length > 1 ||
        selectedProfile?.subProfiles.default !== 'Default' ? (
          <>
            <ControlLabel>Sub-Profile</ControlLabel>
            <ControlSelect
              value={config.selectedProfile?.[1] ?? ''}
              placeholder="Select a profile"
              options={Object.entries(selectedProfile?.subProfiles ?? {}).map(
                ([value, label]) => ({ value, label }),
              )}
              variant="large"
              onChange={(subProfile) =>
                updateConfig((current) => ({
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
        {status.midiDeviceReadiness?.state === 'pending-mode-switch' ? (
          <>
            <ControlParagraph position="row" mode="warning">
              {status.midiDeviceReadiness.message}
            </ControlParagraph>
            <ControlButton
              onClick={performModeSwitch}
              variant="large"
              position="row"
            >
              Switch Mode
            </ControlButton>
          </>
        ) : null}
        {status.midiDeviceReadiness?.state === 'unusable' ? (
          <ControlParagraph position="row" mode="error">
            {status.midiDeviceReadiness.message}
          </ControlParagraph>
        ) : null}
      </div>
      <div
        className="
          control-grid-large w-[500px] max-w-full gap-1 rounded-arcane-btn
          bg-sigil-bg-dark
        "
      >
        <ControlLabel>FPS</ControlLabel>
        <ControlInput
          value={`${config.fps ?? ''}`}
          placeholder="Enter FPS"
          onChange={(fps) => {
            const n = parseInt(fps);
            updateConfig((current) => ({
              ...current,
              fps: Math.max(0, Math.min(60, isNaN(n) ? 0 : n)),
            }));
          }}
          position="both"
          type="number"
          min={0}
          max={60}
          step={1}
        />
        <ControlLabel>Pattern</ControlLabel>
        <ControlButtonGroup position="both" variant="large">
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                pattern:
                  current.pattern.type === 'solid'
                    ? current.pattern
                    : { type: 'solid', hue: 0, saturation: 100 },
              }));
            }}
            variant="group"
            active={config.pattern?.type === 'solid'}
          >
            Solid Color
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                pattern:
                  current.pattern.type === 'rainbow'
                    ? current.pattern
                    : { type: 'rainbow' },
              }));
            }}
            variant="group"
            active={config.pattern?.type === 'rainbow'}
          >
            Rainbow
          </ControlButton>
        </ControlButtonGroup>
        {config.pattern.type === 'solid' && (
          <>
            <ControlLabel>Hue</ControlLabel>
            <ControlInput
              value={`${config.pattern.hue}`}
              placeholder="Enter Hue"
              onChange={(hue) => {
                const n = parseInt(hue);
                updateConfig((current) => ({
                  ...current,
                  pattern: {
                    ...current.pattern,
                    hue: Math.max(0, Math.min(360, isNaN(n) ? 0 : n)),
                  },
                }));
              }}
              position="both"
              type="number"
              min={0}
              max={360}
              step={1}
            />
            <ControlLabel>Saturation</ControlLabel>
            <ControlInput
              value={`${config.pattern.saturation}`}
              placeholder="Enter Saturation"
              onChange={(saturation) => {
                const n = parseInt(saturation);
                updateConfig((current) => ({
                  ...current,
                  pattern: {
                    ...current.pattern,
                    saturation: Math.max(0, Math.min(100, isNaN(n) ? 0 : n)),
                  },
                }));
              }}
              position="both"
              type="number"
              min={0}
              max={100}
              step={1}
            />
          </>
        )}
        <ControlLabel>Lightness</ControlLabel>
        <ControlButtonGroup position="both" variant="large">
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                lightness:
                  current.lightness.type === 'solid'
                    ? current.lightness
                    : { type: 'solid', value: 50 },
              }));
            }}
            variant="group"
            active={config.lightness?.type === 'solid'}
          >
            Solid
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                lightness:
                  current.lightness.type === 'moving'
                    ? current.lightness
                    : { type: 'moving', direction: 'horizontal' },
              }));
            }}
            variant="group"
            active={config.lightness?.type === 'moving'}
          >
            Wave
          </ControlButton>
        </ControlButtonGroup>
        {config.lightness.type === 'solid' && (
          <>
            <ControlLabel>Value:</ControlLabel>
            <ControlInput
              value={`${config.lightness.value}`}
              placeholder="Enter Value"
              onChange={(value) => {
                const n = parseInt(value);
                updateConfig((current) => ({
                  ...current,
                  lightness: {
                    ...current.lightness,
                    value: Math.max(0, Math.min(100, isNaN(n) ? 0 : n)),
                  },
                }));
              }}
              position="both"
              type="number"
              min={0}
              max={100}
              step={1}
            />
          </>
        )}
        {config.lightness.type === 'moving' && (
          <>
            <ControlLabel>Wave Direction</ControlLabel>
            <ControlButtonGroup position="both" variant="large">
              <ControlButton
                onClick={() => {
                  updateConfig((current) => ({
                    ...current,
                    lightness: {
                      ...current.lightness,
                      direction: 'horizontal',
                    },
                  }));
                }}
                variant="group"
                active={config.lightness?.direction === 'horizontal'}
              >
                Horizontal
              </ControlButton>
              <ControlButton
                onClick={() => {
                  updateConfig((current) => ({
                    ...current,
                    lightness: {
                      ...current.lightness,
                      direction: 'vertical',
                    },
                  }));
                }}
                variant="group"
                active={config.lightness?.direction === 'vertical'}
              >
                Vertical
              </ControlButton>
            </ControlButtonGroup>
          </>
        )}
        <ControlLabel>Button Interaction</ControlLabel>
        <ControlButtonGroup position="both" variant="large">
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                interaction: { type: 'row-column' },
              }));
            }}
            variant="group"
            active={config.interaction?.type === 'row-column'}
          >
            Highlight Row + Column
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                interaction: { type: 'cell' },
              }));
            }}
            variant="group"
            active={config.interaction?.type === 'cell'}
          >
            Highlight Cell
          </ControlButton>
        </ControlButtonGroup>
      </div>
    </div>
  );
};
