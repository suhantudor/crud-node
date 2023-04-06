import { IDocumentSchema, IDocument, getDocument, generateId } from 'crud-node';

export enum OfficeProps {
  _id = '_id',
  officeCode = 'officeCode',
  name = 'name',
  address = 'address',
  places = 'places',
}

export const officeSchema: IDocumentSchema<OfficeProps> = {
  name: 'office',
  alias: 'office',
  generatedId: false,
  unique: [[OfficeProps.officeCode]],
  getDocument: (data: Partial<IDocument<OfficeProps>>): IDocument<OfficeProps> => {
    const defaults: Partial<IDocument<OfficeProps>> = {
      _id: generateId(officeSchema.alias),
    };
    return getDocument(OfficeProps, data, defaults);
  },
};
