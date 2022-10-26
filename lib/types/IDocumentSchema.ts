export type IDocument<S extends string> = { [key in S]: any };

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface ISchema<S extends string> {
  type: FieldType | Array<FieldType>;

  /**
   * https://json-schema.org/understanding-json-schema/structuring.html
   */
  $id?: string;
  $ref?: any;
  $anchor?: any;
  $defs?: any;

  /**
   * https://json-schema.org/understanding-json-schema/reference/generic.html
   */
  $comment?: string;
  title?: string;
  description?: string;
  default?: string;
  examples?: Array<{ [key in S]?: ISchema<S> }>;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;

  /**
   * https://json-schema.org/understanding-json-schema/reference/object.html#object
   */
  properties?: { [key in S]?: ISchema<S> };
  patternProperties?: { [key in S]?: ISchema<S> };
  additionalProperties?: { [key in S]?: ISchema<S> } | boolean;
  required?: Array<S>;
  propertyNames?: { [key in S]?: ISchema<S> };
  minProperties?: number;
  maxProperties?: number;

  /**
   * https://json-schema.org/understanding-json-schema/reference/array.html#array
   */
  items?: {
    type: FieldType | Array<FieldType>;
    enum?: Array<any>;
    properties?: { [key in S]?: ISchema<S> };
  };
  prefixItems?: Array<{ [key in S]?: ISchema<S> }>;
  contains?: { [key in S]?: ISchema<S> };
  minContains?: number;
  maxContains?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  /**
   * https://json-schema.org/understanding-json-schema/reference/string.html#string
   */
  minLength?: string;
  maxLength?: string;
  pattern?: string;

  /**
   * https://json-schema.org/understanding-json-schema/reference/numeric.html#number
   * https://json-schema.org/understanding-json-schema/reference/numeric.html#integer
   */
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;

  /**
   * https://json-schema.org/understanding-json-schema/reference/non_json_data.html
   */
  contentMediaType?: string;
  contentEncoding?: string;

  /**
   * https://json-schema.org/understanding-json-schema/reference/combining.html
   */
  allOf?: Array<{ [key in S]?: ISchema<S> }>;
  anyOf?: Array<{ [key in S]?: ISchema<S> }>;
  oneOf?: Array<{ [key in S]?: ISchema<S> }>;
  not?: Array<{ [key in S]?: ISchema<S> }>;
  if?: { [key in S]?: ISchema<S> };
  then?: { [key in S]?: ISchema<S> };
  else?: { [key in S]?: ISchema<S> };
}

export interface IDocumentValidation<S extends string> {
  $schema?: string;
  level: 'strict';
  schema: ISchema<S>;
}

export interface IDocumentSchema<S extends string> {
  name: string;
  id?: S;
  alias?: string;
  validation?: IDocumentValidation<S>;
  generatedId?: boolean;
  unique?: Array<S>[];
  getDocument: (data: Partial<IDocument<S>>) => IDocument<S>;
  toString?: (data: IDocument<S>) => string;
}

export const getDocumentFromCursor = <S extends string>(props: Array<S>, data: any[]): IDocument<S> =>
  props.reduce((doc: IDocument<S>, key: string, index: number): IDocument<S> => {
    doc[key as S] = data[index];
    return doc;
  }, {} as IDocument<S>);

export const getDocument = <S extends string>(
  props: { [key in S]: string },
  data?: Partial<IDocument<S>>,
  defaults?: Partial<IDocument<S>>,
): IDocument<S> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const values: IDocument<S> = { ...(defaults || {}), ...(data || {}) };
  return Object.keys(props).reduce((doc: IDocument<S>, key: string): IDocument<S> => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      doc[key as S] = values[key as S];
    }
    return doc;
  }, {} as IDocument<S>);
};
