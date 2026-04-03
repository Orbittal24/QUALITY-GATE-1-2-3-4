// import sql from 'mssql';
// // SQL configuration objects (TML)
// const sqlConfig1 = {
//   user: 'admin9',
//   password: 'admin9',
//   database: 'REplus',
//   server: 'DESKTOP-5UJJEQ0',
//   options: {
//     encrypt: false,
//     trustServerCertificate: true,
//   }
// };


// export default async function handler(req, res) {
//   try {
//     if (req.method === 'POST') {
//       const { tableName, tableData, customerQRCode, moduleBarcode } = req.body;
//       if (!tableName || !tableData) {
//         return res.status(400).json({ message: 'TableName and tableData are required' });
//       }

//       for (const row of tableData) {
//         const { Sr_No, ...rowData } = row;
//         rowData.CustomerQRCode = customerQRCode || null;
//         // rowData.BatteryPackName = rowData.BatteryPackName || moduleBarcode || null;
//          rowData.moduleBarcode = rowData.moduleBarcode || moduleBarcode || null;

//         const columns = Object.keys(rowData).map(key => `[${key}]`).join(', ');
//         const values = Object.values(rowData).map(value => (value !== null ? `'${value}'` : 'NULL')).join(', ');

//         const insertQuery = `
//           INSERT INTO ${tableName} (${columns})
//           VALUES (${values});
//         `;
//         console.log('Insert Query:', insertQuery);
        
//         try {
//           await sql.query(insertQuery);
//         } catch (error) {
//           console.error('Error executing insert query:', error);
//           res.status(500).json({ message: 'Error inserting data', error });
//           return;
//         }

//         const updateQuery = `
//           UPDATE ${tableName}
//           SET [PreviouslyUsedBy] = 'Updated'
//           WHERE [Sr_No] = (SELECT MAX([Sr_No]) FROM ${tableName});
//         `;
//         console.log('Update Query:', updateQuery);

//         try {
//           await sql.query(updateQuery);
//         } catch (error) {
//           console.error('Error executing update query:', error);
//           res.status(500).json({ message: 'Error updating data', error });
//           return;
//         }
//       }

//       res.status(200).json({ message: 'Data inserted successfully' });
//     } else {
//       res.setHeader('Allow', ['POST']);
//       res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
//   } catch (error) {
//     console.error('Unexpected Error:', error);
//     res.status(500).json({ message: 'Internal Server Error', error });
//   } finally {
//     await sql.close();
//   }
// }



import sql from 'mssql';

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

export default async function handler(req, res) {
  try {
    await sql.connect(sqlConfig1);

    if (req.method === 'POST') {
      const { tableName, tableData, customerQRCode, moduleBarcode } = req.body;

      if (!tableName || !tableData) {
        return res.status(400).json({ message: 'TableName and tableData are required' });
      }

      // ✅ STEP 1: CHECK DUPLICATE (using FinalQRCode)
      const checkQuery = `
        SELECT TOP 1 * FROM ${tableName}
        WHERE FinalQRCode = '${tableData[0].FinalQRCode}'
      `;

      const checkResult = await sql.query(checkQuery);

      if (checkResult.recordset.length > 0) {
        return res.status(200).json({
          status: "exists",
          message: "Data already exists"
        });
      }

      // ✅ STEP 2: INSERT DATA
      for (const row of tableData) {
        const { Sr_No, ...rowData } = row;

        rowData.CustomerQRCode = customerQRCode || null;
        rowData.moduleBarcode = rowData.moduleBarcode || moduleBarcode || null;

        const columns = Object.keys(rowData).map(key => `[${key}]`).join(', ');
        const values = Object.values(rowData)
          .map(value => (value !== null ? `'${value}'` : 'NULL'))
          .join(', ');

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

      return res.status(200).json({
        status: "success",
        message: "Data inserted successfully"
      });
    }

    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error) {
    console.error('Unexpected Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  } finally {
    await sql.close();
  }
}
