// import React, { useState, useEffect } from 'react';
// import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input, Alert, Table, Button } from 'reactstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import axios from 'axios';
// import Swal from 'sweetalert2';
// import { useRouter } from 'next/navigation';
// import withReactContent from 'sweetalert2-react-content';

// const MySwal = withReactContent(Swal);

// type ChecklistItem = {
//   Sr_No: number;
//   CustomerQRCode: string;
//   BatteryPackName: string;
//   FinalQRCode: string;
//   CheckedBy: string;
//   DateTime: string;
//   Status?: string;
//   [key: string]: string | { OK: boolean; 'Not OK': boolean } | number | undefined;
// };

// const TableThree: React.FC = () => {
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [batteryPackName, setBatteryPackName] = useState<string>('');
//   const [customerQRCode, setCustomerQRCode] = useState<string>('');
//   const [moduleBarcode, setModuleBarcode] = useState<string>('');
//   const [checkedBy, setCheckedBy] = useState<string>('');
//   const [finalQRCode, setFinalQRCode] = useState<string>('');
//   const [tableNames, setTableNames] = useState<string[]>([]);
//   const [alertMessage, setAlertMessage] = useState<string | null>(null);
//   const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
//   const [selectedTableName, setSelectedTableName] = useState<string>('');
//   const [rangeCells, setRangeCells] = useState<{ [key: string]: { min: number, max: number } }>({});
//   const [adminCells, setAdminCells] = useState<{ [key: string]: boolean }>({});

//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem('auth');
//     if (!token) {
//       router.push('/');
//     }
//   }, [router]);

//   useEffect(() => {
//     if (customerQRCode || moduleBarcode) {
//       fetchPackNameAndQRCode();
//     }
//   }, [customerQRCode, moduleBarcode]);

//   useEffect(() => {
//     if (batteryPackName) {
//       fetchTableNames();
//     } else {
//       setDropdownOpen(false);
//     }
//   }, [batteryPackName]);

//   const fetchPackNameAndQRCode = async () => {
//     try {
//       console.log('Fetching pack name and QR code...');
//       const response = await axios.get(`/api/getPackName?customerQRCode=${customerQRCode}&moduleBarcode=${moduleBarcode}`);
//       console.log('Received response:', response.data);
//       setBatteryPackName(response.data.battery_pack_name);
//       setFinalQRCode(response.data.final_qrcode);
//     } catch (error) {
//       console.error('Error fetching battery pack name and final QR code:', error);
//       setAlertMessage('Error fetching battery pack name and final QR code. Please try again.');
//     }
//   };
  

//   const fetchTableNames = async () => {
//     try {
//       console.log('Fetching table names for pack:', batteryPackName);
//       const response = await axios.get(`/api/adminchecklist?packName=${batteryPackName}`);
//       console.log('Received table names:', response.data.tableNames);
//       setTableNames(response.data.tableNames || []);
//       setDropdownOpen(true);
//     } catch (error) {
//       console.error('Error fetching table names:', error);
//       setAlertMessage('Error fetching table names. Please check your network connection and try again.');
//     }
//   };

//   const handleQRCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setCustomerQRCode(event.target.value);
//     if (event.target.value) setModuleBarcode('');
//   };

//   const handleModuleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setModuleBarcode(event.target.value);
//     if (event.target.value) setCustomerQRCode('');
//   };

//   const handleSelectTableName = async (tableName: string) => {
//     try {
//       console.log('Selected table name:', tableName);
//       const response = await axios.get(`/api/adminchecklist?tableName=${tableName}`);
//       console.log('Received checklist data:', response.data.tableData);

//       if (response.data.tableData && response.data.tableData.length > 0) {
//         const data = response.data.tableData;

//         // Data processing logic
//         const newRangeCells: { [key: string]: { min: number, max: number } } = {};
//         const newAdminCells: { [key: string]: boolean } = {};
//         const updatedData = data.map((row: ChecklistItem, rowIndex: number) => {
//           const updatedRow = { ...row };

//           Object.entries(updatedRow).forEach(([key, value]) => {
//             if (typeof value === 'string') {
//               if (value.startsWith('Range:')) {
//                 const match = value.match(/Range: (\d+)-(\d+)/);
//                 if (match) {
//                   newRangeCells[`${rowIndex}-${key}`] = { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
//                   updatedRow[key] = '';
//                   newAdminCells[`${rowIndex}-${key}`] = true;
//                 }
//               } else if (value === '[object Object]' || value === 'Checkbox: OK, Not OK') {
//                 updatedRow[key] = { OK: false, 'Not OK': false };
//                 newAdminCells[`${rowIndex}-${key}`] = true;
//               } else if (value !== '') {
//                 newAdminCells[`${rowIndex}-${key}`] = true;
//               }
//             }
//           });

//           return updatedRow;
//         });

//         const clearedData = updatedData.map((row: ChecklistItem, rowIndex: number) => {
//           const clearedRow = { ...row };
//           Object.keys(clearedRow).forEach(key => {
//             if (!newAdminCells[`${rowIndex}-${key}`] && !newRangeCells[`${rowIndex}-${key}`]) {
//               clearedRow[key] = '';
//             }
//           });
//           return clearedRow;
//         });

//         setChecklistData(clearedData);
//         setCheckedBy(data[0].CheckedBy || '');
//         setSelectedTableName(tableName);
//         setDropdownOpen(false);
//         setRangeCells(newRangeCells);
//         setAdminCells(newAdminCells);
//       } else {
//         console.warn('No data returned for the selected table.');
//         setAlertMessage('No data available for the selected checklist.');
//       }
//     } catch (error) {
//       console.error('Error fetching checklist data:', error);
//       setAlertMessage('Error fetching checklist data. Please check your network connection and try again.');
//     }
//   };

//   const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

//   const handleCellChange = (rowIndex: number, key: string, event: React.ChangeEvent<HTMLInputElement>) => {
//     const value = event.target.value;
//     const updatedData = [...checklistData];
//     updatedData[rowIndex][key] = value;

//     const rangeCell = rangeCells[`${rowIndex}-${key}`];
//     if (rangeCell) {
//       updatedData[rowIndex]['Status'] = (Number(value) >= rangeCell.min && Number(value) <= rangeCell.max) ? 'OK' : 'Not OK';
//     }

//     setChecklistData(updatedData);
//   };

//   const handleCheckedByChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setCheckedBy(event.target.value);
//     const updatedData = checklistData.map((row) => ({ ...row, CheckedBy: event.target.value }));
//     setChecklistData(updatedData);
//   };

//   const handleCheckboxChange = (rowIndex: number, key: string, checkboxKey: 'OK' | 'Not OK') => {
//     const updatedData = [...checklistData];
//     updatedData[rowIndex][key] = checkboxKey === "OK" ? { OK: true, 'Not OK': false } : { OK: false, 'Not OK': true };

//     updatedData[rowIndex]['Status'] = checkboxKey;

//     setChecklistData(updatedData);
//   };

//   const handleSubmit = async () => {
//     try {
//       console.log('Submitting checklist data for table:', selectedTableName);
//       const response = await axios.post('/api/usechecklist', {
//         tableName: selectedTableName,
//         tableData: checklistData,
//         customerQRCode,
//         moduleBarcode
//       });
//       console.log('Submit response:', response);

//       if (response.status === 200) {
//         setAlertMessage('Data updated successfully');
//         MySwal.fire({
//           title: 'Success',
//           text: 'Data updated successfully',
//           icon: 'success',
//           customClass: {
//             confirmButton: 'swal2-confirm-button'
//           }
//         });

//         const clearedData = checklistData.map((row, rowIndex) => {
//           const clearedRow = { ...row };
//           Object.keys(clearedRow).forEach(key => {
//             if (!adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]) {
//               clearedRow[key] = '';
//             }
//           });
//           return clearedRow;
//         });
//         setChecklistData(clearedData);
//       } else {
//         setAlertMessage('Error updating data');
//         MySwal.fire({
//           title: 'Error',
//           text: 'Error updating data',
//           icon: 'error',
//           customClass: {
//             confirmButton: 'swal2-confirm-button'
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error updating data:', error);
//       setAlertMessage('Error updating data. Please try again.');
//       MySwal.fire({
//         title: 'Error',
//         text: 'Error updating data',
//         icon: 'error',
//         customClass: {
//           confirmButton: 'swal2-confirm-button'
//         }
//       });
//     }
//   };

//   return (
//     <div>
//       {alertMessage && <Alert color="danger">{alertMessage}</Alert>}
//       {moduleBarcode ? null : (
//         <Input
//           type="text"
//           value={customerQRCode}
//           onChange={handleQRCodeChange}
//           placeholder="Enter or scan Customer QR Code"
//           className="mb-3"
//         />
//       )}
//       {customerQRCode ? null : (
//         <Input
//           type="text"
//           value={moduleBarcode}
//           onChange={handleModuleBarcodeChange}
//           placeholder="Enter or scan Module Barcode"
//           className="mb-3"
//         />
//       )}
//       <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
//         <DropdownToggle tag="div" className="w-100">
//           <Input
//             type="text"
//             value={batteryPackName}
//             readOnly
//             placeholder="Battery Pack Name"
//             className="mb-3"
//           />
//         </DropdownToggle>
//         {tableNames.length > 0 && (
//           <DropdownMenu style={{ width: '100%' }}>
//             {tableNames.map((tableName, index) => (
//               <DropdownItem key={index} onClick={() => handleSelectTableName(tableName)}>
//                 {tableName}
//               </DropdownItem>
//             ))}
//           </DropdownMenu>
//         )}
//       </Dropdown>

//       {selectedTableName && (
//         <div className="mt-3">
//           <h4>Checklist Data for {selectedTableName}</h4>
//           <div className="mb-3">
//             {moduleBarcode ? null : (
//               <Input
//                 type="text"
//                 value={customerQRCode}
//                 readOnly
//                 placeholder="Customer QR Code"
//                 className="mb-3"
//               />
//             )}
//             <Input
//               type="text"
//               value={batteryPackName}
//               readOnly
//               placeholder="Battery Pack Name"
//               className="mb-3"
//             />
//             {customerQRCode ? (
//               <Input
//                 type="text"
//                 value={finalQRCode}
//                 readOnly
//                 placeholder="Final QR Code"
//                 className="mb-3"
//               />
//             ) : (
//               <Input
//                 type="text"
//                 value={finalQRCode}
//                 readOnly
//                 placeholder="Final QR Code"
//                 className="mb-3"
//               />
//             )}
//             <Input
//               type="text"
//               value={checkedBy}
//               onChange={handleCheckedByChange}
//               placeholder="Checked By"
//               className="mb-3"
//             />
//           </div>
//           {checklistData.length > 0 ? (
//             <Table bordered>
//               <thead>
//                 <tr>
//                   <th>Sr_No</th>
//                   {Object.keys(checklistData[0])
//                     .filter(key => key !== 'CustomerQRCode' && key !== 'battery_pack_name' && key !== 'final_qrcode' && key !== 'DateTime' && key !== 'CheckedBy' && key !== 'Sr_No' && key !== 'Status' && key !== 'PreviouslyUsedBy')
//                     .map((key, index) => (
//                       <th key={index}>{key}</th>
//                     ))}
//                   <th>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {checklistData.map((row, rowIndex) => (
//                   <tr key={rowIndex}>
//                     <td>{rowIndex + 1}</td>
//                     {Object.entries(row)
//                       .filter(([key]) => key !== 'CustomerQRCode' && key !== 'battery_pack_name' && key !== 'final_qrcode' && key !== 'DateTime' && key !== 'CheckedBy' && key !== 'Sr_No' && key !== 'Status' && key !== 'PreviouslyUsedBy')
//                       .map(([key, value], colIndex) => (
//                         <td key={colIndex}>
//                           {typeof value === 'object' && value !== null && ('OK' in value || 'Not OK' in value) ? (
//                             <div>
//                               <Input
//                                 type="checkbox"
//                                 checked={(value as { OK: boolean; 'Not OK': boolean }).OK}
//                                 onChange={() => handleCheckboxChange(rowIndex, key, 'OK')}
//                                 readOnly={adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]}
//                               /> OK
//                               <Input
//                                 type="checkbox"
//                                 checked={(value as { OK: boolean; 'Not OK': boolean })['Not OK']}
//                                 onChange={() => handleCheckboxChange(rowIndex, key, 'Not OK')}
//                                 readOnly={adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]}
//                               /> Not OK
//                             </div>
//                           ) : (
//                             rangeCells[`${rowIndex}-${key}`] ? (
//                               <Input
//                                 type="text"
//                                 value={String(value)}
//                                 onChange={(event) => handleCellChange(rowIndex, key, event)}
//                                 style={{
//                                   backgroundColor: value !== ''
//                                     ? (Number(value) >= rangeCells[`${rowIndex}-${key}`].min && Number(value) <= rangeCells[`${rowIndex}-${key}`].max)
//                                       ? 'green'
//                                       : 'red'
//                                     : 'white'
//                                 }}
//                               />
//                             ) : (
//                               <Input
//                                 type="text"
//                                 value={String(value)}
//                                 onChange={(event) => handleCellChange(rowIndex, key, event)}
//                                 readOnly={adminCells[`${rowIndex}-${key}`]}
//                               />
//                             )
//                           )}
//                         </td>
//                       ))}
//                     <td>{row.Status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           ) : (
//             <Alert color="warning">No data available for this checklist</Alert>
//           )}
//           <Button color="primary" onClick={handleSubmit} className="mt-3">Submit</Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TableThree;



import React, { useState, useEffect } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input, Alert, Table, Button } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

type ChecklistItem = {
  Sr_No: number;
  CustomerQRCode: string;
  BatteryPackName: string;
  FinalQRCode: string;
  CheckedBy: string;
  DateTime: string;
  Status?: string;
  [key: string]: string | { OK: boolean; 'Not OK': boolean } | number | undefined;
};

const TableThree: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [batteryPackName, setBatteryPackName] = useState<string>('');
  const [customerQRCode, setCustomerQRCode] = useState<string>('');
  const [moduleBarcode, setModuleBarcode] = useState<string>('');
  const [checkedBy, setCheckedBy] = useState<string>('');
  const [finalQRCode, setFinalQRCode] = useState<string>('');
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [rangeCells, setRangeCells] = useState<{ [key: string]: { min: number, max: number } }>({});
  const [adminCells, setAdminCells] = useState<{ [key: string]: boolean }>({});

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (customerQRCode || moduleBarcode) {
      fetchPackNameAndQRCode();
    }
  }, [customerQRCode, moduleBarcode]);

  useEffect(() => {
    if (batteryPackName) {
      fetchTableNames();
    } else {
      setDropdownOpen(false);
    }
  }, [batteryPackName]);

 const fetchPackNameAndQRCode = async () => {
  try {
    console.log('Fetching pack name and QR code...');
    if (moduleBarcode) {
      // When module barcode is used, set PackName directly from moduleBarcode
      setBatteryPackName(moduleBarcode);
      setFinalQRCode(moduleBarcode); // Or whatever logic you need for final QR code
    } else {
      const response = await axios.get(`/api/getPackName?customerQRCode=${customerQRCode}&moduleBarcode=${moduleBarcode}`);
      console.log('Received response:', response.data);
      setBatteryPackName(response.data.battery_pack_name);
      setFinalQRCode(response.data.final_qrcode);
    }
  } catch (error) {
    console.error('Error fetching battery pack name and final QR code:', error);
    setAlertMessage('Error fetching battery pack name and final QR code. Please try again.');
  }
};
  

  const fetchTableNames = async () => {
    try {
      console.log('Fetching table names for pack:', batteryPackName);
      const response = await axios.get(`/api/adminchecklist?packName=${batteryPackName}`);
      console.log('Received table names:', response.data.tableNames);
      setTableNames(response.data.tableNames || []);
      setDropdownOpen(true);
    } catch (error) {
      console.error('Error fetching table names:', error);
      setAlertMessage('Error fetching table names. Please check your network connection and try again.');
    }
  };

  const handleQRCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerQRCode(event.target.value);
    if (event.target.value) setModuleBarcode('');
  };

  const handleModuleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModuleBarcode(event.target.value);
    if (event.target.value) setCustomerQRCode('');
  };

  const handleSelectTableName = async (tableName: string) => {
    try {
      console.log('Selected table name:', tableName);
      const response = await axios.get(`/api/adminchecklist?tableName=${tableName}`);
      console.log('Received checklist data:', response.data.tableData);

      if (response.data.tableData && response.data.tableData.length > 0) {
        const data = response.data.tableData;

        // Data processing logic
        const newRangeCells: { [key: string]: { min: number, max: number } } = {};
        const newAdminCells: { [key: string]: boolean } = {};
        const updatedData = data.map((row: ChecklistItem, rowIndex: number) => {
          const updatedRow = { ...row };

          Object.entries(updatedRow).forEach(([key, value]) => {
            if (typeof value === 'string') {
              if (value.startsWith('Range:')) {
                const match = value.match(/Range: (\d+)-(\d+)/);
                if (match) {
                  newRangeCells[`${rowIndex}-${key}`] = { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
                  updatedRow[key] = '';
                  newAdminCells[`${rowIndex}-${key}`] = true;
                }
              } else if (value === '[object Object]' || value === 'Checkbox: OK, Not OK') {
                updatedRow[key] = { OK: false, 'Not OK': false };
                newAdminCells[`${rowIndex}-${key}`] = true;
              } else if (value !== '') {
                newAdminCells[`${rowIndex}-${key}`] = true;
              }
            }
          });

          return updatedRow;
        });

        const clearedData = updatedData.map((row: ChecklistItem, rowIndex: number) => {
          const clearedRow = { ...row };
          Object.keys(clearedRow).forEach(key => {
            if (!newAdminCells[`${rowIndex}-${key}`] && !newRangeCells[`${rowIndex}-${key}`]) {
              clearedRow[key] = '';
            }
          });
          return clearedRow;
        });

        setChecklistData(clearedData);
        setCheckedBy(data[0].CheckedBy || '');
        setSelectedTableName(tableName);
        setDropdownOpen(false);
        setRangeCells(newRangeCells);
        setAdminCells(newAdminCells);
      } else {
        console.warn('No data returned for the selected table.');
        setAlertMessage('No data available for the selected checklist.');
      }
    } catch (error) {
      console.error('Error fetching checklist data:', error);
      setAlertMessage('Error fetching checklist data. Please check your network connection and try again.');
    }
  };

  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

  const handleCellChange = (rowIndex: number, key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const updatedData = [...checklistData];
    updatedData[rowIndex][key] = value;

    const rangeCell = rangeCells[`${rowIndex}-${key}`];
    if (rangeCell) {
      updatedData[rowIndex]['Status'] = (Number(value) >= rangeCell.min && Number(value) <= rangeCell.max) ? 'OK' : 'Not OK';
    }

    setChecklistData(updatedData);
  };

  const handleCheckedByChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedBy(event.target.value);
    const updatedData = checklistData.map((row) => ({ ...row, CheckedBy: event.target.value }));
    setChecklistData(updatedData);
  };

  const handleCheckboxChange = (rowIndex: number, key: string, checkboxKey: 'OK' | 'Not OK') => {
    const updatedData = [...checklistData];
    updatedData[rowIndex][key] = checkboxKey === "OK" ? { OK: true, 'Not OK': false } : { OK: false, 'Not OK': true };

    updatedData[rowIndex]['Status'] = checkboxKey;

    setChecklistData(updatedData);
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting checklist data for table:', selectedTableName);
    // Prepare the data with correct PackName
    // Prepare the data with correct PackName
    const submitData = checklistData.map(item => ({
      ...item,
      PackName: finalQRCode, // Use finalQRCode as PackName
      CustomerQRCode: customerQRCode || null, // Include customerQRCode if available
      FinalQRCode: finalQRCode, // Include finalQRCode
      DateTime: new Date().toISOString(), // Add current timestamp
      Status: item.Status || 'Pending' // Ensure Status has a value
    }));

    console.log('Submitting data:', submitData); // Log the data being submitted

    const response = await axios.post('/api/usechecklist', {
      tableName: selectedTableName,
      tableData: submitData,
      customerQRCode: customerQRCode || null,
      moduleBarcode: moduleBarcode || null
    });

    console.log('Submit response:', response);

      if (response.status === 200) {
        setAlertMessage('Data updated successfully');
        MySwal.fire({
          title: 'Success',
          text: 'Data updated successfully',
          icon: 'success',
          customClass: {
            confirmButton: 'swal2-confirm-button'
          }
        });

        const clearedData = checklistData.map((row, rowIndex) => {
          const clearedRow = { ...row };
          Object.keys(clearedRow).forEach(key => {
            if (!adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]) {
              clearedRow[key] = '';
            }
          });
          return clearedRow;
        });
        setChecklistData(clearedData);
      } else {
        setAlertMessage('Error updating data');
        MySwal.fire({
          title: 'Error',
          text: 'Error updating data',
          icon: 'error',
          customClass: {
            confirmButton: 'swal2-confirm-button'
          }
        });
      }
    } catch (error) {
      console.error('Error updating data:', error);
      setAlertMessage('Error updating data. Please try again.');
      MySwal.fire({
        title: 'Error',
        text: 'Error updating data',
        icon: 'error',
        customClass: {
          confirmButton: 'swal2-confirm-button'
        }
      });
    }
  };

  return (
    <div>
      {alertMessage && <Alert color="danger">{alertMessage}</Alert>}
      {moduleBarcode ? null : (
        <Input
          type="text"
          value={customerQRCode}
          onChange={handleQRCodeChange}
          placeholder="Enter or scan Customer QR Code"
          className="mb-3"
        />
      )}
      {customerQRCode ? null : (
        <Input
          type="text"
          value={moduleBarcode}
          onChange={handleModuleBarcodeChange}
          placeholder="Enter or scan Module Barcode"
          className="mb-3"
        />
      )}
      <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
        <DropdownToggle tag="div" className="w-100">
          <Input
            type="text"
            value={finalQRCode}
            readOnly
            placeholder="Battery Pack Name"
            className="mb-3"
          />
        </DropdownToggle>
        {tableNames.length > 0 && (
          <DropdownMenu style={{ width: '100%' }}>
            {tableNames.map((tableName, index) => (
              <DropdownItem key={index} onClick={() => handleSelectTableName(tableName)}>
                {tableName}
              </DropdownItem>
            ))}
          </DropdownMenu>
        )}
      </Dropdown>

      {selectedTableName && (
        <div className="mt-3">
          <h4>Checklist Data for123 {selectedTableName}</h4>
          <div className="mb-3">
            {moduleBarcode ? null : (
              <Input
                type="text"
                value={customerQRCode}
                readOnly
                placeholder="Customer QR Code"
                className="mb-3"
              />
            )}
            <Input
              type="text"
              value={finalQRCode}
              readOnly
              placeholder="Battery Pack Name"
              className="mb-3"
            />
            {customerQRCode ? (
              <Input
                type="text"
                value={finalQRCode}
                readOnly
                placeholder="Final QR Code"
                className="mb-3"
              />
            ) : (
              <Input
                type="text"
                value={finalQRCode}
                readOnly
                placeholder="Final QR Code"
                className="mb-3"
              />
            )}
            <Input
              type="text"
              value={checkedBy}
              onChange={handleCheckedByChange}
              placeholder="Checked By"
              className="mb-3"
            />
          </div>
          {checklistData.length > 0 ? (
            <Table bordered>
              <thead>
                <tr>
                  <th>Sr_No</th>
                  {Object.keys(checklistData[0])
                    .filter(key => key !== 'CustomerQRCode' && key !== 'battery_pack_name' && key !== 'final_qrcode' && key !== 'DateTime' && key !== 'CheckedBy' && key !== 'Sr_No' && key !== 'Status' && key !== 'PreviouslyUsedBy')
                    .map((key, index) => (
                      <th key={index}>{key}</th>
                    ))}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checklistData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{rowIndex + 1}</td>
                    {Object.entries(row)
                      .filter(([key]) => key !== 'CustomerQRCode' && key !== 'battery_pack_name' && key !== 'final_qrcode' && key !== 'DateTime' && key !== 'CheckedBy' && key !== 'Sr_No' && key !== 'Status' && key !== 'PreviouslyUsedBy')
                      .map(([key, value], colIndex) => (
                        <td key={colIndex}>
                          {typeof value === 'object' && value !== null && ('OK' in value || 'Not OK' in value) ? (
                            <div>
                              <Input
                                type="checkbox"
                                checked={(value as { OK: boolean; 'Not OK': boolean }).OK}
                                onChange={() => handleCheckboxChange(rowIndex, key, 'OK')}
                                readOnly={adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]}
                              /> OK
                              <Input
                                type="checkbox"
                                checked={(value as { OK: boolean; 'Not OK': boolean })['Not OK']}
                                onChange={() => handleCheckboxChange(rowIndex, key, 'Not OK')}
                                readOnly={adminCells[`${rowIndex}-${key}`] && !rangeCells[`${rowIndex}-${key}`]}
                              /> Not OK
                            </div>
                          ) : (
                            rangeCells[`${rowIndex}-${key}`] ? (
                              <Input
                                type="text"
                                value={String(value)}
                                onChange={(event) => handleCellChange(rowIndex, key, event)}
                                style={{
                                  backgroundColor: value !== ''
                                    ? (Number(value) >= rangeCells[`${rowIndex}-${key}`].min && Number(value) <= rangeCells[`${rowIndex}-${key}`].max)
                                      ? 'green'
                                      : 'red'
                                    : 'white'
                                }}
                              />
                            ) : (
                              <Input
                                type="text"
                                value={String(value)}
                                onChange={(event) => handleCellChange(rowIndex, key, event)}
                                readOnly={adminCells[`${rowIndex}-${key}`]}
                              />
                            )
                          )}
                        </td>
                      ))}
                    <td>{row.Status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert color="warning">No data available for this checklist</Alert>
          )}
          <Button color="primary" onClick={handleSubmit} className="mt-3">Submit</Button>
        </div>
      )}
    </div>
  );
};

export default TableThree;

