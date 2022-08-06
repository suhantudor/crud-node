import { Condition, CRUDMySQLX, Filter, MySQLX, OffsetPagination, SortBy } from 'crud-node';

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

  await db.usingSession(async (session) => {
    await officeController.init(session);
    await employeeController.init(session);
  }, true);

  await db.usingSession(async (session) => {
    await officeController.deleteAll(session);
    await employeeController.deleteAll(session);
  }, true);

  await db.usingSession(async (session) => {
    await officeController.createDocument(session, {
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

    const sortOfficesByDateOfCreation = SortBy().desc(OfficeProps.places).toCriteria();

    const allOffices = await officeController.fetchAll(session, sortOfficesByDateOfCreation);

    console.log('All registered offices:', JSON.stringify(allOffices, null, 3));
  }, true);

  await db.usingSession(async (session) => {
    const filterOfficesInNYC = Filter.toCriteria(
      Filter.and(Condition.like('address.city', '%New York%'), Condition.gre(OfficeProps.places, 1)),
    );

    const sortOfficesByAvailablePlaces = SortBy().asc(OfficeProps.places).toCriteria();

    const pagination = OffsetPagination(1, 10);

    const officesInNYC = await officeController.filterDocumentsByCriteria(
      session,
      filterOfficesInNYC,
      pagination,
      sortOfficesByAvailablePlaces,
    );

    console.log('All offices in NY with available working places', JSON.stringify(officesInNYC, null, 3));

    const coworkingSpaces = await officeController.searchDocuments(
      session,
      {
        name: '%coworking%',
        officeCode: '%coworking%',
      },
      'OR',
    );

    console.log('All coworking spaces:', JSON.stringify(coworkingSpaces, null, 3));

    const flexibleWorkspaces = await officeController.searchDocumentsByCriteria(
      session,
      `${officeController.getSearchCriteria(OfficeProps.name, 'keyword1')}
        OR ${officeController.getSearchCriteria(OfficeProps.name, 'keyword2')}
        OR ${officeController.getSearchCriteria(OfficeProps.name, 'keyword3')}`,
      {
        keyword1: '%coworking%',
        keyword2: '%flexible workspace%',
        keyword3: '%serviced office space%',
      },
    );

    console.log('All flexible spaces', JSON.stringify(flexibleWorkspaces, null, 3));
  });

  await db.usingSession(async (session) => {
    const leslieBrett = await employeeController.createDocument(session, {
      email: 'leslie46@24mailin.com',
      firstName: 'Leslie',
      lastName: 'Brett',
    });

    const office = await officeController.findDocument(session, { officeCode: 'WORKVILLE' });

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

    const allEmployees = await employeeController.fetchAll(session);

    console.log('All employees:', JSON.stringify(allEmployees, null, 3));
  }, true);

  await db.usingSession(async (session) => {
    const firedEmployees = await employeeController.filterDocuments(session, {
      fired: true,
    });

    const deletedEmployeesRecords = await Promise.all(
      firedEmployees.data.map(async (firedEmployee) => employeeController.deleteDocument(session, firedEmployee._id)),
    );

    console.log('Deleted records of fired employees:', JSON.stringify(deletedEmployeesRecords, null, 3));
  }, true);

  await db.usingSession(async (session) => {
    await officeController.deleteAll(session);
    await employeeController.deleteAll(session);
  }, true);
};

example()
  .then(() => {
    process.exit();
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
