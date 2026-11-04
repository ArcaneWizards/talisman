import { ComponentPropsWithoutRef, FC } from 'react';
import { SizeAwareDiv } from './size-aware-div';
import { LOGO_STATIC_URL_PATH, LOGO_URL_PATH } from '../../proto';

export const RawLogo: FC<
  Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
    animatedLogo: boolean;
  }
> = ({ animatedLogo, ...props }) => {
  return (
    <img
      src={`/${animatedLogo ? LOGO_URL_PATH : LOGO_STATIC_URL_PATH}`}
      alt="LOGO"
      {...props}
    />
  );
};

export const Logo: FC<{ animatedLogo: boolean }> = ({ animatedLogo }) => {
  return (
    <SizeAwareDiv>
      <RawLogo
        animatedLogo={animatedLogo}
        width="100%"
        className="h-logo w-full"
      />
    </SizeAwareDiv>
  );
};
