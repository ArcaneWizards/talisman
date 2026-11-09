import { FC, useContext } from 'react';
import { TapAMoleComponent } from '../../../proto';
import { RootContext } from '../context';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';

type TapAMoleProps = {
  info: TapAMoleComponent;
};

export const TapAMole: FC<TapAMoleProps> = ({ info }) => {
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
        Try to tap the buttons that light-up as quickly as possible. You will
        lose points for pressing buttons that aren't lit up.
      </div>
      {info.state.mode === 'ready' && (
        <div className="text-center text-[2rem]">
          Press a green button to start the game
        </div>
      )}
      {info.state.mode === 'countdown' && (
        <div className="text-center text-[2rem]">Get ready...</div>
      )}
      {info.state.mode === 'playing' && (
        <div className="text-center text-[2rem]">{`Score: ${info.state.score}`}</div>
      )}
      {info.state.mode === 'finished' && (
        <>
          <div className="text-center text-[2rem]">{`Final Score: ${info.state.score}`}</div>
          <div className="text-center">
            Press a button on the controller to restart the game
          </div>
        </>
      )}
      {(info.state.mode === 'playing' || info.state.mode === 'finished') && (
        <>
          <div className="text-center">{`Hit: ${info.state.hit}`}</div>
          <div className="text-center">{`Miss: ${info.state.miss}`}</div>
        </>
      )}
    </div>
  );
};
