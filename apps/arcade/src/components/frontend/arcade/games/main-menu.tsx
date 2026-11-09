import { FC, useContext } from 'react';
import {
  GAMES,
  GAMES_EXCLUDING_MAIN_MENU,
} from '../../../../arcade/games/context';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';
import { RootContext } from '../context';
import { Thumbnail } from '../shared/thumbnail';

export const MainMenu: FC = () => {
  const { changeGame } = useContext(RootContext);

  return (
    <div
      className="
        flex w-full max-w-[1015px] flex-col items-center gap-2 rounded-md
        bg-sigil-bg-dark p-2 text-sigil-foreground
      "
    >
      <div className="text-center">
        Click a button to start a game, or press the corresponding coloured
        button on your controller.
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {GAMES_EXCLUDING_MAIN_MENU.map((id) => (
          <ControlButton
            key={id}
            onClick={() => changeGame(id)}
            variant="large"
          >
            <span className="flex flex-col items-center justify-center gap-2">
              {GAMES[id].name}
              <Thumbnail game={id} className="w-[150px] max-w-[50vw]" />
            </span>
          </ControlButton>
        ))}
      </div>
    </div>
  );
};
