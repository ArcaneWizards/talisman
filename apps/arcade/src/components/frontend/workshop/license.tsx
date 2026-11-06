import { FC, useCallback, useContext } from 'react';

import {
  ControlButton,
  ControlButtonGroup,
} from '@arcanewizards/sigil/frontend/controls';

import { LicenseGateAcceptLicense, LicenseGateComponent } from '../../proto';

import { StageContext } from '@arcanejs/toolkit-frontend';
import { Layout } from './layout';
import { Debugger, useBrowserContext } from '@arcanewizards/sigil/frontend';
import { GetEulaResponse } from '@arcanewizards/apis';
import { apiContentToReact } from '@arcanewizards/sigil/frontend/utils';
import { LoadingWrapper } from '@arcanewizards/sigil/frontend/user-actions';
import { HELP_AND_SUPPORT_URL, STRINGS } from '../../../constants';
import { Logo } from './logo';
import { ConfigContext } from './context';

type LicenseProps = {
  eula: GetEulaResponse;
  setWindowMode: (mode: null) => void;
};

export const LicenseContent: FC<{ eula: GetEulaResponse }> = ({ eula }) => {
  return (
    <div
      className="
        flex flex-col gap-2 rounded-md bg-sigil-bg-dark p-2
        text-sigil-foreground
      "
    >
      <h1 className="m-0 p-0">{eula.title}</h1>
      <p className="m-0 p-0 text-sigil-foreground-muted">
        {STRINGS.licenseLastUpdated(eula.dateLastUpdated)}
      </p>
      {apiContentToReact(eula.content)}
    </div>
  );
};

export const License: FC<LicenseProps> = ({ eula, setWindowMode }) => {
  const { openExternalLink } = useBrowserContext();
  const {
    config: { animatedLogo },
  } = useContext(ConfigContext);
  return (
    <div className="flex grow flex-col">
      <div
        className="
          flex grow basis-0 scrollbar-sigil flex-col overflow-y-auto px-2 pb-2
        "
      >
        <Logo animatedLogo={animatedLogo} />
        <LicenseContent eula={eula} />
        <div className="flex justify-center p-2">
          <ControlButtonGroup variant="large">
            <ControlButton
              onClick={() => setWindowMode(null)}
              variant="group"
              icon="close"
            >
              {STRINGS.close(STRINGS.license)}
            </ControlButton>
            <ControlButton
              onClick={(e) => {
                e.preventDefault();
                openExternalLink(HELP_AND_SUPPORT_URL);
              }}
              variant="group"
              icon="help"
            >
              {STRINGS.helpAndSupport}
            </ControlButton>
          </ControlButtonGroup>
        </div>
      </div>
    </div>
  );
};

type LicenseGateProps = {
  info: LicenseGateComponent;
};

export const LicenseGate: FC<LicenseGateProps> = ({ info }) => {
  const { sendMessage } = useContext(StageContext);

  const acceptLicense = useCallback(() => {
    sendMessage?.<LicenseGateAcceptLicense>({
      type: 'component-message',
      namespace: 'talisman-arcade',
      component: 'license-gate',
      componentKey: info.key,
      action: 'accept-license',
    });
  }, [sendMessage, info.key]);

  return (
    <Layout
      footer
      modes={{
        debug: {
          child: () => (
            <Debugger title={STRINGS.debugger} className="size-full" />
          ),
          button: {
            icon: 'bug_report',
            title: STRINGS.debugger,
          },
        },
      }}
    >
      <div
        className="
          flex grow basis-0 scrollbar-sigil flex-col overflow-y-auto px-2 pb-2
        "
      >
        <Logo animatedLogo />
        <LoadingWrapper action={info.eula}>
          {info.eula.success && (
            <>
              <h2 className="text-center text-sigil-usage-hint-foreground">
                {STRINGS.licensePrompt(info.eula.data.title)}
              </h2>
              <LicenseContent eula={info.eula.data} />
              <div className="flex justify-center p-2">
                <ControlButton
                  onClick={acceptLicense}
                  variant="large"
                  icon="check"
                  primary
                >
                  {STRINGS.acceptLicense}
                </ControlButton>
              </div>
            </>
          )}
        </LoadingWrapper>
      </div>
    </Layout>
  );
};
