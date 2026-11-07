import { useCallback, useContext, useEffect, useRef } from 'react';
import { GameContext } from './games/context';

export const useMenuTimeout = (timeoutMs: number) => {
  const { changeGame } = useContext(GameContext);

  const menuResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetMenuResetTimeout = useCallback(() => {
    if (menuResetTimeout.current) clearTimeout(menuResetTimeout.current);
    menuResetTimeout.current = setTimeout(() => {
      changeGame('screen-saver');
    }, timeoutMs);
  }, [changeGame, timeoutMs]);

  useEffect(() => {
    resetMenuResetTimeout();
    return () => {
      if (menuResetTimeout.current) clearTimeout(menuResetTimeout.current);
    };
  }, [resetMenuResetTimeout]);

  return resetMenuResetTimeout;
};
