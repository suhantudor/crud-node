import { DbError, dbErrors } from '../errors';

/**
 * 
 * Example of sorting JSON
 * 
[
  {
    "field": "",
    "order": "ASC|DESC"
  },
  {
    "field": "",
    "order": "ASC|DESC"
  },
]
 */

export enum ORDER {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortCondition {
  field: string;
  order: ORDER;
}

export type Sort = Array<SortCondition>;

export class Sorting {
  sort: Sort;
  fields: Array<string>;

  constructor() {
    this.sort = [];
    this.fields = [];
  }

  toCriteria(): Sort {
    return this.sort;
  }

  private addConditions(order: ORDER, fields: Array<string>): Sorting {
    fields.forEach((field) => {
      if (this.fields.includes(field)) {
        throw new DbError(dbErrors.duplicatedSortingCondition());
      }
      const condition: SortCondition = { field, order };
      this.sort.push(condition);
      this.fields.push(field);
    });
    return this;
  }

  asc(...fields: Array<string>): Sorting {
    this.addConditions(ORDER.ASC, fields);
    return this;
  }

  desc(...fields: Array<string>): Sorting {
    this.addConditions(ORDER.DESC, fields);
    return this;
  }
}

export const SortBy = (): Sorting => {
  const s = new Sorting();
  return s;
};
