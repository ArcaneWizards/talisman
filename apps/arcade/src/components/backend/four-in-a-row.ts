import { IDMap } from '@arcanejs/toolkit/util';

import { Base } from '@arcanejs/toolkit/components/base';
import { Namespace, FourInARowComponent } from '../proto';

export type FourInARowProps = Pick<FourInARowComponent, 'state'>;

export class FourInARow extends Base<
  Namespace,
  FourInARowComponent,
  FourInARowProps
> {
  /** @hidden */
  public getProtoInfo(idMap: IDMap): FourInARowComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'four-in-a-row',
      key: idMap.getId(this),
      state: this.props.state,
    };
  }
}
