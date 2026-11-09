import { IDMap } from '@arcanejs/toolkit/util';

import { Base } from '@arcanejs/toolkit/components/base';
import { Namespace, TapAMoleComponent } from '../proto';

export type TapAMoleProps = Pick<TapAMoleComponent, 'state'>;

export class TapAMole extends Base<
  Namespace,
  TapAMoleComponent,
  TapAMoleProps
> {
  /** @hidden */
  public getProtoInfo(idMap: IDMap): TapAMoleComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'tap-a-mole',
      key: idMap.getId(this),
      state: this.props.state,
    };
  }
}
