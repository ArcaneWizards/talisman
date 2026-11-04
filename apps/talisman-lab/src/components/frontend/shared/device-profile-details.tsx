import { FC, useEffect, useMemo, useState } from 'react';
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

type SubProfileSelectorProps = {
  profileId: string;
  device: TalismanSupportedDeviceData;
  fullProfileInfo: ReturnType<typeof useFullProfileInfo>;
  subProfile: string | null;
  onSubProfileSelect: (subProfileName: string | null) => void;
};

export const SubProfileSelector: FC<SubProfileSelectorProps> = ({
  profileId,
  device,
  fullProfileInfo,
  subProfile,
  onSubProfileSelect,
}) => {
  const options: SelectOption<string>[] = useMemo(
    () => [
      { label: '', value: '' },
      ...Object.entries(device.subProfiles).map(([key, { name }]) => ({
        label: name ?? key,
        value: key,
      })),
    ],
    [device.subProfiles],
  );
  if (!fullProfileInfo.success) {
    return null;
  }
  return (
    <ControlSelect
      options={options}
      value={subProfile ?? ''}
      placeholder="Select a sub-profile"
      onChange={(value) => onSubProfileSelect(value || null)}
      option={(option) => {
        if (option.value === '') {
          return <span className="flex flex-col items-center gap-2">None</span>;
        }

        const data = fullProfileInfo.data[option.value];

        return (
          <span className="flex flex-col items-center gap-2">
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
      variant="large"
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

  return (
    <div className={className}>
      <LoadingWrapper action={deviceInfo}>
        <div className="flex flex-col gap-2 bg-sigil-bg-light p-1">
          {deviceInfo.success && Object.keys(deviceInfo.data).length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {subProfileKey ? 'Sub-Profile:' : 'Please select a sub-profile:'}
              <SubProfileSelector
                profileId={profileId}
                device={device}
                fullProfileInfo={deviceInfo}
                subProfile={subProfileKey}
                onSubProfileSelect={setSubProfileName}
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
