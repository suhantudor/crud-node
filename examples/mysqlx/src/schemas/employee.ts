import { IDocumentSchema, IDocumentValidation, IDocument, getDocument, generateId } from 'crud-node';

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

export const validation: IDocumentValidation<EmployeeProps> = {
  level: 'strict',
  schema: {
    type: 'object',
    description: 'Employee',
    properties: {
      _id: { type: 'string' },
      createdAt: { type: 'string', description: 'Timestamp when the record was created' },
      email: {
        type: 'string',
        description: 'The email of an employee, used as unique identifier for account registration',
      },
      lastName: { type: 'string', description: 'Last name of an employee' },
      firstName: { type: 'string', description: 'First name of an employee' },
      responsibilities: {
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true,
        description: 'The responsibilities of an employee',
      },
      officeId: { type: 'string', description: 'The id of office, employee works at' },
      fired: { type: 'boolean', description: '' },
    },
    required: [EmployeeProps._id, EmployeeProps.email],
  },
};

export const employeeSchema: IDocumentSchema<EmployeeProps> = {
  name: 'employee',
  alias: 'emp',
  validation,
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
