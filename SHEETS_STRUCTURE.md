# Health Station Management System - Google Sheets Structure

To use the system, create a Google Sheet and share it with the Service Account email (from `.env`).
The Sheet should have the following tabs (Worksheets):

## 1. Users
**Purpose**: Defines **Admin/Staff** personnel.
- **Rule**: Only add users here if they need **STAFF** or **ADMIN** access.
- **Default**: Any user with `@pnt.edu.vn` NOT in this list is automatically treated as an **EMPLOYEE** (Member).

- **Columns**: `Email`, `Name`, `Role`
- **Example**:
  | Email | Name | Role |
  |---|---|---|
  | manager@pnt.edu.vn | Dr. A | ADMIN |
  | staff@pnt.edu.vn | Nurse Joy | STAFF |

## 2. Medications
List of available medications and stock.
- **Columns**: `ID`, `Name`, `Unit`, `StockLevel`, `MinThreshold`
- **Example**:
  | ID | Name | Unit | StockLevel | MinThreshold |
  |---|---|---|---|---|
  | MED-001 | Paracetamol 500mg | Tablet | 100 | 20 |
  | MED-002 | Vitamin C | Tablet | 50 | 10 |

## 3. Requests
Tracks medication requests from employees.
- **Columns**: `RequestID`, `UserEmail`, `Date`, `Type` (Request/Dispense), `Status` (Pending/Approved/Rejected), `Note`
- **Example**:
  | RequestID | UserEmail | Date | Type | Status | Note |
  |---|---|---|---|---|---|
  | REQ-101 | emp@pnt.edu.vn | 2026-01-13 | REQUEST | PENDING | Headache |

## 4. RequestItems
Details of items in each request.
- **Columns**: `RequestID`, `MedicationID`, `Quantity`
- **Example**:
  | RequestID | MedicationID | Quantity |
  |---|---|---|
  | REQ-101 | MED-001 | 2 |

## 5. Logs
(Optional) Audit trail for stock changes.
- **Columns**: `Date`, `ActorEmail`, `Action`, `Details`
