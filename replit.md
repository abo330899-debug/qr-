# Iraqi Customs Document & QR System

## Overview
A customs document management system for the Iraqi General Commission of Customs. The system allows creating shipment documents with QR codes for verification, managing companies, and verifying documents.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express.js with in-memory storage
- **Features**: QR code generation (qrcode), PDF generation (pdfkit)

## Key Features
1. **Dashboard**: Overview of companies, documents, and quick actions
2. **Company Management**: CRUD operations for registered companies
3. **Document Creation**: Create shipment documents with items and auto-generated QR codes
4. **Document Viewing**: View full document details with QR code
5. **PDF Export**: Download documents as PDF
6. **Document Verification**: Verify document authenticity by document number

## RTL Support
- Full Arabic RTL interface
- Cairo + Tajawal fonts
- Green theme matching Iraqi customs branding

## Routes
- `/` - Dashboard
- `/companies` - Company management
- `/documents` - Document list
- `/documents/new` - Create new document
- `/documents/:id` - View document
- `/verify` - Verify document
- `/verify/:documentNumber` - Direct verify URL

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
