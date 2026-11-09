import { FC, useContext } from 'react';
import { RootContext } from '../context';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';

export const FXPlayground: FC = () => {
  const { changeGame } = useContext(RootContext);

  return (
    <div
      className="
        flex w-full max-w-[1015px] flex-col items-center gap-2 rounded-md
        bg-sigil-bg-dark p-2 text-sigil-foreground
      "
    >
      <ControlButton
        onClick={() => changeGame('main-menu')}
        variant="large"
        icon="arrow_back"
      >
        Main Menu
      </ControlButton>
      <div className="text-center">
        Press any button on your controller to see your controller light-up in
        response.
      </div>
    </div>
  );
};
