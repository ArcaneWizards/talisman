import { FC } from 'react';
import { SizeAwareDiv } from './size-aware-div';
import { LOGO_STATIC_URL_PATH, LOGO_URL_PATH } from '../../proto';

export const Logo: FC<{ animatedLogo: boolean }> = ({ animatedLogo }) => {
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
