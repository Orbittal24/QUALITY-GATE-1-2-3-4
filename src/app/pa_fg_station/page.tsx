"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useRouter } from "next/navigation";

import {
  Card,
  CardBody,
  Row,
  Col,
  Input,
  Button,
  Table,
  Badge,
  Progress,
  Spinner,
  Alert,
} from "reactstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const MySwal = withReactContent(Swal);

type ChecklistItem = {
  Sr_No: number;
  ProsubBarcode: string;
  PackName: string;
  CheckedBy: string;
  DateTime: string;
  Status?: string;
  PreviouslyUsedBy?: string | null;
  [key: string]:
    | string
    | { OK: boolean; "Not OK": boolean }
    | number
    | undefined
    | null;
};

const TableThree: React.FC = () => {
  const [prosubBarcode, setProsubBarcode] = useState<string>("");
  const [btDescription, setBtDescription] = useState<string>("");
  const [checkedBy, setCheckedBy] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>("");

  const [rangeCells, setRangeCells] = useState<{
    [key: string]: { min: number; max: number };
  }>({});

  const [adminCells, setAdminCells] = useState<{
    [key: string]: boolean;
  }>({});

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const [defectOptions, setDefectOptions] = useState<
  { defect_id: number; defect_name: string }[]
>([]);

const [selectedDefectIds, setSelectedDefectIds] = useState<{
  [key: string]: number;
}>({});


//   const defectOptions = [
//   "Punch Damage",
//   "Crack",
//   "Loose Connection",
//   "Wrong Assembly",
//   "Sensor Issue",
// ];

const [remarksData, setRemarksData] = useState<{
  [key: string]: string;
}>({});

// =========================
// FETCH DEFECT LIST
// =========================

const fetchDefectList = async () => {
  try {
    const response = await axios.get(
      "http://192.168.2.197:5555/api/v1/replus/rework/allowed-defects?station_id=2"
    );

    if (response.data.success) {
      setDefectOptions(response.data.defects || []);
    }
  } catch (error) {
    console.error("Error fetching defects:", error);

    MySwal.fire({
      icon: "error",
      title: "Defect Error",
      text: "Unable to fetch defect list",
    });
  }
};

useEffect(() => {
  fetchDefectList();
}, []);

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    const token = localStorage.getItem("auth");

    if (!token) {
      router.push("/");
    }
  }, []);

  // =========================
  // FETCH BARCODE DATA
  // =========================

  const fetchBarcodeData = async () => {
    try {
      setLoading(true);

      // const response = await axios.get(`/api/getBarcodeData?barcode=${prosubBarcode}`);
      // const { Bt_Description } = response.data;

      setBtDescription("Pack_assembly_FG_Station");

      const checklistResponse = await axios.get(
        `/api/adminchecklist?packName=Pack_assembly_FG_Station`
      );

      const { tableNames } = checklistResponse.data;

      setTableNames(tableNames || []);
    } catch (error) {
      console.error(error);

      setAlertMessage("Error fetching barcode data");

      MySwal.fire({
        icon: "error",
        title: "Barcode Error",
        text: "Unable to fetch barcode data",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH CHECKLIST DATA
  // =========================

  const fetchChecklistData = async (tableName: string) => {
    try {
      setLoading(true);

      setSelectedTableName(tableName);

      const checklistResponse = await axios.get(
        `/api/adminchecklist?tableName=${tableName}`
      );

      const { tableData } = checklistResponse.data;

      if (tableData && tableData.length > 0) {
        processChecklistData(tableData);
      } else {
        setAlertMessage("No data available for this checklist");
      }
    } catch (error) {
      console.error(error);

      setAlertMessage("Error fetching checklist data");

      MySwal.fire({
        icon: "error",
        title: "Checklist Error",
        text: "Unable to fetch checklist",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PROCESS CHECKLIST
  // =========================

  const processChecklistData = (data: ChecklistItem[]) => {
    const newRangeCells: {
      [key: string]: { min: number; max: number };
    } = {};

    const newAdminCells: {
      [key: string]: boolean;
    } = {};

    const updatedData = data.map(
      (row: ChecklistItem, rowIndex: number) => {
        const updatedRow = { ...row };

        Object.entries(updatedRow).forEach(([key, value]) => {
          if (typeof value === "string") {
            if (value.startsWith("Range:")) {
              const match = value.match(/Range: (\d+)-(\d+)/);

              if (match) {
                newRangeCells[`${rowIndex}-${key}`] = {
                  min: parseInt(match[1], 10),
                  max: parseInt(match[2], 10),
                };

                updatedRow[key] = "";

                newAdminCells[`${rowIndex}-${key}`] = true;
              }
            } else if (value === "Checkbox: OK, Not OK") {
              updatedRow[key] = {
                OK: false,
                "Not OK": false,
              };

              newAdminCells[`${rowIndex}-${key}`] = true;
            } else if (value !== "") {
              newAdminCells[`${rowIndex}-${key}`] = true;
            }
          }
        });

        return updatedRow;
      }
    );

    setChecklistData(updatedData);

    setRangeCells(newRangeCells);

    setAdminCells(newAdminCells);
  };

  // =========================
  // HANDLE CELL CHANGE
  // =========================

  const handleCellChange = (
    rowIndex: number,
    key: string,
    value: string
  ) => {
    const updatedData = [...checklistData];

    updatedData[rowIndex][key] = value;

    const rangeCell = rangeCells[`${rowIndex}-${key}`];

    if (rangeCell) {
      updatedData[rowIndex]["Status"] =
        Number(value) >= rangeCell.min &&
        Number(value) <= rangeCell.max
          ? "OK"
          : "Not OK";
    }

    setChecklistData(updatedData);
  };




  // =========================
  // HANDLE CHECKBOX
  // =========================

  const handleCheckboxChange = (
  rowIndex: number,
  key: string,
  checkboxKey: "OK" | "Not OK"
) => {
  const updatedData = [...checklistData];

  updatedData[rowIndex][key] =
    checkboxKey === "OK"
      ? { OK: true, "Not OK": false }
      : { OK: false, "Not OK": true };

  updatedData[rowIndex]["Status"] = checkboxKey;

  // IF OK THEN CLEAR REMARK
  if (checkboxKey === "OK") {
    setRemarksData((prev) => ({
      ...prev,
      [`${rowIndex}-${key}`]: "",
    }));

    updatedData[rowIndex]["Remark"] = "";
  }

  setChecklistData(updatedData);
};
  // =========================
  // HANDLE CHECKED BY
  // =========================

  const handleCheckedByChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCheckedBy(event.target.value);

    const updatedData = checklistData.map((row) => ({
      ...row,
      CheckedBy: event.target.value,
    }));

    setChecklistData(updatedData);
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async () => {

// =========================
// VALIDATE CHECKLIST
// =========================

for (let rowIndex = 0; rowIndex < checklistData.length; rowIndex++) {

  const row = checklistData[rowIndex];

  const checklistKeys = Object.keys(row).filter(
    (key) =>
      key !== "PackName" &&
      key !== "CheckedBy" &&
      key !== "PreviouslyUsedBy" &&
      key !== "DateTime" &&
      key !== "Status" &&
      key !== "Sr_No" &&
      key !== "Remark" &&
      key !== "ProsubBarcode"
  );

  for (const key of checklistKeys) {

    const value = row[key];

    // =========================
    // CHECK RADIO BUTTON
    // =========================

    if (
      typeof value === "object" &&
      value !== null &&
      "OK" in value &&
      "Not OK" in value
    ) {

      const selected =
        value.OK || value["Not OK"];

      // NOT SELECTED
      if (!selected) {

        MySwal.fire({
          icon: "warning",
          title: "Checklist Incomplete",
          text: `Please select OK / Not OK for point ${row["Header 1"]}`,
        });

        return;
      }

      // =========================
      // DEFECT REQUIRED
      // =========================

      if (value["Not OK"]) {

        const defectSelected =
          selectedDefectIds[
            `${rowIndex}-${key}`
          ];

        if (!defectSelected) {

          MySwal.fire({
            icon: "warning",
            title: "Defect Missing",
            text: `Please select defect for point  ${row["Header 1"]}`,
          });

          return;
        }
      }
    }

    // =========================
    // RANGE INPUT VALIDATION
    // =========================

    if (
      rangeCells[`${rowIndex}-${key}`]
    ) {

      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {

        MySwal.fire({
          icon: "warning",
          title: "Value Missing",
          text: `Please enter value for point ${row.Sr_No}`,
        });

        return;
      }
    }
  }
}

  try {


  


    // =========================
    // SAVE CHECKLIST
    // =========================

    const response = await axios.post(
      "/api/usechecklist",
      {
        tableName: selectedTableName,
        tableData: checklistData,
      }
    );

    // =========================
    // COLLECT DEFECT IDS
    // =========================

    const defectIds = Object.values(
      selectedDefectIds
    );

    // REMOVE DUPLICATES
    const uniqueDefectIds = [
      ...new Set(defectIds),
    ];

    // =========================
    // CALL RAISE DEFECT API
    // =========================

    if (uniqueDefectIds.length > 0) {
      await axios.post(
        "http://192.168.2.197:5555/api/v1/replus/rework/raise-defect",
        {
          module_barcode: prosubBarcode,
          station_id: 2,
          defect_ids: uniqueDefectIds,
          line_id: 1,
          module_id: 0,
          defect_raised_by: checkedBy,
        }
      );
    }

    // =========================
    // SUCCESS
    // =========================

    if (response.status === 200) {

  // =========================
  // SUCCESS ALERT
  // =========================

  MySwal.fire({
    icon: "success",
    title: "Success",
    text:
      uniqueDefectIds.length > 0
        ? "Checklist & Defect Submitted Successfully"
        : "Checklist Submitted Successfully",
  });

  // =========================
  // RESET ALL DATA
  // =========================

  setProsubBarcode("");
  setBtDescription("");
  setCheckedBy("");

  setChecklistData([]);
  setTableNames([]);
  setSelectedTableName("");

  setRangeCells({});
  setAdminCells({});

  setRemarksData({});
  setSelectedDefectIds({});

   

}

  } catch (error) {
    console.error(error);

    MySwal.fire({
      icon: "error",
      title: "Submit Error",
      text:
        "Unable to submit checklist/defect",
    });
  }
};

  // =========================
  // PROGRESS
  // =========================

  const completedCount = checklistData.filter(
    (item) => item.Status
  ).length;

  const progress =
    checklistData.length > 0
      ? (completedCount / checklistData.length) * 100
      : 0;

  return (
     <DefaultLayout>


   
    <div className="container-fluid p-4 bg-light min-vh-100">
      {alertMessage && (
        <Alert color="danger">{alertMessage}</Alert>
      )}

      {/* SCAN SECTION */}

      {!btDescription && (
        <Card className="shadow border-0 mb-4">
          <CardBody
            style={{
              background:
                "linear-gradient(90deg, #008000 0%, #0aa84f 50%, #00c853 100%)",
              borderRadius: "12px",
              padding: "18px 25px",
            }}
          >
            <Row className="align-items-center mb-4">
              <Col md="6">
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "24px",
                    }}
                  >
                    📋
                  </div>

                  <div>
                    <h3
                      style={{
                        color: "white",
                        marginBottom: "2px",
                        fontWeight: "700",
                      }}
                    >
                      Production Checklist System
                    </h3>

                    <p
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        margin: 0,
                        fontSize: "14px",
                      }}
                    >
                      Smart Manufacturing Inspection Portal
                    </p>
                  </div>
                </div>
              </Col>

              <Col md="6">
                <div className="d-flex justify-content-end align-items-center gap-3">
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    🏭 FG Station
                  </div>

                  {/* <div
                    style={{
                      background: "#ffffff",
                      color: "#008000",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontWeight: "700",
                    }}
                  >
                    ● Online
                  </div> */}
                </div>
              </Col>
            </Row>

            <h4 className="fw-bold text-white mb-4">
              Scan Barcode
            </h4>

            <Row>
              <Col md="10">
                <Input
                  type="text"
                  placeholder="Scan Barcode Here..."
                  value={prosubBarcode}
                  onChange={(e) =>
                    setProsubBarcode(e.target.value)
                  }
                  className="form-control-lg"
                />
              </Col>

              <Col md="2">
                <Button
                  color="light"
                  size="lg"
                  block
                  onClick={fetchBarcodeData}
                >
                  Scan
                </Button>
              </Col>
            </Row>

            {loading && (
              <div className="text-center mt-4">
                <Spinner color="light" />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* PACK DETAILS */}

      {btDescription && (
        <>
          <Card className="shadow border-0 mb-4">
            <CardBody
              style={{
                background:
                  "linear-gradient(90deg, #008000 0%, #0aa84f 50%, #00c853 100%)",
                borderRadius: "12px",
                padding: "18px 25px",
              }}
            >
              <Row className="align-items-center mb-4">
                <Col md="6">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                      }}
                    >
                      📋
                    </div>

                    <div>
                      <h3
                        style={{
                          color: "white",
                          marginBottom: "2px",
                          fontWeight: "700",
                        }}
                      >
                        Production Checklist System
                      </h3>

                      <p
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          margin: 0,
                          fontSize: "14px",
                        }}
                      >
                        Smart Manufacturing Inspection Portal
                      </p>
                    </div>
                  </div>
                </Col>

                <Col md="6">
                  <div className="d-flex justify-content-end align-items-center gap-3">
                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      🏭 FG Station
                    </div>

                    <div
                      style={{
                        background: "#ffffff",
                        color: "#008000",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        fontWeight: "700",
                      }}
                    >
                      ● Online
                    </div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md="4">
                  <h6 className="text-white">Station Name</h6>

                  <Input
                    type="text"
                    value={btDescription}
                    readOnly
                  />
                </Col>

                <Col md="4">
                  <h6 className="text-white">Barcode</h6>

                  <Input
                    type="text"
                    value={prosubBarcode}
                    readOnly
                  />
                </Col>

                <Col md="4">
                  <h6 className="text-white">Check by</h6>

                  <Input
                    type="text"
                    value={checkedBy}
                    onChange={handleCheckedByChange}
                    placeholder="Enter Operator Name"
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* CHECKLIST CARDS */}

          {!selectedTableName && (
            <>
              <h4 className="fw-bold mb-3">
                Select Checklist
              </h4>

              <Row>
                {tableNames.map((item, index) => (
                  <Col md="4" key={index} className="mb-4">
                    <Card
                      className="shadow border-0 h-100"
                      style={{
                        cursor: "pointer",
                        transition: "0.3s",
                      }}
                      onClick={() =>
                        fetchChecklistData(item)
                      }
                    >
                      <CardBody className="text-center p-5">
                        <div
                          style={{
                            fontSize: "50px",
                          }}
                        >
                          📋
                        </div>

                        <h5 className="fw-bold mt-3">
                          {item}
                        </h5>

                        <Button
                          color="success"
                          className="mt-3"
                        >
                          Open Checklist
                        </Button>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* CHECKLIST TABLE */}

          {selectedTableName && (
            <Card className="shadow border-0">
              <CardBody>
                <Row className="mb-4">
                  <Col md="6">
                    <h4 className="fw-bold">
                      {selectedTableName}
                    </h4>
                  </Col>

                  
                </Row>

              <div
  className="table-responsive"
  style={{
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  }}
>
  <Table
    bordered
    hover
    className="align-middle text-center"
    style={{
      minWidth: "900px",
      whiteSpace: "nowrap",
    }}
  >
                  <thead className="table-dark">
                    <tr>
                      <th>Sr No</th>

                      {Object.keys(checklistData[0] || {})
                        .filter(
                          (key) =>
                            key !== "PackName" &&
                            key !== "CheckedBy" &&
                            key !== "PreviouslyUsedBy" &&
                            key !== "DateTime" &&
                            key !== "Status" &&
                            key !== "Sr_No"
                        )
                        .map((key, index) => (
                          <th key={index}>{key}</th>
                        ))}

                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {checklistData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{row.Sr_No}</td>

                        {Object.entries(row)
                          .filter(
                            ([key]) =>
                              key !== "PackName" &&
                              key !== "CheckedBy" &&
                              key !== "PreviouslyUsedBy" &&
                              key !== "DateTime" &&
                              key !== "Status" &&
                              key !== "Sr_No"
                          )
                          .map(([key, value], colIndex) => (
                            <td key={colIndex}>
                              {typeof value === "object" &&
                              value !== null &&
                              ("OK" in value ||
                                "Not OK" in value) ? (
                              <div>
 <div className="d-flex flex-column gap-3">

  {/* STATUS SELECTION */}

  <div className="d-flex align-items-center gap-4">

    {/* OK OPTION */}

    <div
      className={`px-3 py-2 rounded border ${
        (value as { OK: boolean; "Not OK": boolean }).OK
          ? "border-success bg-success bg-opacity-10"
          : "border-light"
      }`}
      style={{
        cursor: "pointer",
        minWidth: "100px",
      }}
      onClick={() =>
        handleCheckboxChange(
          rowIndex,
          key,
          "OK"
        )
      }
    >
      <div className="d-flex align-items-center gap-2">
        <Input
          type="radio"
          checked={
            (
              value as {
                OK: boolean;
                "Not OK": boolean;
              }
            ).OK
          }
          readOnly
        />

        <span
          className="fw-semibold text-success"
        >
          OK
        </span>
      </div>
    </div>

    {/* NOT OK OPTION */}

    <div
      className={`px-3 py-2 rounded border ${
        (value as {
          OK: boolean;
          "Not OK": boolean;
        })["Not OK"]
          ? "border-danger bg-danger bg-opacity-10"
          : "border-light"
      }`}
      style={{
        cursor: "pointer",
        minWidth: "120px",
      }}
      onClick={() =>
        handleCheckboxChange(
          rowIndex,
          key,
          "Not OK"
        )
      }
    >
      <div className="d-flex align-items-center gap-2">
        <Input
          type="radio"
          checked={
            (
              value as {
                OK: boolean;
                "Not OK": boolean;
              }
            )["Not OK"]
          }
          readOnly
        />

        <span
          className="fw-semibold text-danger"
        >
          Not OK
        </span>
      </div>
    </div>
  </div>

  {/* DEFECT DROPDOWN */}

  {(value as any)["Not OK"] && (
    <div
      className="p-3 rounded border bg-light"
    >
      <label
        className="form-label fw-semibold mb-2"
        style={{
          color: "#495057",
          fontSize: "14px",
        }}
      >
        Select Defect Type
      </label>

      <Input
        type="select"
        value={
          remarksData[`${rowIndex}-${key}`] || ""
        }
              onChange={(e) => {
          const selectedDefectName = e.target.value;

          // FIND DEFECT OBJECT
          const selectedDefect = defectOptions.find(
            (item) =>
              item.defect_name === selectedDefectName
          );

          setRemarksData((prev) => ({
            ...prev,
            [`${rowIndex}-${key}`]:
              selectedDefectName,
          }));

          // STORE DEFECT ID
          if (selectedDefect) {
            setSelectedDefectIds((prev) => ({
              ...prev,
              [`${rowIndex}-${key}`]:
                selectedDefect.defect_id,
            }));
          }

          const updatedData = [...checklistData];

          updatedData[rowIndex]["Remark"] =
            selectedDefectName;

          setChecklistData(updatedData);
        }}
        style={{
          borderRadius: "10px",
          height: "45px",
          border: "1px solid #ced4da",
          boxShadow: "none",
        }}
      >
        <option value="">
          -- Select Defect --
        </option>

       {defectOptions.map((item) => (
  <option
    key={item.defect_id}
    value={item.defect_name}
  >
    {item.defect_name}
  </option>
))}
      </Input>
    </div>
  )}
</div>
  {/* SHOW DROPDOWN WHEN NOT OK */}

 
</div>
                              ) : rangeCells[
                                  `${rowIndex}-${key}`
                                ] ? (
                                <Input
                                  type="text"
                                  value={String(value)}
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex,
                                      key,
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    backgroundColor:
                                      value !== ""
                                        ? Number(value) >=
                                            rangeCells[
                                              `${rowIndex}-${key}`
                                            ].min &&
                                          Number(value) <=
                                            rangeCells[
                                              `${rowIndex}-${key}`
                                            ].max
                                          ? "green"
                                          : "red"
                                        : "white",
                                    color:
                                      value !== ""
                                        ? "white"
                                        : "black",
                                  }}
                                />
                              ) : (
                                <Input
                                  type="text"
                                  value={String(value)}
                                  readOnly={
                                    key ===
                                      "ProsubBarcode" ||
                                    adminCells[
                                      `${rowIndex}-${key}`
                                    ]
                                  }
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex,
                                      key,
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                            </td>
                          ))}

                        <td>
                          {row.Status === "OK" ? (
                            <Badge color="success">
                              OK
                            </Badge>
                          ) : row.Status === "Not OK" ? (
                            <Badge color="danger">
                              Not OK
                            </Badge>
                          ) : (
                            <Badge color="secondary">
                              Pending
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
</div>
                <div className="text-end mt-4">
                  <Button
                    color="success"
                    size="lg"
                    onClick={handleSubmit}
                  >
                    Submit Checklist
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
      </DefaultLayout>
  );
};

export default TableThree;
