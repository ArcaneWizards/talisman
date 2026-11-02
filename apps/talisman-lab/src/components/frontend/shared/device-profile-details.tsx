import { FC, useEffect, useState } from 'react';
import {
  MidiControllerItem,
  MidiProfileDefinition,
  MidiProfileFeedbackCapabilities,
  ProfilePair,
} from '@arcanewizards/talisman';
import {
  ActionResponse,
  LoadingWrapper,
  useUserAction,
} from '@arcanewizards/sigil/frontend/user-actions';
import { MidiDevicePreview } from './device-preview';

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

export type DeviceProfileDetailsProps = {
  profileId: string;
  device: TalismanSupportedDeviceData;
  getProfileInfo: (args: {
    profileName: string;
    subProfileName: string;
  }) => ActionResponse<TalismanFullProfileInfo>;
  className?: string;
};

export const DeviceProfileDetails: FC<DeviceProfileDetailsProps> = ({
  profileId,
  device,
  className,
  getProfileInfo,
}: DeviceProfileDetailsProps) => {
  const subProfileKeys = Object.keys(device.subProfiles);
  const [subProfileName, setSubProfileName] = useState<string | null>(
    (subProfileKeys.length === 1 && subProfileKeys[0]) || 'default',
  );

  const [deviceInfo, performDeviceInfoLoad] =
    useUserAction<TalismanFullProfileInfo>();

  useEffect(() => {
    if (!subProfileName) return;
    performDeviceInfoLoad(() =>
      getProfileInfo({
        profileName: profileId,
        subProfileName,
      }),
    );
  }, [getProfileInfo, performDeviceInfoLoad, profileId, subProfileName]);

  return (
    <div className={className}>
      <LoadingWrapper action={deviceInfo}>
        <div className="flex gap-2 bg-sigil-bg-light p-1">
          {!subProfileName ? (
            <div className="flex grow items-center justify-center">
              Please select a sub-profile:
              <ul>
                {Object.entries(device.subProfiles).map(([key, subProfile]) => (
                  <li key={key}>
                    <button onClick={() => setSubProfileName(key)}>
                      {subProfile.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              {deviceInfo.success ? (
                <MidiDevicePreview
                  namespace={profileId}
                  className="
                    max-h-[70svh] min-h-[300px] grow text-sigil-foreground
                  "
                  info={deviceInfo.data}
                  colors={{
                    cellBackground: 'var(--sigil-bg-dark)',
                    cellBorder: 'var(--sigil-border)',
                  }}
                />
              ) : null}
              <div className="max-w-[200px] min-w-[20%] bg-sigil-bg-dark p-2">
                Sidebar
              </div>
            </>
          )}
        </div>
      </LoadingWrapper>
    </div>
  );
};
