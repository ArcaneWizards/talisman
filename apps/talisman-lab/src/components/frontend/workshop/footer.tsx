import { FC } from 'react';
import { ExternalLink } from './content';

export const Footer: FC = () => {
  return (
    <div
      className="
        flex items-center justify-center gap-1 border-t border-sigil-border
        bg-sigil-bg-dark p-1 text-[80%]
      "
    >
      <span>
        {'Created by'}&nbsp;
        <ExternalLink href="https://arcanewizards.com">
          Arcane Wizards
        </ExternalLink>
      </span>
    </div>
  );
};
