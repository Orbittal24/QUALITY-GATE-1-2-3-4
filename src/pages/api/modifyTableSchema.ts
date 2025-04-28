
import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

// Configure your MSSQL database connection
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

async function handleAddColumn(req: NextApiRequest, res: NextApiResponse) {
  const { tableName, newColumn } = req.body;

  if (!tableName || !newColumn) {
    return res.status(400).json({ error: 'Table name and column name are required' });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    await pool.request().query(`ALTER TABLE ${tableName} ADD ${newColumn} NVARCHAR(50)`);
    res.status(200).json({ message: 'Column added successfully' });
  } catch (error) {
    console.error('Error adding column to table:', error);
    res.status(500).json({ error: 'Failed to add column to table' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request received:', req.method, req.url);
  
  switch (req.method) {
    case 'POST':
      return handleAddColumn(req, res);
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
