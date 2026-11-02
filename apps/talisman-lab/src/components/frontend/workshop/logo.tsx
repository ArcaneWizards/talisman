import { FC, useContext } from 'react';
import { SizeAwareDiv } from './size-aware-div';
import { ConfigContext } from './context';
import { LOGO_STATIC_URL_PATH, LOGO_URL_PATH } from '../../proto';

export const Logo: FC = () => {
  const {
    config: { animatedLogo },
  } = useContext(ConfigContext);
  return (
    <SizeAwareDiv className="w-full py-2">
      <img
        src={`/${animatedLogo ? LOGO_URL_PATH : LOGO_STATIC_URL_PATH}`}
        alt="LOGO"
        width="100%"
        className="h-logo w-full"
      />
    </SizeAwareDiv>
  );
};
