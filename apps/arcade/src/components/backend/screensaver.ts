import { IDMap } from '@arcanejs/toolkit/util';

import { Base } from '@arcanejs/toolkit/components/base';
import { Namespace, ScreensaverComponent } from '../proto';

export class ScreenSaver extends Base<
  Namespace,
  ScreensaverComponent,
  Record<never, never>
> {
  /** @hidden */
  public getProtoInfo(idMap: IDMap): ScreensaverComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'screensaver',
      key: idMap.getId(this),
    };
  }
}
