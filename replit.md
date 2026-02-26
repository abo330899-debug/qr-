# Iraqi Customs Document & QR System (نظام الكمارك)

## Overview
A customs document management system for the Iraqi General Commission of Customs, modeled after the real customs system at customs-uboor.ur.gov.iq. The system allows creating shipment documents with QR codes for verification, managing companies, and verifying documents. All interfaces are Arabic RTL with authentic Iraqi customs branding.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express.js with in-memory storage (MemStorage)
- **Features**: QR code generation (qrcode), PDF generation (pdfkit)

## Key Features
1. **Dashboard**: Overview of companies, documents, and quick actions
2. **Company Management**: CRUD operations for registered companies
3. **Document Creation**: Create shipment documents matching the real API fields (منصة المنتج المحلي)
4. **Document Viewing**: A4-formatted view matching the original system layout with Iraqi eagle logo
5. **PDF Export**: Download documents as formatted PDF with QR code
6. **Document Verification**: Verify document authenticity by document number or QR scan

## Document Schema (matches real system)
Key fields based on actual customs API:
- `checkpointNameControl` - اسم سيطرة الدخول
- `driverName` - اسم السائق
- `vehicleNumber` - رقم العجلة
- `registrationGovernorate` - محافظة تسجيل العجلة
- `cargoTypedetails` - نوع / تفاصيل الحمولة
- `weightQuantity` - الوزن / الكمية
- `destinationGovernorate` - الوجهة النهائية
- `governorateName` - اسم المحافظة
- `companyNameProject` - اسم الشركة / المشروع
- `grantingLicenseApproval` - الجهة المانحة للإجازة
- `licenseApprovalNumber` - رقم الإجازة / الموافقة
- `licenseApprovalDate` - تاريخ الإجازة
- `licenseTextSpecialization` - منطوق الإجازة / الاختصاص
- `brand` - العلامة التجارية
- `xCoordinate` / `yCoordinate` - الموقع الجغرافي
- Items: `itemName`, `unit`, `productionCapacity`, `hashId`

## RTL Support
- Full Arabic RTL interface
- Cairo + Tajawal fonts
- Green theme (#1a5632) matching Iraqi customs branding
- Document table headers use #990707 (dark red) matching original

## Routes
- `/` - Dashboard
- `/companies` - Company management
- `/documents` - Document list
- `/documents/new` - Create new document
- `/documents/:id` - View document (A4 layout)
- `/verify` - Verify document
- `/verify/:documentNumber` - Direct verify URL (from QR)

## API Endpoints
- `GET/POST /api/companies` - List/Create companies
- `GET/PATCH/DELETE /api/companies/:id` - Company CRUD
- `GET/POST /api/documents` - List/Create documents
- `GET /api/documents/:id` - Get document with items
- `GET /api/documents/:id/pdf` - Download PDF
- `GET /api/documents/verify/:documentNumber` - Verify document
- `GET /api/qr/generate?text=...` - Generate QR code

## Dependencies
- qrcode - QR code generation
- pdfkit - PDF document generation
- adm-zip - ZIP file extraction (dev utility)

## Assets
- `client/public/images/customes-logo.png` - Iraqi customs logo
- `client/public/images/ur-logo.png` - ur.gov.iq logo
