import { IDocument, IDocumentSchema, IDocumentValidation, getDocument } from 'crud-node';

export enum OfficeProps {
  _id = '_id',
  officeCode = 'officeCode',
  name = 'name',
  address = 'address',
  places = 'places',
}

export const validation: IDocumentValidation<OfficeProps> = {
  level: 'strict',
  schema: {
    type: 'object',
    description: 'Office',
    properties: {
      _id: { type: 'string' },
      officeCode: { type: 'string', description: 'The office code, used as unique identifier' },
      name: { type: 'string', description: 'The name of an office' },
      address: { type: 'object', description: 'The address of an office' },
      /**
      address: {
        country: string;
        city: string;
        postalCode: string;
        line1: string;
        line2?: string;
      }
      */
      places: { type: 'number', description: 'The number of places at an office' },
    },
    required: [OfficeProps._id, OfficeProps.officeCode],
  },
};

export const officeSchema: IDocumentSchema<OfficeProps> = {
  name: 'office',
  alias: 'office',
  validation,
  generatedId: false,
  unique: [[OfficeProps.officeCode]],
  getDocument: (data: Partial<IDocument<OfficeProps>>): IDocument<OfficeProps> => {
    const defaults: Partial<IDocument<OfficeProps>> = {};
    return getDocument(OfficeProps, data, defaults);
  },
};
