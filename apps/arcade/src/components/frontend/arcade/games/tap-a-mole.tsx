import { FC, useContext, useEffect, useState } from 'react';
import { TapAMoleComponent } from '../../../proto';
import { RootContext } from '../context';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';
import { displayMillis } from '../../../../shared/util';

type TapAMoleProps = {
  info: TapAMoleComponent;
};

const Countdown: FC<{ timeMs: number }> = ({ timeMs }) => {
  const [text, setText] = useState('Get ready...');

  useEffect(() => {
    const runFrame = () => {
      frame = requestAnimationFrame(runFrame);
      const remaining = timeMs - Date.now();
      if (remaining <= 0) {
        setText(displayMillis(0));
        return;
      }
      setText(displayMillis(remaining));
    };

    let frame = requestAnimationFrame(runFrame);

    return () => cancelAnimationFrame(frame);
  }, [timeMs]);

  return (
    <div
      className="
        rounded-md bg-sigil-foreground px-1 py-0.5 text-center text-[2rem]
        text-sigil-bg-dark
      "
    >
      {text}
    </div>
  );
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
        <div className="text-center text-[2rem] text-sigil-usage-hint-foreground">
          Press a green button to start the game
        </div>
      )}
      {info.state.mode === 'error' && (
        <div className="text-center text-[2rem] text-sigil-usage-hint-foreground">
          {info.state.error}
        </div>
      )}
      {info.state.mode === 'countdown' && (
        <>
          <Countdown timeMs={info.state.gameStartTimeMs} />
          <div className="text-center text-[2rem] text-sigil-usage-hint-foreground">
            Get ready...
          </div>
        </>
      )}
      {info.state.mode === 'playing' && (
        <>
          <Countdown timeMs={info.state.gameEndTimeMs} />
          <div className="text-center text-[2rem] text-sigil-usage-hint-foreground">{`Score: ${info.state.score}`}</div>
        </>
      )}
      {info.state.mode === 'finished' && (
        <>
          <div className="text-center text-[2rem] text-sigil-usage-hint-foreground">{`Final Score: ${info.state.score}`}</div>
          <div className="text-center">
            Press a button on the controller to restart the game
          </div>
        </>
      )}
      {(info.state.mode === 'playing' || info.state.mode === 'finished') && (
        <>
          <div className="text-center text-sigil-success-foreground">{`Hit: ${info.state.hit}`}</div>
          <div className="text-center text-sigil-error-foreground">{`Miss: ${info.state.miss}`}</div>
        </>
      )}
    </div>
  );
};
