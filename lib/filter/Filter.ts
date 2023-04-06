import { generateVarName } from '../utils';

import { FILTER_LEVEL, FILTER_OPERATIONS, FilterCondition, FilterGroup, GROUP_OPERATION } from './FilterBy';

export type FilterCriteria = {
  statement: string;
  variables: { [key: string]: any };
};

export class Condition {
  static eq<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.EQ.code, value };
  }

  static in<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.IN.code, value };
  }

  static gr<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.GR.code, value };
  }

  static gre<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.GRE.code, value };
  }

  static like<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.LIKE.code, value };
  }

  static ls<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.LS.code, value };
  }

  static lse<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.LSE.code, value };
  }

  static noteq<T>(field: string, value: T): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.NEQ.code, value };
  }

  static empty(field: string): FilterCondition {
    return { level: FILTER_LEVEL.CONDITION, field, operation: FILTER_OPERATIONS.EMPTY.code, value: undefined };
  }

  static toCriteria(filterCondition: FilterCondition): FilterCriteria {
    const { field, operation, value } = filterCondition;

    const filterOperation = Object.values(FILTER_OPERATIONS).find(({ code }) => code === operation);
    if (!filterOperation) {
      throw new Error('Unsupported filter operation');
    }
    const varName: string = generateVarName(5);
    const variables = { [varName]: value };

    const statement = filterOperation.operand(field, varName);

    return { statement, variables };
  }
}

export class Filter {
  static and(...filterGroups: Array<FilterGroup | FilterCondition | undefined>): FilterGroup {
    const items: Array<FilterGroup | FilterCondition> = filterGroups
      ? filterGroups.reduce((res: Array<FilterGroup | FilterCondition>, filterGroup) => {
          if (filterGroup) {
            res.push(filterGroup);
          }
          return res;
        }, [])
      : [];
    return { level: FILTER_LEVEL.GROUP, operation: GROUP_OPERATION.AND, items };
  }

  static or(...filterGroups: Array<FilterGroup | FilterCondition | undefined>): FilterGroup {
    const items: Array<FilterGroup | FilterCondition> = filterGroups
      ? filterGroups.reduce((res: Array<FilterGroup | FilterCondition>, filterGroup) => {
          if (filterGroup) {
            res.push(filterGroup);
          }
          return res;
        }, [])
      : [];
    return { level: FILTER_LEVEL.GROUP, operation: GROUP_OPERATION.OR, items };
  }

  static toCriteria(filterGroup: FilterGroup): FilterCriteria {
    if (!filterGroup) return { statement: '', variables: {} };
    const { items, operation } = filterGroup;

    if (!items) {
      throw new Error('Unsupported filter operation');
    }

    if (!items.length) return { statement: '', variables: {} };

    let variables = {};
    const statement = items
      .map((item: FilterGroup | FilterCondition): string => {
        if (!item) return '';
        let itemCriteria;
        switch (item.level) {
          case FILTER_LEVEL.GROUP:
            itemCriteria = Filter.toCriteria(item);
            break;
          case FILTER_LEVEL.CONDITION:
            itemCriteria = Condition.toCriteria(item);
            break;
          default:
            throw new Error('Unsupported filter operation');
        }
        if (!itemCriteria.statement.trim()) return '';
        variables = { ...variables, ...itemCriteria.variables };
        return itemCriteria.statement;
      })
      .filter((item) => !!item.trim())
      .join(` ${operation} `);

    return { statement: statement.trim().length > 1 ? `(${statement})` : '', variables };
  }
}
