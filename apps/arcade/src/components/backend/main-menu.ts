import { IDMap } from '@arcanejs/toolkit/util';

import { Base } from '@arcanejs/toolkit/components/base';
import { Namespace, MainMenuComponent } from '../proto';

export class MainMenu extends Base<
  Namespace,
  MainMenuComponent,
  Record<never, never>
> {
  /** @hidden */
  public getProtoInfo(idMap: IDMap): MainMenuComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'main-menu',
      key: idMap.getId(this),
    };
  }
}
