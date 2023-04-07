/**
{
  "level": "group",
  "operation": "AND|OR",
  "items": [
    {
      "level": "condition",
      "field": "",
      "operation": "=|!=|<|<=|>=|>|like|in",
      "value": ""
    },
    {
      "level": "condition",
      "field": "",
      "operation": "=|!=|<|<=|>=|>|like|in",
      "value": ""
    },
    {
      "level": "group",
      "operation": "AND|OR",
      "items": [
        {
          "level": "group",
          "operation": "AND|OR",
          "items": [
            {
              "level": "condition",
              "field": "",
              "operation": "=|!=|<|<=|>=|>|like|in",
              "value": ""
            }
          ]
        }
      ]
    }
  ]
}
*/

export enum GROUP_OPERATION {
  AND = 'AND',
  OR = 'OR',
}

export enum FILTER_LEVEL {
  CONDITION = 'c',
  GROUP = 'g',
}

export interface FilterCondition {
  level: FILTER_LEVEL.CONDITION;
  field: string;
  operation: string;
  value: any;
}

export interface FilterGroup {
  level: FILTER_LEVEL.GROUP;
  operation: GROUP_OPERATION;
  items: Array<FilterGroup | FilterCondition>;
}

export const FILTER_OPERATIONS = {
  NEQ: {
    code: '!=',
    operand: (field: string, value: any): string => `(${field} != :${value})`,
    description: 'Not equal',
  },
  EQ: {
    code: '=',
    operand: (field: string, value: any): string => `(${field} = :${value})`,
    description: 'Equal',
  },
  GR: {
    code: '>',
    operand: (field: string, value: any): string => `(${field} > :${value})`,
    description: 'Greater',
  },
  GRE: {
    code: '>=',
    operand: (field: string, value: any): string => `(${field} >= :${value})`,
    description: 'Greater or equal',
  },
  LS: {
    code: '<',
    operand: (field: string, value: any): string => `(${field} < :${value})`,
    description: 'Less',
  },
  LSE: {
    code: '<=',
    operand: (field: string, value: any): string => `(${field} <= :${value})`,
    description: 'Less or equal',
  },
  LIKE: {
    code: 'like',
    operand: (field: string, value: any): string => `(LOWER(${field}) LIKE LOWER(:${value}))`,
    description: 'Like',
  },
  IN: {
    code: 'in',
    operand: (field: string, value: any): string => `(${field} IN :${value})`,
    description: 'in',
  },
  EMPTY: {
    code: 'empty',
    operand: (field: string): string => `(ISNULL(${field}))`,
    description: 'empty',
  },
};
