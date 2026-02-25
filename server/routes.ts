import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/companies", async (_req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.get("/api/companies/:id", async (req, res) => {
    const company = await storage.getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    res.json(company);
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);
      res.status(201).json(company);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    const company = await storage.updateCompany(req.params.id, req.body);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    res.json(company);
  });

  app.delete("/api/companies/:id", async (req, res) => {
    const deleted = await storage.deleteCompany(req.params.id);
    if (!deleted) return res.status(404).json({ message: "الشركة غير موجودة" });
    res.json({ message: "تم حذف الشركة بنجاح" });
  });

  app.get("/api/documents", async (_req, res) => {
    const documents = await storage.getDocuments();
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const doc = await storage.getDocument(req.params.id);
    if (!doc) return res.status(404).json({ message: "الوثيقة غير موجودة" });
    const items = await storage.getDocumentItems(doc.id);
    res.json({ ...doc, items });
  });

  app.get("/api/documents/verify/:documentNumber", async (req, res) => {
    const doc = await storage.getDocumentByNumber(req.params.documentNumber);
    if (!doc) return res.status(404).json({ message: "الوثيقة غير موجودة", valid: false });
    const items = await storage.getDocumentItems(doc.id);
    res.json({ ...doc, items, valid: true });
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const { items, ...docData } = req.body;
      const doc = await storage.createDocument(docData);
      
      const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${doc.documentNumber}`;
      const qrCodeData = await QRCode.toDataURL(verifyUrl, { 
        width: 300, 
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      
      await storage.updateDocument(doc.id, { qrCodeData });
      
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createDocumentItem({ ...item, documentId: doc.id });
        }
      }
      
      const updatedDoc = await storage.getDocument(doc.id);
      const docItems = await storage.getDocumentItems(doc.id);
      res.status(201).json({ ...updatedDoc, items: docItems });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/documents/:id/pdf", async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: "الوثيقة غير موجودة" });
      
      const items = await storage.getDocumentItems(doc.id);
      
      const pdfDoc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        info: {
          Title: `وثيقة شحن - ${doc.documentNumber}`,
          Author: 'نظام الكمارك',
        }
      });
      
      const fontPath = path.join(process.cwd(), 'server', 'fonts', 'NotoSansArabic-Regular.ttf');
      const boldFontPath = path.join(process.cwd(), 'server', 'fonts', 'NotoSansArabic-Bold.ttf');
      
      let hasArabicFont = false;
      if (fs.existsSync(fontPath) && fs.existsSync(boldFontPath)) {
        pdfDoc.registerFont('Arabic', fontPath);
        pdfDoc.registerFont('ArabicBold', boldFontPath);
        hasArabicFont = true;
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=document-${doc.documentNumber}.pdf`);
      pdfDoc.pipe(res);
      
      const useFont = (bold = false) => {
        if (hasArabicFont) {
          pdfDoc.font(bold ? 'ArabicBold' : 'Arabic');
        } else {
          pdfDoc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
        }
      };

      pdfDoc.rect(0, 0, 595, 120).fill('#1a5632');
      
      useFont(true);
      pdfDoc.fontSize(18).fillColor('#ffffff');
      pdfDoc.text('Republic of Iraq', 40, 25, { align: 'right', width: 515 });
      pdfDoc.fontSize(14);
      pdfDoc.text('Ministry of Finance', 40, 48, { align: 'right', width: 515 });
      pdfDoc.text('General Commission of Customs', 40, 68, { align: 'right', width: 515 });
      
      pdfDoc.fontSize(16).fillColor('#ffffff');
      pdfDoc.text('SHIPMENT DOCUMENT', 40, 92, { align: 'center', width: 515 });

      let y = 140;
      
      useFont(true);
      pdfDoc.fontSize(11).fillColor('#333333');
      
      const drawField = (label: string, value: string, xPos: number, yPos: number, width: number) => {
        pdfDoc.rect(xPos, yPos, width, 28).fill('#f8f9fa').stroke('#e0e0e0');
        useFont(true);
        pdfDoc.fontSize(9).fillColor('#666666');
        pdfDoc.text(label, xPos + 8, yPos + 3, { width: width - 16, align: 'right' });
        useFont(false);
        pdfDoc.fontSize(10).fillColor('#333333');
        pdfDoc.text(value || '-', xPos + 8, yPos + 14, { width: width - 16, align: 'right' });
      };

      drawField('Document Number', doc.documentNumber, 300, y, 255);
      drawField('Date', new Date(doc.createdAt).toLocaleDateString('en-GB'), 40, y, 255);
      y += 35;
      
      drawField('Company Name', doc.companyName, 300, y, 255);
      drawField('Checkpoint', doc.checkpointName, 40, y, 255);
      y += 35;
      
      drawField('Driver Name', doc.driverName, 300, y, 255);
      drawField('Vehicle Number', doc.vehicleNumber, 40, y, 255);
      y += 35;
      
      drawField('License Number', doc.licenceNumber, 300, y, 255);
      drawField('Governorate', doc.governorate, 40, y, 255);
      y += 35;
      
      drawField('Weight/Quantity', doc.weightQuantity, 300, y, 255);
      if (doc.specialization) {
        drawField('Specialization', doc.specialization, 40, y, 255);
      }
      y += 45;

      if (items.length > 0) {
        useFont(true);
        pdfDoc.fontSize(12).fillColor('#1a5632');
        pdfDoc.text('Items', 40, y, { align: 'center', width: 515 });
        y += 25;

        const colWidths = [40, 150, 90, 70, 80, 85];
        const headers = ['#', 'Item Name', 'Production Line', 'Unit', 'Capacity', 'Requested Qty'];
        
        pdfDoc.rect(40, y, 515, 22).fill('#1a5632');
        useFont(true);
        pdfDoc.fontSize(8).fillColor('#ffffff');
        let xPos = 40;
        headers.forEach((h, i) => {
          pdfDoc.text(h, xPos + 4, y + 6, { width: colWidths[i] - 8, align: 'center' });
          xPos += colWidths[i];
        });
        y += 22;

        items.forEach((item, idx) => {
          const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
          pdfDoc.rect(40, y, 515, 20).fill(bgColor).stroke('#e0e0e0');
          useFont(false);
          pdfDoc.fontSize(8).fillColor('#333333');
          xPos = 40;
          const vals = [
            String(idx + 1),
            item.itemName,
            item.productionLine || '-',
            item.unit,
            item.productionCapacity || '-',
            item.requestedQuantity,
          ];
          vals.forEach((v, i) => {
            pdfDoc.text(v, xPos + 4, y + 5, { width: colWidths[i] - 8, align: 'center' });
            xPos += colWidths[i];
          });
          y += 20;
        });
      }

      y += 20;
      if (doc.qrCodeData) {
        const qrImageData = doc.qrCodeData.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrImageData, 'base64');
        const qrX = (595 - 120) / 2;
        pdfDoc.image(qrBuffer, qrX, y, { width: 120, height: 120 });
        y += 130;
        useFont(false);
        pdfDoc.fontSize(8).fillColor('#666666');
        pdfDoc.text('Scan to verify document', 40, y, { align: 'center', width: 515 });
      }

      if (doc.notes) {
        y += 20;
        useFont(false);
        pdfDoc.fontSize(9).fillColor('#666666');
        pdfDoc.text(`Notes: ${doc.notes}`, 40, y, { align: 'right', width: 515 });
      }

      const pageHeight = 842;
      useFont(false);
      pdfDoc.fontSize(7).fillColor('#999999');
      pdfDoc.text('This document can be verified using the QR code at the relevant authorities connected to the system.', 40, pageHeight - 50, { align: 'center', width: 515 });

      pdfDoc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/qr/generate", async (req, res) => {
    try {
      const { text } = req.query;
      if (!text) return res.status(400).json({ message: "النص مطلوب" });
      const qrCode = await QRCode.toDataURL(String(text), { width: 300, margin: 2 });
      res.json({ qrCode });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  await seedData();

  return httpServer;
}

async function seedData() {
  const existing = await storage.getCompanies();
  if (existing.length > 0) return;

  const company1 = await storage.createCompany({
    companyName: "شركة الرافدين للصناعات الغذائية",
    licenseNumber: "IND-2024-001",
    specialization: "صناعات غذائية",
    governorate: "بغداد",
    address: "المنطقة الصناعية - بغداد",
    phone: "07701234567",
    email: "info@rafidain-food.iq",
  });

  const company2 = await storage.createCompany({
    companyName: "شركة دجلة للتجارة العامة",
    licenseNumber: "TRD-2024-002",
    specialization: "تجارة عامة",
    governorate: "البصرة",
    address: "شارع الكورنيش - البصرة",
    phone: "07809876543",
    email: "contact@dijla-trade.iq",
  });

  const company3 = await storage.createCompany({
    companyName: "مصنع الفرات للمواد الانشائية",
    licenseNumber: "CON-2024-003",
    specialization: "مواد إنشائية",
    governorate: "كربلاء",
    address: "المنطقة الصناعية - كربلاء",
    phone: "07612345678",
    email: "furat.construction@iq.com",
  });

  const doc1 = await storage.createDocument({
    companyId: company1.id,
    companyName: company1.companyName,
    driverName: "أحمد محمد علي",
    vehicleNumber: "12345 - بغداد",
    licenceNumber: "DRV-2024-001",
    checkpointName: "نقطة أم قصر",
    governorate: "البصرة",
    weightQuantity: "25 طن",
    specialization: "مواد غذائية",
    notes: "شحنة مواد غذائية أساسية",
  });

  if (doc1) {
    const verifyUrl = `http://localhost:5000/verify/${doc1.documentNumber}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });
    await storage.updateDocument(doc1.id, { qrCodeData });
    
    await storage.createDocumentItem({
      documentId: doc1.id,
      itemName: "طحين أبيض",
      productionLine: "خط 1",
      unit: "طن",
      productionCapacity: "100",
      requestedQuantity: "15",
    });
    await storage.createDocumentItem({
      documentId: doc1.id,
      itemName: "سكر أبيض",
      productionLine: "خط 2",
      unit: "طن",
      productionCapacity: "50",
      requestedQuantity: "10",
    });
  }

  const doc2 = await storage.createDocument({
    companyId: company2.id,
    companyName: company2.companyName,
    driverName: "حسين كاظم جاسم",
    vehicleNumber: "67890 - البصرة",
    licenceNumber: "DRV-2024-002",
    checkpointName: "منفذ الشلامجة",
    governorate: "البصرة",
    weightQuantity: "18 طن",
    specialization: "بضائع متنوعة",
    notes: null,
  });

  if (doc2) {
    const verifyUrl = `http://localhost:5000/verify/${doc2.documentNumber}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });
    await storage.updateDocument(doc2.id, { qrCodeData });
    
    await storage.createDocumentItem({
      documentId: doc2.id,
      itemName: "أجهزة كهربائية",
      productionLine: null,
      unit: "قطعة",
      productionCapacity: "500",
      requestedQuantity: "200",
    });
  }
}
