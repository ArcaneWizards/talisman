import { IDMap } from '@arcanejs/toolkit/util';

import { Base } from '@arcanejs/toolkit/components/base';
import { Namespace, FxPlaygroundComponent } from '../proto';

export class FxPlayground extends Base<
  Namespace,
  FxPlaygroundComponent,
  Record<never, never>
> {
  /** @hidden */
  public getProtoInfo(idMap: IDMap): FxPlaygroundComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'fx-playground',
      key: idMap.getId(this),
    };
  }
}
