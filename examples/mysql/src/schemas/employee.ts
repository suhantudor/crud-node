import { IDocument, IDocumentSchema, generateId, getDocument } from 'crud-node';

export enum EmployeeProps {
  _id = '_id',
  createdAt = 'createdAt',
  email = 'email',
  lastName = 'lastName',
  firstName = 'firstName',
  responsibilities = 'responsibilities',
  officeId = 'officeId',
  fired = 'fired',
}

export const employeeSchema: IDocumentSchema<EmployeeProps> = {
  name: 'employee',
  alias: 'emp',
  generatedId: false,
  unique: [[EmployeeProps.email]],
  getDocument: (data: Partial<IDocument<EmployeeProps>>): IDocument<EmployeeProps> => {
    const createdAt = Date.now().toString();
    const defaults: Partial<IDocument<EmployeeProps>> = {
      _id: generateId(employeeSchema.alias),
      createdAt,
    };
    return getDocument(EmployeeProps, data, defaults);
  },
  toString: (data: IDocument<EmployeeProps>) => {
    return `${data.firstName} ${data.lastName}`;
  },
};
