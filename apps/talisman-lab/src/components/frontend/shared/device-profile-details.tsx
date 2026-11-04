import { ComponentProps, FC, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  MidiControllerItem,
  MidiProfileDefinition,
  MidiProfileFeedbackCapabilities,
  ProfilePair,
} from '@arcanewizards/talisman';
import {
  LoadingWrapper,
  success,
  useUserAction,
} from '@arcanewizards/sigil/frontend/user-actions';
import {
  MidiDevicePreview,
  MidiDevicePreviewProps,
  MidiFeedbackSummary,
  MidiPreviewColorsProp,
} from './device-preview';
import {
  ControlSelect,
  SelectOption,
} from '@arcanewizards/sigil/frontend/controls';
import { cnd } from '@arcanewizards/sigil/frontend/styling';
import { cn } from '@arcanejs/toolkit-frontend/util';

const PREVIEW_COLORS: MidiPreviewColorsProp = {
  cellBackground: 'var(--sigil-bg-dark)',
  border: 'var(--sigil-border)',
  text: 'var(--sigil-foreground)',
  hover: 'var(--sigil-usage-hint-foreground)',
  highlight: 'var(--sigil-foreground-highlight)',
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
  device: TalismanSupportedDeviceData;
  className?: string;
};

export const DeviceProfileDetails: FC<DeviceProfileDetailsProps> = ({
  profileId,
  device,
  className,
  getProfileInfo,
}: DeviceProfileDetailsProps) => {
  const subProfileKeys = Object.keys(device.subProfiles);
  const [subProfileKey, setSubProfileName] = useState<string | null>(
    (subProfileKeys.length === 1 && subProfileKeys[0]) || null,
  );

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

  const selectedDeviceInfo =
    (deviceInfo.success && deviceInfo.data[subProfileKey ?? '']) || null;

  const subProfileNames: Record<string, string> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(device.subProfiles).map(([key, { name }]) => [
          key,
          name ?? key,
        ]),
      ),
    [device.subProfiles],
  );

  return (
    <div className={className}>
      <LoadingWrapper action={deviceInfo}>
        <div className="flex flex-col gap-2 bg-sigil-bg-light p-1">
          {deviceInfo.success && Object.keys(deviceInfo.data).length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {subProfileKey ? 'Sub-Profile:' : 'Please select a sub-profile:'}
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
          )}{' '}
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
              <div className="flex gap-2">
                <MidiDevicePreview
                  namespace={profileId}
                  className="
                    max-h-[70svh] min-h-[300px] grow text-sigil-foreground
                  "
                  info={selectedDeviceInfo}
                  colors={PREVIEW_COLORS}
                  selectedItems={selectedItemsWithOpacities}
                  onItemsSelected={setSelectedItems}
                />
                <div className="max-w-[200px] min-w-[20%] bg-sigil-bg-dark p-2">
                  Sidebar
                </div>
              </div>
            </ErrorBoundary>
          )}
        </div>
      </LoadingWrapper>
    </div>
  );
};
