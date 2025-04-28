import sql from 'mssql';

// SQL configuration objects (TML)
const sqlConfig1 = {
  user: 'admin9',
  password: 'admin9',
  database: 'REplus',
  server: 'DESKTOP-5UJJEQ0',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

// SQL configuration for taco_treceability
const sqlConfig2 = {
  user: 'admin9',
  password: 'admin9',
  database: 'REplus',
  server: 'DESKTOP-5UJJEQ0',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

// Helper function to log and set the current database context
const logAndSetDatabaseContext = async (sqlConfig, databaseName) => {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query(`USE ${databaseName}; SELECT DB_NAME() AS CurrentDatabase`);
    console.log('Current Database Context Set To:', result.recordset[0].CurrentDatabase);
  } catch (error) {
    console.error(`Error setting database context to ${databaseName}:`, error);
    throw error;
  }
};

// Function to safely close SQL connection
const safeCloseConnection = async () => {
  if (sql.connected) {
    try {
      await sql.close();
      console.log('SQL connection closed.');
    } catch (err) {
      console.error('Error closing SQL connection:', err);
    }
  }
};

// Function to sanitize values before inserting them into SQL
const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return value.replace(/'/g, "''");
  }
  return value;
};

// Function to check if a table exists in the database
const tableExists = async (tableName) => {
  const checkTableQuery = `
    SELECT * 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = '${tableName.replace(/[\[\]]/g, '')}'
  `;
  const result = await sql.query(checkTableQuery);
  return result.recordset.length > 0;
};

// Function to create a new checklist table dynamically
const createChecklistTable = async (packName, checklistName, headers) => {
  const tableName = `${packName}_${checklistName}`;
  const columnsDefinitions = headers
    .map(header => `[${header}] NVARCHAR(MAX)`)
    .join(', ');

  const createTableQuery = `
    CREATE TABLE ${tableName} (
      [Sr_No] INT IDENTITY(1,1) PRIMARY KEY,
      [CustomerQRCode] NVARCHAR(MAX),
      [BatteryPackName] NVARCHAR(MAX),
      [CheckedBy] NVARCHAR(MAX),
      ${columnsDefinitions},
      [Status] NVARCHAR(MAX),
      [DateTime] DATETIME,
      [PreviouslyUsedBy] NVARCHAR(MAX)
    );
  `;
  console.log('Create Table Query:', createTableQuery);

  await logAndSetDatabaseContext(sqlConfig1, 'REplus');

  try {
    await sql.query(createTableQuery);
    console.log('Table created successfully:', tableName);
  } catch (error) {
    console.error('Error creating table:', error);
    throw new Error(`Failed to create table: ${tableName}`);
  }

  // Insert the table name into the master table for tracking
  const insertTableNameQuery = `INSERT INTO [REplus].[dbo].[Mst_ChecklistMaster] (TableName) VALUES ('${sanitizeValue(tableName)}');`;
  console.log('Insert Table Name Query:', insertTableNameQuery);

  try {
    await sql.query(insertTableNameQuery);
  } catch (error) {
    console.error('Error inserting table name into master table:', error);
    throw error;
  }

  return tableName;
};

// Function to insert data into the dynamically created table
const insertDataIntoTable = async (tableName, dataRows, headers, customerQRCode, batteryPackName, checkedBy) => {
  await logAndSetDatabaseContext(sqlConfig1, 'REplus');

  for (const row of dataRows) {
    const transformedRow = headers.map((header, index) => {
      let value = row[index];
      if (value === undefined || value === null) {
        return ''; 
      }
      if (typeof value === 'object') {
        if (value.min !== undefined && value.max !== undefined) {
          return `Range: ${value.min}-${value.max}`;
        } else if (value.OK !== undefined || value['Not OK'] !== undefined) {
          return value.OK ? 'Checkbox: OK' : (value['Not OK'] ? 'Checkbox: Not OK' : 'Checkbox: OK, Not OK');
        }
      }
      return value;
    });

    const sanitizedValues = transformedRow.map(value => sanitizeValue(value));

    const insertDataQuery = `
      INSERT INTO ${tableName} ([CustomerQRCode], [BatteryPackName], [CheckedBy], ${headers.map(header => `[${header}]`).join(', ')}, [Status], [DateTime], [PreviouslyUsedBy])
      VALUES ('${sanitizeValue(customerQRCode)}', '${sanitizeValue(batteryPackName)}', '${sanitizeValue(checkedBy)}', ${sanitizedValues.map(value => (value !== 'NULL' ? `'${value}'` : value)).join(', ')}, 'Pending', GETDATE(), NULL);
    `;

    try {
      console.log('Insert Data Query:', insertDataQuery);
      await sql.query(insertDataQuery);
      console.log(`Inserted row into ${tableName}:`, transformedRow);
    } catch (error) {
      console.error('Error inserting data:', error);
    }
  }
};

// Function to delete a dynamically created checklist table
const deleteChecklistTable = async (tableName) => {
  await logAndSetDatabaseContext(sqlConfig1, 'REplus');

  if (await tableExists(tableName)) {
    const deleteTableQuery = `DROP TABLE ${tableName};`;
    console.log('Delete Table Query:', deleteTableQuery);
    try {
      await sql.query(deleteTableQuery);
    } catch (error) {
      console.error('Error deleting table:', error);
      throw error;
    }
  } else {
    console.log(`Table ${tableName} does not exist.`);
  }

  const deleteTableNameQuery = `DELETE FROM [REplus].[dbo].[Mst_ChecklistMaster] WHERE TableName = '${sanitizeValue(tableName)}';`;
  console.log('Delete Table Name Query:', deleteTableNameQuery);

  try {
    await sql.query(deleteTableNameQuery);
  } catch (error) {
    console.error('Error deleting table name from master table:', error);
    throw error;
  }
};

const updateChecklistTable = async (tableName, headers, previousHeaders, dataRows) => {
  await logAndSetDatabaseContext(sqlConfig1, 'REplus');

  if (!await tableExists(tableName)) {
    throw new Error(`Table ${tableName} does not exist.`);
  }

  const currentColumnsResult = await sql.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = '${tableName.replace(/[\[\]]/g, '')}'
  `);
  const currentColumns = currentColumnsResult.recordset.map(row => row.COLUMN_NAME);

  // Add or rename columns as needed
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const previousHeader = previousHeaders[i];
    if (header !== 'Sr_No' && previousHeader !== 'Sr_No') {
      if (currentColumns.includes(previousHeader) && !currentColumns.includes(header)) {
        const renameColumnQuery = `EXEC sp_rename '${tableName}.${previousHeader}', '${header}', 'COLUMN'`;
        try {
          await sql.query(renameColumnQuery);
        } catch (error) {
          console.error(`Error renaming column ${previousHeader} to ${header}:`, error);
        }
      } else if (!currentColumns.includes(header)) {
        const addColumnQuery = `ALTER TABLE ${tableName} ADD [${header}] NVARCHAR(MAX)`;
        try {
          await sql.query(addColumnQuery);
        } catch (error) {
          console.error(`Error adding column ${header}:`, error);
        }
      }
    }
  }

  // Drop columns that are not in the headers
  for (const col of currentColumns) {
    if (!headers.includes(col) && col !== 'Sr_No' && col !== 'CustomerQRCode' && col !== 'BatteryPackName' && col !== 'CheckedBy' && col !== 'Status' && col !== 'DateTime' && col !== 'PreviouslyUsedBy') {
      const dropColumnQuery = `ALTER TABLE ${tableName} DROP COLUMN [${col}]`;
      try {
        await sql.query(dropColumnQuery);
      } catch (error) {
        console.error(`Error dropping column ${col}:`, error);
      }
    }
  }

  // Loop through data rows to determine if they need to be updated or inserted
  for (const row of dataRows) {
    const srNoIndex = headers.indexOf('Sr_No');
    const id = row[srNoIndex];

    // Check if the row exists in the database
    const checkRowExistsQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE [Sr_No] = ${id}`;
    const rowExistsResult = await sql.query(checkRowExistsQuery);
    const rowExists = rowExistsResult.recordset[0].count > 0;

    const transformedRow = row.map(value => {
      if (typeof value === 'object' && value !== null) {
        if (value.min !== undefined && value.max !== undefined) {
          return `Range: ${value.min}-${value.max}`;
        } else if (value.OK !== undefined || value['Not OK'] !== undefined) {
          return value.OK ? 'Checkbox: OK' : 'Checkbox: Not OK';
        }
      }
      return value;
    });

    if (rowExists) {
      // Update existing row
      const setClause = headers
        .map((header, index) => header !== 'Sr_No' ? `[${header}] = '${transformedRow[index]}'` : null)
        .filter(clause => clause !== null)
        .join(', ');

      const updateDataQuery = `UPDATE ${tableName} SET ${setClause} WHERE [Sr_No] = ${id}`;
      try {
        await sql.query(updateDataQuery);
        console.log(`Updated row with Sr_No ${id} in ${tableName}`);
      } catch (error) {
        console.error(`Error updating row in ${tableName}:`, error);
      }
    } else {
      // Insert new row (excluding Sr_No)
      const sanitizedValues = transformedRow.slice(1).map(value => sanitizeValue(value));

      const insertDataQuery = `
        INSERT INTO ${tableName} (${headers.slice(1).map(header => `[${header}]`).join(', ')}, [Status], [DateTime], [PreviouslyUsedBy])
        VALUES (${sanitizedValues.map(value => (value !== 'NULL' ? `'${value}'` : value)).join(', ')}, 'Pending', GETDATE(), NULL);
      `;
      try {
        await sql.query(insertDataQuery);
        console.log(`Inserted new row into ${tableName}`);
      } catch (error) {
        console.error(`Error inserting new row into ${tableName}:`, error);
      }
    }
  }
};



// Main handler function for API requests
export default async function handler(req, res) {
  const tableName = req.query.tableName || req.body.tableName;
  console.log("tableName:", tableName);

  try {
    if (req.method === 'POST') {
      const { ChecklistName, PackName, tableData, customerQRCode, batteryPackName, checkedBy } = req.body;
      if (!PackName || !tableData) {
        console.log('Missing PackName or tableData in POST request:', req.body);
        return res.status(400).json({ message: 'PackName and tableData are required' });
      }

      const headers = tableData[0];
      const dataRows = tableData.slice(1);

      const createdTableName = await createChecklistTable(PackName, ChecklistName, headers);
      await insertDataIntoTable(createdTableName, dataRows, headers, customerQRCode, batteryPackName, checkedBy);

      res.status(201).json({ ChecklistName, TableName: createdTableName });

    } else if (req.method === 'DELETE') {
      if (!tableName) {
        console.log('Missing tableName in DELETE request:', req.query);
        return res.status(400).json({ message: 'TableName is required' });
      }

      await deleteChecklistTable(tableName);

      const checklistsQuery = 'SELECT TableName FROM [REplus].[dbo].[Mst_ChecklistMaster] WHERE TableName IS NOT NULL';
      const checklistsResult = await sql.query(checklistsQuery);
      const checklists = checklistsResult.recordset.map(row => row.TableName);

      res.status(200).json({ message: 'Checklist deleted successfully', checklists });

    } else if (req.method === 'PUT') {
      const { ChecklistName, PackName, tableData, previousHeaders } = req.body;

      console.log('Received PUT request with data:', req.body);

      if (!PackName || !tableData || !previousHeaders) {
        console.log('Missing PackName, tableData, or previousHeaders in PUT request:', req.body);
        return res.status(400).json({ message: 'PackName, tableData, and previousHeaders are required' });
      }

      const headers = tableData[0];
      const dataRows = tableData.slice(1);

      console.log('Headers extracted from tableData:', headers);
      console.log('Data rows extracted from tableData:', dataRows);

      await updateChecklistTable(ChecklistName, headers, previousHeaders, dataRows);
      res.status(200).json({ message: 'Checklist updated successfully' });

    } else if (req.method === 'GET') {
      const { packName, modulePackName } = req.query;

      if (packName) {
        await logAndSetDatabaseContext(sqlConfig2, 'taco_treceability');
        const customerQRCodeQuery = `SELECT CustomerQRCode, battery_pack_name FROM [REplus].[dbo].[final_qrcode_details] WHERE battery_pack_name = '${sanitizeValue(packName)}'`;
        const customerQRCodeResult = await sql.query(customerQRCodeQuery);
        const customerQRCode = customerQRCodeResult.recordset.length > 0 ? customerQRCodeResult.recordset[0].CustomerQRCode : null;
        const batteryPackName = customerQRCodeResult.recordset.length > 0 ? customerQRCodeResult.recordset[0].battery_pack_name : null;

        const tableNamesQuery = `SELECT TableName FROM [REplus].[dbo].[Mst_ChecklistMaster] WHERE TableName LIKE '%${sanitizeValue(packName)}%'`;
        const tableNamesResult = await sql.query(tableNamesQuery);
        const tableNames = tableNamesResult.recordset.filter(async (row) => await tableExists(row.TableName)).map(row => row.TableName);

        return res.status(200).json({ tableNames, customerQRCode, batteryPackName });
      }

      if (modulePackName) {
        await logAndSetDatabaseContext(sqlConfig2, 'taco_treceability');
        const modulePackNameQuery = `SELECT PackName FROM [REplus].[dbo].[station_status] WHERE PackName = '${sanitizeValue(modulePackName)}'`;
        const modulePackNameResult = await sql.query(modulePackNameQuery);
        const packName = modulePackNameResult.recordset.length > 0 ? modulePackNameResult.recordset[0].PackName : null;

        const tableNamesQuery = `SELECT TableName FROM [REplus].[dbo].[Mst_ChecklistMaster] WHERE TableName LIKE '%${sanitizeValue(modulePackName)}%'`;
        const tableNamesResult = await sql.query(tableNamesQuery);
        const tableNames = tableNamesResult.recordset.filter(async (row) => await tableExists(row.TableName)).map(row => row.TableName);

        return res.status(200).json({ tableNames, packName });
      }

      if (tableName) {
        await logAndSetDatabaseContext(sqlConfig1, 'REplus');
        const query = `SELECT * FROM ${sanitizeValue(tableName)} WHERE [PreviouslyUsedBy] IS NULL OR [PreviouslyUsedBy] <> 'Updated'`;
        console.log('Select Table Data Query:', query);
        const result = await sql.query(query);
        console.log('Table Data Result:', result.recordset);
        return res.status(200).json({ tableData: result.recordset });
      }

      await logAndSetDatabaseContext(sqlConfig2, 'taco_treceability');
      const packNamesQuery = 'SELECT DISTINCT battery_pack_name FROM [REplus].[dbo].[final_qrcode_details]';
      const modulePackNamesQuery = 'SELECT DISTINCT PackName FROM [REplus].[dbo].[station_status]';
      const checklistsQuery = 'SELECT TableName FROM [REplus].[dbo].[Mst_ChecklistMaster] WHERE TableName IS NOT NULL';
      const packNamesResult = await sql.query(packNamesQuery);
      const modulePackNamesResult = await sql.query(modulePackNamesQuery);
      const checklistsResult = await sql.query(checklistsQuery);

      const packNames = packNamesResult.recordset.map(row => row.battery_pack_name);
      const modulePackNames = modulePackNamesResult.recordset.map(row => row.PackName);
      const checklists = checklistsResult.recordset.filter(async (row) => await tableExists(row.TableName)).map(row => row.TableName);

      res.status(200).json({ packNames, modulePackNames, checklists });

    } else {
      res.setHeader('Allow', ['POST', 'GET', 'DELETE', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  } finally {
    await safeCloseConnection();
  }
}
