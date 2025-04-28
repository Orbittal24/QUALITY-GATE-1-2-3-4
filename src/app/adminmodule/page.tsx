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
import Swal from 'sweetalert2'; // Import SweetAlert2

const AdminChecklistModule = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (!token) {
      router.push('/')
    }
  }, []);

  useEffect(() => {
    document.title = "TACO | QUALITY CHECK";
    fetchData();
  }, []);

  const [packNames, setPackNames] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checklistDropdownOpen, setChecklistDropdownOpen] = useState(false);
  const [deleteDropdownOpen, setDeleteDropdownOpen] = useState(false); // New state for delete dropdown
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [fullPageModal, setFullPageModal] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [columns, setColumns] = useState<number>(1);
  const [rows, setRows] = useState<number>(1);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [batteryPackName, setBatteryPackName] = useState<string>('');
  const [checkedBy, setCheckedBy] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [checkboxMode, setCheckboxMode] = useState(false); // Toggleable checkbox mode
  const [rangeMode, setRangeMode] = useState(false); // Toggleable range mode
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number, colIndex: number } | null>(null); // Track selected cell

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/adminchecklistmodule');
      const { packNames, checklists } = response.data;
      setPackNames(packNames);
      setChecklists(checklists);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
  const toggleChecklistDropdown = () => setChecklistDropdownOpen(prevState => !prevState);
  const toggleDeleteDropdown = () => setDeleteDropdownOpen(prevState => !prevState); // Toggle function for delete dropdown
  const toggleModal = () => setModal(!modal);
  const toggleFullPageModal = () => setFullPageModal(!fullPageModal);
  const toggleCheckboxMode = () => setCheckboxMode(!checkboxMode); // Toggle checkbox mode
  const toggleRangeMode = () => {
    setRangeMode(!rangeMode);
    setSelectedCell(null); // Reset selected cell when toggling range mode
  };

  const handleSelectPackName = async (packName: string) => {
    setSelectedPackName(packName);
    try {
      const response = await axios.get(`/api/adminchecklistmodule?packName=${packName}`);
      setBatteryPackName(response.data.batteryPackName);
    } catch (error) {
      console.error('Error fetching battery pack name:', error);
    }
  };

  const handleSelectChecklist = async (checklistName: string) => {
    setSelectedChecklist(checklistName);
    try {
      const response = await axios.get(`/api/adminchecklistmodule?tableName=${checklistName}`);
      const data = response.data.tableData;
      const headers = Object.keys(data[0]);
      const rows = data.map((row: any) => headers.map(header => row[header]));
      setTableData([headers, ...rows]);
      setFullPageModal(true); // Open the modal to display the checklist
    } catch (error) {
      console.error('Error fetching checklist data:', error);
    }
  };

  const handleCreateChecklist = () => {
    const headers = Array.from({ length: columns }, (_, idx) => `Header ${idx + 1}`);
    setTableData([
      headers, // Define headers
      ...Array.from({ length: rows }, () => Array(columns).fill(''))
    ]);
    toggleModal();
    toggleFullPageModal();
  };

  const handleSaveChecklist = async () => {
    if (!newChecklistName.trim() || !selectedPackName) return;

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
      const response = await axios.post('/api/adminchecklistmodule', {
        ChecklistName: newChecklistName,
        PackName: selectedPackName,
        batteryPackName,
        checkedBy,
        tableData: transformedTableData
      });

      setChecklists([...checklists, `${selectedPackName}_${newChecklistName}`]);
      setSelectedChecklist(newChecklistName);
      setNewChecklistName('');
      setAlertMessage('Database table created successfully');
      console.log('Inserted data:', transformedTableData);
    } catch (error) {
      console.error('Error creating checklist:', error);
      setAlertMessage('Error creating database table');
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
        await axios.delete(`/api/adminchecklistmodule?tableName=${checklistName}`);
        setChecklists(checklists.filter(cl => cl !== checklistName));
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

  const handleCellChange = (rowIndex: number, colIndex: number, value: any) => {
    const newTableData = tableData.map((row, rIdx) => row.map((cell, cIdx) => {
      if (rIdx === rowIndex && cIdx === colIndex) {
        return value;
      }
      return cell;
    }));
    setTableData(newTableData);
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

  const addColumn = () => {
    setTableData(tableData.map(row => [...row, '']));
    setColumns(columns + 1);
  };

  const addRow = () => {
    setTableData([...tableData, Array(columns).fill('')]);
    setRows(rows + 1);
  };

  const deleteColumn = (colIndex: number) => {
    setTableData(tableData.map(row => row.filter((_, cIdx) => cIdx !== colIndex)));
    setColumns(columns - 1);
  };

  const deleteRow = (rowIndex: number) => {
    setTableData(tableData.filter((_, rIdx) => rIdx !== rowIndex));
    setRows(rows - 1);
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

      {selectedPackName && (
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
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
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

      <Modal isOpen={fullPageModal} toggle={toggleFullPageModal} size="lg" style={{ maxWidth: '80%', width: '80%' }}>
        <ModalHeader toggle={toggleFullPageModal}>Edit Checklist</ModalHeader>
        <ModalBody>
          {alertMessage && (
            <Alert color={alertMessage.includes('Error') ? 'danger' : 'success'}>
              {alertMessage}
            </Alert>
          )}
          <div className="d-flex mb-3">
            <Input type="text" className="mr-2" placeholder="Battery Pack Name" value={batteryPackName} onChange={(e) => setBatteryPackName(e.target.value)} />
            <Input type="text" className="mr-2" placeholder="Checked By" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} />
          </div>
          <Button color={checkboxMode ? "danger" : "success"} onClick={toggleCheckboxMode} className="mb-3">
            {checkboxMode ? "Disable Checkbox" : "Add Checkbox"}
          </Button>
          <Button color={rangeMode ? "danger" : "success"} onClick={toggleRangeMode} className="mb-3">
            {rangeMode ? "Disable Range" : "Set Range"}
          </Button>
          <Table bordered>
            <thead>
              <tr>
                {tableData[0] && tableData[0].map((header, colIndex) => (
                  <th key={colIndex}>
                    <Input
                      type="text"
                      value={header}
                      onChange={(e) => handleCellChange(0, colIndex, e.target.value)}
                    />
                    <Button color="danger" onClick={() => deleteColumn(colIndex)}>Delete Column</Button>
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
                    <td key={colIndex} onClick={() => {
                      if (checkboxMode && typeof cell !== 'object') {
                        handleCellChange(rowIndex + 1, colIndex, { OK: false, 'Not OK': false });
                      } else if (rangeMode) {
                        setSelectedCell({ rowIndex: rowIndex + 1, colIndex });
                      }
                    }}>
                      {rangeMode && selectedCell && selectedCell.rowIndex === rowIndex + 1 && selectedCell.colIndex === colIndex ? (
                        <div>
                          <Input
                            type="number"
                            placeholder="Min"
                            onChange={(e) => handleRangeChange(rowIndex + 1, colIndex, Number(e.target.value), cell.max)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            onChange={(e) => handleRangeChange(rowIndex + 1, colIndex, cell.min, Number(e.target.value))}
                          />
                        </div>
                      ) : typeof cell === 'object' && cell.min !== undefined && cell.max !== undefined ? (
                        <div>
                          <p>Min: {cell.min}</p>
                          <p>Max: {cell.max}</p>
                        </div>
                      ) : typeof cell === 'object' ? (
                        <>
                          <Input
                            type="checkbox"
                            checked={cell.OK}
                            onChange={() => handleCheckboxChange(rowIndex + 1, colIndex, 'OK')}
                          /> OK
                          <Input
                            type="checkbox"
                            checked={cell['Not OK']}
                            onChange={() => handleCheckboxChange(rowIndex + 1, colIndex, 'Not OK')}
                          /> Not OK
                        </>
                      ) : (
                        <Input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex + 1, colIndex, e.target.value)}
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
                <td colSpan={columns}>
                  <Button color="success" onClick={addRow}>Add Row</Button>
                </td>
              </tr>
            </tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSaveChecklist}>Save</Button>{' '}
          <Button color="secondary" onClick={toggleFullPageModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminChecklistModule;
