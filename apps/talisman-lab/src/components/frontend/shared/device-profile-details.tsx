import { ComponentProps, FC, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  MIDI_CHANNEL_OPTIONS_SHORT,
  MIDI_NOTE_OPTIONS,
  MidiControllerItem,
  MidiProfileDefinition,
  MidiProfileFeedbackCapabilities,
  ProfilePair,
} from '@talisman-midi/talisman';
import {
  LoadingWrapper,
  success,
  useUserAction,
} from '@arcanewizards/sigil/frontend/user-actions';
import {
  itemDescription,
  MidiDevicePreview,
  MidiDevicePreviewProps,
  MidiFeedbackSummary,
  MidiPreviewColorsProp,
  natureDescription,
} from './device-preview';
import {
  ControlButton,
  ControlSelect,
  SelectOption,
} from '@arcanewizards/sigil/frontend/controls';
import { cnd } from '@arcanewizards/sigil/frontend/styling';
import { cn } from '@arcanejs/toolkit-frontend/util';
import {
  ToolbarRow,
  ToolbarSpacer,
  ToolbarWrapper,
} from '@arcanewizards/sigil/frontend/toolbars';
import { Icon } from '@arcanejs/toolkit-frontend/components/core';

const PREVIEW_COLORS: MidiPreviewColorsProp = {
  cellBackground: 'var(--sigil-bg-dark)',
  border: 'var(--sigil-border)',
  text: 'var(--sigil-foreground)',
  hover: 'var(--sigil-usage-hint-foreground)',
  highlight: 'var(--sigil-foreground-highlight)',
  elementBackground: 'var(--sigil-bg-light)',
};

const SELECT_COLORS: MidiPreviewColorsProp = {
  ...PREVIEW_COLORS,
  cellBackground: 'var(--sigil-border)',
};

export type TalismanSupportedDeviceData = Pick<
  MidiProfileDefinition,
  'name' | 'testing'
> & {
  subProfiles: Record<string, Pick<ProfilePair, 'name' | 'notice'>>;
};

export type TalismanFullProfileInfo = {
  items: MidiControllerItem[];
  feedbackCapabilities: MidiProfileFeedbackCapabilities;
};

export type UseFullProfileInfoArgs = {
  getProfileInfo: (args: {
    profileName: string;
    subProfileName: string;
  }) => Promise<TalismanFullProfileInfo>;
  profileId: string;
  subProfileKeys: string[];
};

export const useFullProfileInfo = ({
  getProfileInfo,
  profileId,
  subProfileKeys,
}: UseFullProfileInfoArgs) => {
  const [deviceInfo, performDeviceInfoLoad] =
    useUserAction<Record<string, TalismanFullProfileInfo>>();

  useEffect(() => {
    performDeviceInfoLoad(() =>
      Promise.all(
        subProfileKeys.map((subProfileName) =>
          getProfileInfo({
            profileName: profileId,
            subProfileName,
          }).then((result) => [subProfileName, result]),
        ),
      ).then((result) => success(Object.fromEntries(result))),
    );
  }, [getProfileInfo, performDeviceInfoLoad, profileId, subProfileKeys]);
  return deviceInfo;
};

type SubProfileSelectorProps = Pick<
  ComponentProps<typeof ControlSelect>,
  'variant' | 'onChange' | 'position' | 'disabled' | 'tooltip'
> & {
  profileId: string;
  subProfileNames: Record<string, string>;
  fullProfileInfo: ReturnType<typeof useFullProfileInfo>;
  subProfile: string | null;
  includeNone: boolean;
};

export const SubProfileSelector: FC<SubProfileSelectorProps> = ({
  profileId,
  subProfileNames,
  fullProfileInfo,
  subProfile,
  includeNone,
  ...props
}) => {
  const options: SelectOption<string>[] = useMemo(
    () => [
      ...(includeNone ? [{ label: '', value: '' }] : []),
      ...Object.entries(subProfileNames).map(([key, label]) => ({
        label,
        value: key,
      })),
    ],
    [subProfileNames, includeNone],
  );
  if (!fullProfileInfo.success) {
    return null;
  }
  return (
    <ControlSelect
      options={options}
      value={subProfile ?? ''}
      placeholder="Select a sub-profile"
      option={(option) => {
        if (option.value === '') {
          return <span className="flex flex-col items-center">None</span>;
        }

        const data = fullProfileInfo.data[option.value];

        return (
          <span
            className={cn(
              'flex flex-col items-center gap-2',
              cnd(
                subProfile === option.value,
                'rounded-md bg-sigil-border p-1',
                '',
              ),
            )}
          >
            {data && (
              <MidiFeedbackSummary
                colors={SELECT_COLORS}
                info={data}
                namespace={`profile-selector-${profileId}-${option.value}`}
                height={70}
              />
            )}
            <span>{option.label}</span>
          </span>
        );
      }}
      {...props}
    />
  );
};

export type DeviceProfileDetailsProps = Pick<
  UseFullProfileInfoArgs,
  'profileId' | 'getProfileInfo'
> & {
  subProfile:
    | {
        mode: 'locked';
        subProfileKey: string | null;
      }
    | {
        mode: 'local';
      };
  subProfileNames: Record<string, string>;
  className?: string;
};

type ItemDetailsProps = {
  profileId: string;
  items: MidiControllerItem[];
  device: TalismanFullProfileInfo;
};

const ItemDetails: FC<ItemDetailsProps> = ({ profileId, items, device }) => {
  const infoForFeedbackSummary: TalismanFullProfileInfo = useMemo(
    () => ({
      feedbackCapabilities: device.feedbackCapabilities,
      items,
    }),
    [device, items],
  );

  if (items.length === 0) {
    return (
      <div
        className="
          flex size-full flex-col items-center justify-center gap-2 p-2
          text-sigil-usage-hint-foreground
        "
      >
        <div className="w-0 min-w-full text-center">
          Click on an element in the MIDI profile layout to inspect its details
        </div>
        <span className="highlight-ui-horizontal">
          <Icon icon="arrow_back" className="text-[2rem]" />
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex size-full min-h-max flex-col gap-px bg-sigil-border
        text-sigil-foreground
      "
    >
      <div className="bg-sigil-bg-light p-2">
        <MidiFeedbackSummary
          colors={SELECT_COLORS}
          info={infoForFeedbackSummary}
          namespace={`device-profile-details-${profileId}`}
          className="max-h-[75px] w-full"
        />
      </div>
      {items.map((item) => (
        <div className="flex flex-col gap-1 bg-sigil-bg-light p-1">
          <div
            className="
              w-full text-center font-bold text-sigil-foreground-highlight
            "
          >
            {itemDescription(item)}
          </div>
          <div
            className="
              w-full text-center text-sigil-usage-hint-foreground select-text
            "
          >
            <span
              className="
                rounded-sigil-control bg-sigil-border px-0.5 py-0.3 font-mono
                text-sigil-control
              "
            >
              <span
                className="
                  pointer-events-none text-sigil-foreground-muted select-none
                "
              >
                {'id: '}
              </span>
              <span>{item.id}</span>
            </span>
          </div>
          {item.position && (
            <div
              className="
                flex w-full items-center justify-center gap-1 select-text
              "
            >
              {(['col', 'row'] as const).map((axis) => {
                const value = item.position?.[axis];
                if (value === undefined) return null;

                return (
                  <span
                    key={axis}
                    className="
                      rounded-sigil-control bg-sigil-border px-0.5 py-0.3
                      font-mono text-sigil-control
                    "
                  >
                    <span
                      className="
                        pointer-events-none text-sigil-foreground-muted
                        select-none
                      "
                    >
                      {axis === 'col' ? 'x: ' : 'y: '}
                    </span>
                    <span>
                      {typeof value === 'number'
                        ? value
                        : `${value[0]}-${value[1]}`}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
          {item.note?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Notes: </div>
              <ul className="px-3">
                {item.note.map((note) => (
                  <li key={`note-${note.id.channel}-${note.id.note}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[note.id.channel]} - ${MIDI_NOTE_OPTIONS[note.id.note]}${note.nature ? ` (${natureDescription(note.nature)})` : ''}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.polyphonicAftertouch?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Polyphonic Aftertouch: </div>
              <ul className="px-3">
                {item.polyphonicAftertouch.map((note) => (
                  <li key={`note-${note.id.channel}-${note.id.note}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[note.id.channel]} - ${MIDI_NOTE_OPTIONS[note.id.note]}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.controlChange?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Control Changes: </div>
              <ul className="px-3">
                {item.controlChange.map((cc) => (
                  <li key={`cc-${cc.id.channel}-${cc.id.controller}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[cc.id.channel]} - CC ${cc.id.controller}${cc.nature ? ` (${natureDescription(cc.nature)})` : ''}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.programChange?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Program Change: </div>
              <ul className="px-3">
                {item.programChange.map((pc) => (
                  <li key={`pc-${pc.id.channel}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[pc.id.channel]} - ${pc.id.program}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.channelAftertouch?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Channel Aftertouch: </div>
              <ul className="px-3">
                {item.channelAftertouch.map((cat) => (
                  <li key={`cat-${cat.id.channel}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[cat.id.channel]}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.pitchWheel?.length && (
            <div className="text-sigil-control">
              <div className="font-bold">Pitch Wheel: </div>
              <ul className="px-3">
                {item.pitchWheel.map((pw) => (
                  <li key={`pw-${pw.id.channel}`}>
                    {`${MIDI_CHANNEL_OPTIONS_SHORT[pw.id.channel]}${pw.nature ? ` (${natureDescription(pw.nature)})` : ''}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const DeviceProfileDetails: FC<DeviceProfileDetailsProps> = ({
  profileId,
  subProfileNames,
  className,
  subProfile,
  getProfileInfo,
}: DeviceProfileDetailsProps) => {
  const subProfileKeys = useMemo(
    () => Object.keys(subProfileNames),
    [subProfileNames],
  );
  const [localSubProfileKey, setSubProfileName] = useState<string | null>(
    (subProfileKeys.length === 1 && subProfileKeys[0]) || null,
  );

  const subProfileKey =
    subProfile.mode === 'locked'
      ? (subProfile.subProfileKey ?? null)
      : localSubProfileKey;

  const deviceInfo = useFullProfileInfo({
    getProfileInfo,
    profileId,
    subProfileKeys,
  });

  const [selectedItems, setSelectedItems] = useState<MidiControllerItem[]>([]);

  const selectedItemsWithOpacities: MidiDevicePreviewProps['selectedItems'] =
    useMemo(
      () => selectedItems.map((item) => ({ item, opacity: 1 })),
      [selectedItems],
    );

  useEffect(() => {
    // Reset selected items when the profile or sub-profile changes
    setSelectedItems([]);
  }, [profileId, subProfileKey]);

  const selectedDeviceInfo =
    (deviceInfo.success && deviceInfo.data[subProfileKey ?? '']) || null;

  return (
    <div className={className}>
      <LoadingWrapper
        action={deviceInfo}
        className="size-full max-h-full"
        classNameInner="max-h-full"
      >
        <div className="flex h-full flex-col gap-2">
          {subProfile.mode === 'local' &&
            deviceInfo.success &&
            Object.keys(deviceInfo.data).length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {subProfileKey
                  ? 'Sub-Profile:'
                  : 'Please select a sub-profile:'}
                <SubProfileSelector
                  profileId={profileId}
                  subProfileNames={subProfileNames}
                  fullProfileInfo={deviceInfo}
                  subProfile={subProfileKey}
                  onChange={setSubProfileName}
                  variant="large"
                  includeNone
                />
              </div>
            )}
          {selectedDeviceInfo && (
            <ErrorBoundary
              fallback={
                <div
                  className="
                    flex grow items-center justify-center
                    text-sigil-error-foreground
                  "
                >
                  An error occurred while loading the device preview
                </div>
              }
            >
              <div className="flex h-full gap-1">
                <MidiDevicePreview
                  namespace={profileId}
                  className="
                    h-full max-h-[70vh] grow border border-sigil-border
                    bg-sigil-bg-light text-sigil-foreground
                  "
                  info={selectedDeviceInfo}
                  colors={PREVIEW_COLORS}
                  selectedItems={selectedItemsWithOpacities}
                  onItemsSelected={setSelectedItems}
                />
                <div
                  className="
                    flex max-w-[30vw] min-w-[200px] grow flex-col border
                    border-sigil-border bg-sigil-bg-light
                  "
                >
                  <ToolbarWrapper>
                    <ToolbarRow>
                      <span className="p-1">MIDI Profile Details</span>
                      <div className="grow" />
                      {selectedItems.length > 0 && (
                        <>
                          <ToolbarSpacer />
                          <ControlButton
                            onClick={() => setSelectedItems([])}
                            variant="toolbar"
                            icon="close"
                          />
                        </>
                      )}
                    </ToolbarRow>
                  </ToolbarWrapper>
                  <div
                    className="
                      grow scrollbar-sigil overflow-x-hidden overflow-y-scroll
                    "
                  >
                    <ItemDetails
                      items={selectedItems}
                      profileId={profileId}
                      device={selectedDeviceInfo}
                    />
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          )}
        </div>
      </LoadingWrapper>
    </div>
  );
};
