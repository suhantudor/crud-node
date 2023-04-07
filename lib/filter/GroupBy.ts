/**
[
  {
    "field": "",
    "alias": "",
    "aggregate": "COUNT|MAX|MIN|SUM|AVG"
  },
  {
    "field": "",
    "alias": "",
  },
]
 */

export enum AGG {
  COUNT = 'COUNT',
  MAX = 'MAX',
  MIN = 'MIN',
  SUM = 'SUM',
  AVG = 'AVG',
}

export interface GroupCondition<F, T extends string> {
  field: F;
  alias: T;
  aggregate?: AGG;
}

export type Group<F extends string, T extends string> = Array<GroupCondition<F, T>>;
