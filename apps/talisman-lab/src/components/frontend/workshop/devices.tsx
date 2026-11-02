import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TalismanLabGetSupportedDevicesReturn } from '../../proto';
import {
  LoadingWrapper,
  useUserAction,
} from '@arcanewizards/sigil/frontend/user-actions';
import { RootContext } from './context';
import { Logo } from './logo';
import { cn } from '@arcanejs/toolkit-frontend/util';
import { cnd } from '@arcanewizards/sigil/frontend/styling';
import { useBrowserContext } from '@arcanewizards/sigil/frontend';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';
import {
  DeviceProfileDetails,
  TalismanSupportedDeviceData,
} from '../shared/device-profile-details';

const DATE_FORMAT = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const GithubUsername: FC<{ username: string }> = ({ username }) => {
  const { openExternalLink } = useBrowserContext();

  return (
    <span
      onClick={() => openExternalLink(`https://github.com/${username}`)}
      className="cursor-pointer font-mono text-sigil-foreground-highlight"
    >
      {username}
    </span>
  );
};

const DeviceEntry: FC<{
  profileId: string;
  device: TalismanSupportedDeviceData;
}> = ({ profileId, device }) => {
  const [detailsOpen, setDetailsOpen] = useState(true);

  const { getFullProfileInfo } = useContext(RootContext);

  const { name, testing, subProfiles } = device;

  const testers = useMemo(
    () => [
      ...(testing.maintainers?.map(
        (tester) => ['maintainer', tester] as const,
      ) ?? []),
      ...(testing.manufacturer?.map(
        (tester) => ['manufacturer', tester] as const,
      ) ?? []),
      ...(testing.community?.map((tester) => ['community', tester] as const) ??
        []),
    ],
    [testing],
  );

  return (
    <div className="flex flex-col gap-1 rounded-md bg-sigil-bg-dark p-2">
      <div className="flex gap-1">
        <div className="flex grow flex-col gap-1 text-sigil-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sigil-foreground-highlight">
              {name}
            </span>

            <span
              className={cn(
                `
                  rounded-sigil-control px-0.5 py-0.3 text-sigil-control
                  font-bold
                `,
                cnd(
                  testing.ready,
                  'bg-sigil-usage-green-background text-sigil-usage-green-text',
                  `
                    bg-sigil-usage-orange-background
                    text-sigil-usage-orange-text
                  `,
                ),
              )}
            >
              <span className="text-sigil-control">
                {testing.ready ? 'READY' : 'UNTESTED'}
              </span>
            </span>
          </div>
          {testers.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-sigil-foreground-highlight">
                Tested By:
              </span>
              <div className="flex flex-wrap gap-2">
                {testers.map(([role, tester], i) => (
                  <span key={i} className="flex items-center gap-1">
                    {role !== 'community' && (
                      <span
                        className={cn(
                          `
                            rounded-sigil-control px-0.5 py-0.3
                            text-sigil-control font-bold
                          `,
                          cnd(
                            role === 'maintainer',
                            `
                              bg-sigil-usage-blue-background
                              text-sigil-usage-blue-text
                            `,
                          ),
                          cnd(
                            role === 'manufacturer',
                            `
                              bg-sigil-usage-purple-background
                              text-sigil-usage-purple-text
                            `,
                          ),
                        )}
                      >
                        <span className="text-sigil-control">
                          {role.toUpperCase()}
                        </span>
                      </span>
                    )}
                    {tester.ghUsername && (
                      <GithubUsername username={tester.ghUsername} />
                    )}
                    {`-`}
                    <span>{`on ${DATE_FORMAT.format(new Date(tester.date))}`}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {Object.keys(subProfiles).length > 1 ? (
            <div>
              <span className="font-bold text-sigil-foreground-highlight">
                Sub Profiles:
              </span>
              <ul>
                {Object.entries(subProfiles).map(
                  ([subKey, { name, notice }]) => (
                    <li key={subKey} className="not-last:mb-1">
                      <div>{name}</div>
                      {notice && (
                        <div className="mt-1 text-sigil-foreground-muted">
                          {notice}
                        </div>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <div>
          <ControlButton
            variant="large"
            active={detailsOpen}
            onClick={() => setDetailsOpen((current) => !current)}
          >
            View Details
          </ControlButton>
        </div>
      </div>
      {detailsOpen && (
        <DeviceProfileDetails
          profileId={profileId}
          device={device}
          getProfileInfo={getFullProfileInfo}
        />
      )}
    </div>
  );
};

export const SupportedDevices: FC = () => {
  const [devices, performDeviceLoad] =
    useUserAction<TalismanLabGetSupportedDevicesReturn>();

  const {
    getSupportedDevices,
    config: { animatedLogo },
  } = useContext(RootContext);

  const loadDevices = useCallback(() => {
    performDeviceLoad(() => getSupportedDevices());
  }, [performDeviceLoad, getSupportedDevices]);

  useEffect(() => loadDevices(), [loadDevices]);

  return (
    <LoadingWrapper
      action={devices}
      className="h-full scrollbar-sigil overflow-y-scroll p-2"
    >
      <div className="flex flex-col gap-2">
        <Logo animatedLogo={animatedLogo} />
        <div
          className="
            flex flex-col gap-2 rounded-md bg-sigil-bg-dark p-2
            text-sigil-foreground
          "
        >
          <p className="m-0">
            Below is a list of all the devices that are supported by the
            Talisman Project, or that have a profile developed but that has not
            yet had enough testing.
          </p>
          <p className="m-0">
            The Talisman project is an open-source and community-driven
            initiative, and we are continuously looking for help from users like
            you to contribute by either testing support for untested devices, or
            contributing to the development of new device profiles.
          </p>
        </div>
        {devices.success &&
          Object.entries(devices.data).map(([key, device]) => (
            <DeviceEntry key={key} profileId={key} device={device} />
          ))}
      </div>
    </LoadingWrapper>
  );
};
