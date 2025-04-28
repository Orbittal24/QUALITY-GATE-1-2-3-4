import sql from 'mssql';

const sqlConfig = {
  user: "admin9",
  password: "admin9",
  database: "REplus",
  server: "DESKTOP-5UJJEQ0",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

export default async function handler(req, res) {
  try {
    await sql.connect(sqlConfig);

    if (req.method === 'POST') {
      const { tableName, tableData } = req.body;
      if (!tableName || !tableData) {
        return res.status(400).json({ message: 'TableName and tableData are required' });
      }

      for (const row of tableData) {
        const { Sr_No, ...rowData } = row;
        const columns = Object.keys(rowData).map(key => `[${key}]`).join(', ');
        const values = Object.values(rowData).map(value => `'${value}'`).join(', ');

        const insertQuery = `
          INSERT INTO ${tableName} (${columns})
          VALUES (${values});
        `;
        await sql.query(insertQuery);

        const updateQuery = `
          UPDATE ${tableName}
          SET [PreviouslyUsedBy] = 'Updated'
          WHERE [Sr_No] = (SELECT MAX([Sr_No]) FROM ${tableName});
        `;
        await sql.query(updateQuery);
      }

      res.status(200).json({ message: 'Data inserted successfully' });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await sql.close();
  }
}
