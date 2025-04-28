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
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { customerQRCode, moduleBarcode } = req.query;

      if (!customerQRCode && !moduleBarcode) {
        return res.status(400).json({ message: 'CustomerQRCode or ModuleBarcode is required' });
      }

      let query;
      await sql.connect(sqlConfig2);
      
      if (customerQRCode) {
        query = `
          SELECT TOP (1000) [battery_pack_name] AS PackName, [final_qrcode] AS FinalQRCode
          FROM [REplus].[dbo].[final_qrcode_details]
          WHERE [CustomerQRCode] = @code
        `;
      } else if (moduleBarcode) {
        query = `
          SELECT TOP (1000) [PackName], [FinalQRCode]
          FROM [REplus].[dbo].[station_status]
          WHERE [ModuleBarcode] = @code
        `;
      }

      const request = new sql.Request();
      request.input('code', sql.NVarChar, customerQRCode || moduleBarcode);
      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Battery pack name or final QR code not found' });
      }

      res.status(200).json({
        battery_pack_name: result.recordset[0].PackName,
        final_qrcode: result.recordset[0].FinalQRCode
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error fetching battery pack name and final QR code:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await sql.close();
  }
}
