import { FC, useCallback } from 'react';
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

import {
  SubProfileSelector,
  TalismanFullProfileInfo,
} from '../shared/device-profile-details';
import { UserActionState } from '@arcanewizards/sigil/frontend/user-actions';
import { useBrowserContext } from '@arcanewizards/sigil/frontend';
import { WINDOW_MODE_MONITOR, WINDOW_MODE_PARAM } from './urls';

type UserConfigProps = {
  midi: MIDINetworkState;
  status: TalismanLabRootComponent['state'];
  config: UserConfig;
  updateConfig: (update: (config: UserConfig) => UserConfig) => void;
  performModeSwitch: () => void;
  deviceInfo: UserActionState<Record<string, TalismanFullProfileInfo>>;
};

export const UserConfigEditor: FC<UserConfigProps> = ({
  midi,
  status,
  config,
  updateConfig,
  performModeSwitch,
  deviceInfo,
}) => {
  const profileId = config.selectedProfile?.[0] ?? '';
  const selectedProfile = midi.profiles[profileId];

  const { openNewWidow } = useBrowserContext();

  const openMonitoring = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(WINDOW_MODE_PARAM, WINDOW_MODE_MONITOR);
    openNewWidow(url.href);
  }, [openNewWidow]);

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
            <SubProfileSelector
              profileId={profileId}
              subProfileNames={selectedProfile?.subProfiles ?? {}}
              fullProfileInfo={deviceInfo}
              subProfile={config.selectedProfile?.[1] ?? ''}
              onChange={(subProfile) =>
                subProfile &&
                updateConfig((current) => ({
                  ...current,
                  selectedProfile: [
                    current.selectedProfile?.[0] ?? '',
                    subProfile,
                  ],
                }))
              }
              variant="large"
              position="both"
              includeNone={false}
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
              primary
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

        <ControlButton variant="large" onClick={openMonitoring} position="both">
          Monitor MIDI Messages
        </ControlButton>
      </div>
      <div
        className="
          control-grid-large w-[500px] max-w-full gap-1 rounded-md
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
                mode: {
                  ...current.mode,
                  pattern:
                    current.mode.pattern.type === 'solid'
                      ? current.mode.pattern
                      : { type: 'solid', hue: 0, saturation: 100 },
                },
              }));
            }}
            variant="group"
            active={config.mode.pattern?.type === 'solid'}
          >
            Solid Color
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                mode: {
                  ...current.mode,
                  pattern:
                    current.mode.pattern.type === 'rainbow'
                      ? current.mode.pattern
                      : { type: 'rainbow' },
                },
              }));
            }}
            variant="group"
            active={config.mode.pattern?.type === 'rainbow'}
          >
            Rainbow
          </ControlButton>
        </ControlButtonGroup>
        {config.mode.pattern.type === 'solid' && (
          <>
            <ControlLabel>Hue</ControlLabel>
            <ControlInput
              value={`${config.mode.pattern.hue}`}
              placeholder="Enter Hue"
              onChange={(hue) => {
                const n = parseInt(hue);
                updateConfig((current) => ({
                  ...current,
                  mode: {
                    ...current.mode,
                    pattern: {
                      ...current.mode.pattern,
                      hue: Math.max(0, Math.min(360, isNaN(n) ? 0 : n)),
                    },
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
              value={`${config.mode.pattern.saturation}`}
              placeholder="Enter Saturation"
              onChange={(saturation) => {
                const n = parseInt(saturation);
                updateConfig((current) => ({
                  ...current,
                  mode: {
                    ...current.mode,
                    pattern: {
                      ...current.mode.pattern,
                      saturation: Math.max(0, Math.min(100, isNaN(n) ? 0 : n)),
                    },
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
                mode: {
                  ...current.mode,
                  lightness:
                    current.mode.lightness.type === 'solid'
                      ? current.mode.lightness
                      : { type: 'solid', value: 50 },
                },
              }));
            }}
            variant="group"
            active={config.mode.lightness?.type === 'solid'}
          >
            Solid
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                mode: {
                  ...current.mode,
                  lightness:
                    current.mode.lightness.type === 'moving'
                      ? current.mode.lightness
                      : { type: 'moving', direction: 'horizontal' },
                },
              }));
            }}
            variant="group"
            active={config.mode.lightness?.type === 'moving'}
          >
            Wave
          </ControlButton>
        </ControlButtonGroup>
        {config.mode.lightness.type === 'solid' && (
          <>
            <ControlLabel>Value:</ControlLabel>
            <ControlInput
              value={`${config.mode.lightness.value}`}
              placeholder="Enter Value"
              onChange={(value) => {
                const n = parseInt(value);
                updateConfig((current) => ({
                  ...current,
                  mode: {
                    ...current.mode,
                    lightness: {
                      ...current.mode.lightness,
                      value: Math.max(0, Math.min(100, isNaN(n) ? 0 : n)),
                    },
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
        {config.mode.lightness.type === 'moving' && (
          <>
            <ControlLabel>Wave Direction</ControlLabel>
            <ControlButtonGroup position="both" variant="large">
              <ControlButton
                onClick={() => {
                  updateConfig((current) => ({
                    ...current,
                    mode: {
                      ...current.mode,
                      lightness: {
                        ...current.mode.lightness,
                        direction: 'horizontal',
                      },
                    },
                  }));
                }}
                variant="group"
                active={config.mode.lightness?.direction === 'horizontal'}
              >
                Horizontal
              </ControlButton>
              <ControlButton
                onClick={() => {
                  updateConfig((current) => ({
                    ...current,
                    mode: {
                      ...current.mode,
                      lightness: {
                        ...current.mode.lightness,
                        direction: 'vertical',
                      },
                    },
                  }));
                }}
                variant="group"
                active={config.mode.lightness?.direction === 'vertical'}
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
                mode: {
                  ...current.mode,
                  interaction: { type: 'row-column' },
                },
              }));
            }}
            variant="group"
            active={config.mode.interaction?.type === 'row-column'}
          >
            Row + Column
          </ControlButton>
          <ControlButton
            onClick={() => {
              updateConfig((current) => ({
                ...current,
                mode: {
                  ...current.mode,
                  interaction: { type: 'cell' },
                },
              }));
            }}
            variant="group"
            active={config.mode.interaction?.type === 'cell'}
          >
            Cell
          </ControlButton>
        </ControlButtonGroup>
      </div>
    </div>
  );
};
