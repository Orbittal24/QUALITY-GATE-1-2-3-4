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

    if (req.method === 'GET') {
      const { customerQRCode } = req.query;
      if (!customerQRCode) {
        return res.status(400).json({ message: 'CustomerQRCode is required' });
      }

      const result = await sql.query`SELECT [battery_pack_name], [final_qrcode] FROM [REplus].[dbo].[final_qrcode_details] WHERE [CustomerQRCode] = ${customerQRCode}`;

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Battery pack name or final QR code not found' });
      }

      res.status(200).json({ 
        battery_pack_name: result.recordset[0].battery_pack_name,
        final_qrcode: result.recordset[0].final_qrcode
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await sql.close();
  }
}
