'use client';

import React, { useEffect, useState } from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Table,
  Label,
  FormGroup,
  Alert
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface TableDataRow {
  [key: string]: any;
}

const AdminChecklist: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    document.title = "TACO | QUALITY CHECK";
    fetchData();
  }, []);

  const [packNames, setPackNames] = useState<string[]>([]);
  const [modulePackNames, setModulePackNames] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [checklistDropdownOpen, setChecklistDropdownOpen] = useState(false);
  const [deleteDropdownOpen, setDeleteDropdownOpen] = useState(false);
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null);
  const [selectedModulePackName, setSelectedModulePackName] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [fullPageModal, setFullPageModal] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [columns, setColumns] = useState<string[]>(['Header 1']);
  const [rows, setRows] = useState<number>(1);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [batteryPackName, setBatteryPackName] = useState<string>('');
  const [checkedBy, setCheckedBy] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [checkboxMode, setCheckboxMode] = useState(false);
  const [rangeMode, setRangeMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number, colIndex: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/adminchecklist');
      const { packNames, modulePackNames, checklists } = response.data;
      setPackNames(packNames);
      setModulePackNames(modulePackNames);
      setChecklists(checklists);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
  const toggleModuleDropdown = () => setModuleDropdownOpen(prevState => !prevState);
  const toggleChecklistDropdown = () => setChecklistDropdownOpen(prevState => !prevState);
  const toggleDeleteDropdown = () => setDeleteDropdownOpen(prevState => !prevState);
  const toggleModal = () => {
    setBatteryPackName(selectedPackName || selectedModulePackName || '');
    setModal(!modal);
  };
  const toggleFullPageModal = () => setFullPageModal(!fullPageModal);
  const toggleCheckboxMode = () => setCheckboxMode(!checkboxMode);
  const toggleRangeMode = () => {
    setRangeMode(!rangeMode);
    setSelectedCell(null);
  };

  const removeDuplicateColumns = (data: any[][]) => {
    const seenHeaders = new Set();
    const filteredHeaders = data[0].filter((header: string) => {
      if (seenHeaders.has(header)) {
        return false;
      }
      seenHeaders.add(header);
      return true;
    });

    const headerIndices = filteredHeaders.map(header => data[0].indexOf(header));

    const filteredData = data.map(row => headerIndices.map(index => row[index]));
    return [filteredHeaders, ...filteredData.slice(1)];
  };

  const handleSelectPackName = async (packName: string) => {
    setSelectedPackName(packName);
    setSelectedModulePackName(null);
    try {
      const response = await axios.get(`/api/adminchecklist?packName=${packName}`);
      setBatteryPackName(response.data.batteryPackName);
    } catch (error) {
      console.error('Error fetching battery pack name:', error);
    }
  };

  const handleSelectModulePackName = async (packName: string) => {
    setSelectedModulePackName(packName);
    setSelectedPackName(null);
    try {
      const response = await axios.get(`/api/adminchecklist?modulePackName=${packName}`);
      setBatteryPackName(response.data.batteryPackName);
    } catch (error) {
      console.error('Error fetching battery pack name:', error);
    }
  };

  const handleSelectChecklist = async (checklistName: string) => {
    setSelectedChecklist(checklistName);
    try {
      const response = await axios.get(`/api/adminchecklist?tableName=${checklistName}`);
      const data = response.data.tableData;
      const headers = Object.keys(data[0]).filter(header => ![
        'CustomerQRCode',
        'BatteryPackName',
        'CheckedBy',
        'Status',
        'DateTime',
        'PreviouslyUsedBy'
      ].includes(header));
      const rows = data.map((row: TableDataRow, index: number) => [index + 1, ...headers.map(header => row[header])]);
      const filteredTableData = removeDuplicateColumns([['Sr_No', ...headers], ...rows]);
      setTableData(filteredTableData);
      setFullPageModal(true);
      setIsEditMode(true);
    } catch (error) {
      console.error('Error fetching checklist data:', error);
    }
  };

  const handleCreateChecklist = () => {
    const headers = Array.from({ length: columns.length }, (_, idx) => `Header ${idx + 1}`);
    setTableData([
      headers,
      ...Array.from({ length: rows }, () => Array(columns.length).fill(''))
    ]);
    toggleModal();
    toggleFullPageModal();
    setIsEditMode(false);
  };

  const handleSaveChecklist = async () => {
    if (!newChecklistName.trim() || (!selectedPackName && !selectedModulePackName)) return;

    const transformedTableData = tableData.map(row => row.map(cell => {
      if (typeof cell === 'object' && cell !== null) {
        if (cell.min !== undefined && cell.max !== undefined) {
          return `Range: ${cell.min}-${cell.max}`;
        } else if (cell.OK !== undefined || cell['Not OK'] !== undefined) {
          return 'Checkbox: OK, Not OK';
        }
      }
      return cell;
    }));

    try {
      const response = await axios.post('/api/adminchecklist', {
        ChecklistName: newChecklistName,
        PackName: selectedPackName || selectedModulePackName,
        batteryPackName,
        checkedBy,
        tableData: transformedTableData
      });

      setChecklists([...checklists, `${selectedPackName || selectedModulePackName}_${newChecklistName}`]);
      setSelectedChecklist(newChecklistName);
      setNewChecklistName('');
      setAlertMessage('Database table created successfully');
      console.log('Inserted data:', transformedTableData);
    } catch (error) {
      console.error('Error creating checklist:', error);
      setAlertMessage('Error creating database table');
    }
  };

  const handleEditChecklist = async () => {
    if (!selectedChecklist || (!selectedPackName && !selectedModulePackName)) return;

    const currentHeaders = tableData[0];

    const headerSet = new Set(currentHeaders);
    if (headerSet.size !== currentHeaders.length) {
      alert('Duplicate headers detected. Please ensure all headers are unique.');
      return;
    }

    const transformedTableData = tableData.map(row => row.map(cell => {
      if (typeof cell === 'object' && cell !== null) {
        if (cell.min !== undefined && cell.max !== undefined) {
          return `Range: ${cell.min}-${cell.max}`;
        } else if (cell.OK !== undefined || cell['Not OK'] !== undefined) {
          return 'Checkbox: OK, Not OK';
        }
      }
      return cell;
    }));

    try {
      const response = await axios.put('/api/adminchecklist', {
        ChecklistName: selectedChecklist,
        PackName: selectedPackName || selectedModulePackName,
        tableData: transformedTableData,
        previousHeaders: currentHeaders,
      });

      if (response.status === 200) {
        setAlertMessage('Checklist updated successfully');

        await handleSelectChecklist(selectedChecklist);
      } else {
        console.error('Unexpected response status:', response.status, response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error message:', error.message);
        console.error('Error response data:', error.response?.data);
        console.error('Error response status:', error.response?.status);
        console.error('Error request:', error.request);
      } else if (error instanceof Error) {
        console.error('Generic error message:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      setAlertMessage('Error updating checklist');
    }
  };

  const handleDeleteChecklist = async (checklistName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/api/adminchecklist?tableName=${checklistName}`);
        
        setChecklists(response.data.checklists);

        if (selectedChecklist === checklistName) {
          setSelectedChecklist(null);
        }

        setAlertMessage('Checklist deleted successfully');
        Swal.fire('Deleted!', 'Your checklist has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting checklist:', error);
        setAlertMessage('Error deleting checklist');
        Swal.fire('Error!', 'There was an error deleting your checklist.', 'error');
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire('Cancelled', 'Your checklist is safe :)', 'error');
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string | { OK: boolean; 'Not OK': boolean }) => {
    try {
      const newTableData = tableData.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx === rowIndex && cIdx === colIndex) {
            return value;
          }
          return cell;
        })
      );
      setTableData(newTableData);
    } catch (error) {
      console.error("Error updating cell:", error);
    }
  };

  const handleCheckboxChange = (rowIndex: number, colIndex: number, value: string) => {
    const newTableData = tableData.map((row, rIdx) => row.map((cell, cIdx) => {
      if (rIdx === rowIndex && cIdx === colIndex) {
        return {
          ...cell,
          [value]: !cell[value],
          [value === 'OK' ? 'Not OK' : 'OK']: false
        };
      }
      return cell;
    }));
    setTableData(newTableData);
  };

  const handleRangeChange = (rowIndex: number, colIndex: number, min: number, max: number) => {
    const newTableData = tableData.map((row, rIdx) => row.map((cell, cIdx) => {
      if (rIdx === rowIndex && cIdx === colIndex) {
        return {
          ...cell,
          min,
          max
        };
      }
      return cell;
    }));
    setTableData(newTableData);
  };

  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    const cell = tableData[rowIndex][colIndex];

    if (typeof cell === 'object') {
      // If it's a checkbox or range, reset the cell
      if (cell.OK !== undefined || cell['Not OK'] !== undefined || (cell.min !== undefined && cell.max !== undefined)) {
        const newTableData = tableData.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (rIdx === rowIndex && cIdx === colIndex) {
              return ''; // Reset the cell to an empty string
            }
            return cell;
          })
        );
        setTableData(newTableData);
      }
    }
  };

  const addColumn = () => {
    setTableData(prevTableData => prevTableData.map(row => [...row, '']));
    setColumns(prevColumns => [...prevColumns, `Header ${prevColumns.length + 1}`]);
  };

  const addRow = () => {
    const numberOfColumns = tableData[0].length;
    const newRow = Array(numberOfColumns).fill('');
    newRow[0] = (tableData.length + 1).toString(); // Ensure Sr_No is unique and correctly incremented
  
    setTableData(prevTableData => [...prevTableData, newRow]);
    setRows(prevRows => prevRows + 1);
  };
  

  const deleteColumn = (colIndex: number) => {
    const updatedData = tableData.map(row => row.filter((_, cIdx) => cIdx !== colIndex));
    setTableData(updatedData);
    setColumns(prevColumns => prevColumns.slice(0, -1));
  };

  const deleteRow = (rowIndex: number) => {
    setTableData(prevTableData => prevTableData.filter((_, rIdx) => rIdx !== rowIndex));
    setRows(prevRows => prevRows - 1);
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
          <DropdownToggle caret>
            {selectedPackName || 'SELECT PACKNAME'}
          </DropdownToggle>
          <DropdownMenu style={{ width: '400px' }}>
            {packNames.map((packName, index) => (
              <DropdownItem key={index} onClick={() => handleSelectPackName(packName)}>
                {packName}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Dropdown isOpen={moduleDropdownOpen} toggle={toggleModuleDropdown}>
          <DropdownToggle caret>
            {selectedModulePackName || 'SELECT MODULE PACKNAME'}
          </DropdownToggle>
          <DropdownMenu style={{ width: '400px' }}>
            {modulePackNames.map((packName, index) => (
              <DropdownItem key={index} onClick={() => handleSelectModulePackName(packName)}>
                {packName}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Dropdown isOpen={deleteDropdownOpen} toggle={toggleDeleteDropdown}>
          <DropdownToggle caret>
            Delete Checklist
          </DropdownToggle>
          <DropdownMenu style={{ width: '400px' }}>
            {checklists.map((checklist, index) => (
              <DropdownItem key={index} onClick={() => handleDeleteChecklist(checklist)}>
                {checklist}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {(selectedPackName || selectedModulePackName) && (
        <div style={{ marginTop: '20px' }}>
          <Dropdown isOpen={checklistDropdownOpen} toggle={toggleChecklistDropdown}>
            <DropdownToggle caret>
              {selectedChecklist || 'SELECT CHECKLIST'}
            </DropdownToggle>
            <DropdownMenu style={{ width: '400px' }}>
              {checklists.map((checklist, index) => (
                <DropdownItem key={index} onClick={() => handleSelectChecklist(checklist)}>
                  {checklist}
                </DropdownItem>
              ))}
              <DropdownItem divider />
              <DropdownItem onClick={toggleModal}>Create New Checklist</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

      <Modal isOpen={modal} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>Create New Checklist</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="checklistName">Enter new checklist name</Label>
            <Input
              id="checklistName"
              type="text"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              placeholder="Enter new checklist name"
            />
          </FormGroup>
          <FormGroup>
            <Label for="columns">Enter number of columns</Label>
            <Input
              id="columns"
              type="number"
              value={columns.length}
              onChange={(e) => {
                const newColumnsCount = parseInt(e.target.value);
                setColumns(Array.from({ length: newColumnsCount }, (_, idx) => `Header ${idx + 1}`));
              }}
              placeholder="Enter number of columns"
            />
          </FormGroup>
          <FormGroup>
            <Label for="rows">Enter number of rows</Label>
            <Input
              id="rows"
              type="number"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              placeholder="Enter number of rows"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleCreateChecklist}>Create</Button>{' '}
          <Button color="secondary" onClick={toggleModal}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={fullPageModal} toggle={toggleFullPageModal} size="xl" style={{ maxWidth: '100%', width: '100%' }}>
        <ModalHeader toggle={toggleFullPageModal}>
          {isEditMode ? 'Edit Checklist' : 'Create Checklist'}
        </ModalHeader>
        <ModalBody>
          {alertMessage && (
            <Alert color={alertMessage.includes('Error') ? 'danger' : 'success'}>
              {alertMessage}
            </Alert>
          )}
          <div className="d-flex mb-3">
            <Input type="text" className="mr-2" placeholder="Battery Pack Name" value={batteryPackName} readOnly />
            <Input type="text" className="mr-2" placeholder="Checked By" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} />
          </div>
          <Button color={checkboxMode ? "danger" : "success"} onClick={toggleCheckboxMode} className="mb-3">
            {checkboxMode ? "Disable Checkbox" : "Add Checkbox"}
          </Button>
          <Button color={rangeMode ? "danger" : "success"} onClick={toggleRangeMode} className="mb-3">
            {rangeMode ? "Disable Range" : "Set Range"}
          </Button>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Table bordered>
              <thead>
                <tr>
                  {tableData[0] && tableData[0].map((header, colIndex) => (
                    <th key={colIndex}>
                      <Input
                        type="text"
                        value={header}
                        onChange={(e) => handleCellChange(0, colIndex, e.target.value)}
                        readOnly={header === 'Sr_No'}
                      />
                      {header !== 'Sr_No' && (
                        <Button color="danger" onClick={() => deleteColumn(colIndex)}>Delete Column</Button>
                      )}
                    </th>
                  ))}
                  <th>
                    <Button color="success" onClick={addColumn}>Add Column</Button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {tableData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex + 1}>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          maxWidth: '200px',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex + 1, colIndex)} // Double-click handler
                        onClick={() => {
                          if (checkboxMode && typeof cell !== 'object') {
                            handleCellChange(rowIndex + 1, colIndex, { OK: false, 'Not OK': false });
                          } else if (rangeMode) {
                            setSelectedCell({ rowIndex: rowIndex + 1, colIndex });
                          }
                        }}
                      >
                        {rangeMode && selectedCell && selectedCell.rowIndex === rowIndex + 1 && selectedCell.colIndex === colIndex ? (
                          <div>
                            <Input
                              type="number"
                              placeholder="Min"
                              onChange={(e) => handleRangeChange(rowIndex + 1, colIndex, Number(e.target.value), cell ? cell.max : undefined)}
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              onChange={(e) => handleRangeChange(rowIndex + 1, colIndex, cell ? cell.min : undefined, Number(e.target.value))}
                            />
                          </div>
                        ) : (cell && typeof cell === 'object' && cell.min !== undefined && cell.max !== undefined) ? (
                          <div>
                            <p>Min: {cell.min}</p>
                            <p>Max: {cell.max}</p>
                          </div>
                        ) : (cell && typeof cell === 'object') ? (
                          <>
                            <Input
                              type="checkbox"
                              checked={cell.OK || false}
                              onChange={() => handleCheckboxChange(rowIndex + 1, colIndex, 'OK')}
                            /> OK
                            <Input
                              type="checkbox"
                              checked={cell['Not OK'] || false}
                              onChange={() => handleCheckboxChange(rowIndex + 1, colIndex, 'Not OK')}
                            /> Not OK
                          </>
                        ) : (
                          <textarea
                            id={`cell-${rowIndex + 1}-${colIndex}`}
                            value={cell || ''}
                            onChange={(e) => {
                              handleCellChange(rowIndex + 1, colIndex, e.target.value);
                              autoResizeTextarea(e);
                            }}
                            readOnly={colIndex === 0 && isEditMode}
                            style={{
                              width: '100%',
                              height: 'auto',
                              minHeight: '30px',
                              resize: 'none',
                              overflow: 'hidden',
                              fontSize: '18px'
                            }}
                          />
                        )}
                      </td>
                    ))}
                    <td>
                      <Button color="danger" onClick={() => deleteRow(rowIndex + 1)}>Delete Row</Button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={columns.length + 1}>
                    <Button color="success" onClick={addRow}>Add Row</Button>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={isEditMode ? handleEditChecklist : handleSaveChecklist}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>{' '}
          <Button color="secondary" onClick={toggleFullPageModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminChecklist;
