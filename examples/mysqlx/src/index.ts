import { CRUDMySQLX, MySQLX, OffsetPagination, SortBy } from 'crud-node';

import { employeeSchema } from './schemas/employee';
import { OfficeProps, officeSchema } from './schemas/office';

const example = async () => {
  // Connect to database
  const connection = {
    host: 'localhost',
    port: 33060,
    schema: 'db',
    password: 'user',
    user: 'user',
  };

  const pooling = {
    enabled: true,
    maxIdleTime: 30000,
    maxSize: 25,
    queueTimeout: 10000,
  };

  const settings = {
    ciCollation: 'utf8mb4_0900_ai_ci',
  };

  const db = new MySQLX(connection, { pooling }, settings);

  await db.connect();

  // Initialize CRUD Controllers
  const employeeController = new CRUDMySQLX(db, employeeSchema);

  const officeController = new CRUDMySQLX(db, officeSchema);

  await db.usingSession(async session => {
    await officeController.init(session);
    await employeeController.init(session);
  }, true);

  await db.usingSession(async session => {
    await officeController.createDocument(session, {
      _id: 'virtual-offices-of-new-york-city',
      officeCode: 'Virtual Offices of New York City',
      address: {
        country: 'United States',
        state: 'NY',
        city: 'New York',
        postalCode: '10016',
        line1: '347 5th Ave',
        line2: 'Suite 1402',
      },
      name: 'Virtual office rental in New York City, New York',
      places: 100,
    });

    await officeController.createDocument(session, {
      _id: 'nyc-office-suites',
      officeCode: 'NYC Office Suites',
      address: {
        country: 'United States',
        state: 'NY',
        city: 'New York',
        postalCode: '10019',
        line1: '1350 6th Ave',
        line2: 'floor 2',
      },
      name: 'Office space rental agency in New York City, New York',
      places: 0,
    });

    await officeController.createDocument(session, {
      _id: 'workville',
      officeCode: 'WORKVILLE',
      address: {
        country: 'United States',
        state: 'NY',
        city: 'New York',
        postalCode: '10018',
        line1: '1412 Broadway',
        line2: '21st Floor',
      },
      name: 'Coworking space in New York City, New York',
      places: 5,
    });

    await officeController.createDocument(session, {
      _id: 'grand-central-offices',
      officeCode: 'Grand Central Offices',
      address: {
        country: 'United States',
        state: 'NY',
        city: 'New York',
        postalCode: '10168',
        line1: '122 E 42nd St',
        line2: '4th Floor',
      },
      name: 'A 1-min walk from the Chrysler Building',
      places: 10,
    });

    await officeController.createDocument(session, {
      _id: 'crystal-workspaces',
      officeCode: 'Crystal Workspaces',
      address: {
        country: 'United States',
        state: 'CA',
        city: 'Lomita',
        postalCode: '90717',
        line1: '25433 Narbonne Ave',
      },
      name: 'Shared Office Space & Coworking in Lomita, California',
      places: 25,
    });

    const pagination = OffsetPagination(1, 10);

    const sortOfficesByDateOfCreation = SortBy().desc(OfficeProps.places).toCriteria();

    const allOffices = await officeController.getDocuments(session, pagination, sortOfficesByDateOfCreation);

    console.log('All registered offices:', JSON.stringify(allOffices, null, 3));

    const office = await officeController.getDocument(session, allOffices.data[0]._id);

    console.log('Office with the biggest amount of free spaces:', JSON.stringify(office, null, 3));
  }, true);

  await db.usingSession(async session => {
    try {
      await officeController.existsDocument(session, { [OfficeProps.officeCode]: 'WORKVILLE' });
      console.log('WORKVILLE was not registered');
    } catch (err) {
      console.log(err);
    }
  });

  await db.usingSession(async session => {
    const leslieBrett = await employeeController.createDocument(session, {
      email: 'leslie46@24mailin.com',
      firstName: 'Leslie',
      lastName: 'Brett',
    });

    const office = await officeController.getDocument(session, 'workville');

    if (office) {
      await employeeController.updateDocument(session, leslieBrett._id, {
        officeId: office._id,
        responsibilities: [
          'booking transport and accommodation',
          'organising meetings',
          'organising company events and conferences',
          'ordering stationery and IT equipment',
          'dealing with correspondence, complaints and queries',
        ],
      });
    }

    const mariaLeo = await employeeController.createDocument(session, {
      email: 'leo123@24mailin.com',
      firstName: 'Maria',
      lastName: 'Leo',
      responsibilities: [
        'translating and balancing incoming requests',
        'setting achievable and repeatable execution goals',
        'managing technical debt',
      ],
    });

    const joeSchmoe = await employeeController.createDocument(session, {
      email: 'Schmoe.Joe@24mailin.com',
      firstName: 'Joe',
      lastName: 'Schmoe',
      responsibilities: [
        'work with developers to design algorithms and flowcharts',
        'produce clean, efficient code based on specifications',
        'gather and evaluate user feedback',
      ],
    });

    await employeeController.updateDocument(session, mariaLeo._id, { fired: true });

    await employeeController.updateDocument(session, joeSchmoe._id, { fired: true });

    const allEmployees = await employeeController.getDocuments(session);

    console.log('All employees:', JSON.stringify(allEmployees, null, 3));
  }, true);

  await db.usingSession(async session => {
    const totalEmployees = await employeeController.getTotal(session);

    const employees = await employeeController.getDocuments(session, OffsetPagination(1, totalEmployees));

    const deletedEmployeesRecords = await Promise.all(
      employees.data.map(async employee => employeeController.deleteDocument(session, employee._id)),
    );

    console.log(
      'Deleted records of employees:',
      JSON.stringify(deletedEmployeesRecords, null, 3),
      'from:',
      totalEmployees,
    );

    const totalOffices = await officeController.getTotal(session);

    const offices = await officeController.getDocuments(session, OffsetPagination(1, totalOffices));

    const deletedOfficesRecords = await Promise.all(
      offices.data.map(async office => officeController.deleteDocument(session, office._id)),
    );

    console.log('Deleted records of offices:', JSON.stringify(deletedOfficesRecords, null, 3), 'from:', totalOffices);
  }, true);
};

example()
  .then(() => {
    process.exit();
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
