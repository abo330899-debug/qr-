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
    if (!doc) return res.status(404).json({ message: "الوثيقة غير موجودة", success: false });
    const items = await storage.getDocumentItems(doc.id);
    const company = doc.companyId ? await storage.getCompany(doc.companyId) : null;
    res.json({
      success: true,
      data: {
        info: {
          fullName: doc.driverName,
          orgName: doc.companyNameProject || doc.companyName,
          orgPathInfo: company ? `${company.governorate} / ${company.specialization} / ${company.companyName}` : (doc.companyNameProject || doc.companyName),
        },
        numberOfVersion: 1,
        showIn: true,
        documentFilePath: `/documents/${doc.id}`,
      },
      document: { ...doc, items },
      valid: true,
    });
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
        margin: 30,
        info: {
          Title: `وثيقة شحن - ${doc.documentNumber}`,
          Author: 'الهيئة العامة للكمارك',
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

      const pageW = 595;
      const margin = 30;
      const contentW = pageW - margin * 2;

      pdfDoc.rect(0, 0, pageW, 100).fill('#1a5632');
      
      useFont(true);
      pdfDoc.fontSize(11).fillColor('#ffffff');
      pdfDoc.text('Republic of Iraq', margin, 15, { align: 'right', width: contentW });
      pdfDoc.fontSize(10);
      pdfDoc.text('Ministry of Finance', margin, 30, { align: 'right', width: contentW });
      pdfDoc.text('General Commission of Customs', margin, 44, { align: 'right', width: contentW });
      
      pdfDoc.fontSize(10).fillColor('#ffffff');
      pdfDoc.text('جمهورية العراق', margin, 15, { align: 'left', width: contentW });
      pdfDoc.text('وزارة المالية', margin, 30, { align: 'left', width: contentW });
      pdfDoc.text('الهيئة العامة للكمارك', margin, 44, { align: 'left', width: contentW });

      pdfDoc.fontSize(14).fillColor('#ffffff');
      pdfDoc.text('منصة المنتج المحلي', margin, 70, { align: 'center', width: contentW });

      let y = 110;

      useFont(true);
      pdfDoc.fontSize(9).fillColor('#333333');
      
      const drawMetaRow = (label: string, value: string, xPos: number, yPos: number, width: number) => {
        useFont(true);
        pdfDoc.fontSize(8).fillColor('#666');
        pdfDoc.text(label, xPos, yPos, { width, align: 'right' });
        useFont(false);
        pdfDoc.fontSize(9).fillColor('#333');
        pdfDoc.text(value || '—', xPos, yPos + 10, { width, align: 'left' });
      };

      const halfW = contentW / 2 - 5;
      drawMetaRow('رقم الوثيقة', doc.documentNumber, margin + halfW + 10, y, halfW);
      drawMetaRow('تاريخ الوثيقة', new Date(doc.createdAt).toLocaleDateString('ar-IQ'), margin, y, halfW);
      y += 28;

      if (doc.subject) {
        pdfDoc.rect(margin, y, contentW, 18).fill('#f6f6f6').stroke('#ddd');
        useFont(true);
        pdfDoc.fontSize(9).fillColor('#333');
        pdfDoc.text(`الموضوع / ${doc.subject}`, margin + 6, y + 4, { width: contentW - 12, align: 'right' });
        y += 24;
      }

      const tableX = margin;
      const col1W = contentW * 0.35;
      const col2W = contentW * 0.65;
      const rowH = 16;

      const drawTableHeader = (title: string) => {
        pdfDoc.rect(tableX, y, contentW, rowH + 2).fill('#990707');
        useFont(true);
        pdfDoc.fontSize(9).fillColor('#fff');
        pdfDoc.text(title, tableX, y + 3, { width: contentW, align: 'center' });
        y += rowH + 2;
      };

      const drawTableRow = (label: string, value: string) => {
        pdfDoc.rect(tableX, y, col1W, rowH).stroke('#bbb');
        pdfDoc.rect(tableX + col1W, y, col2W, rowH).stroke('#bbb');
        useFont(true);
        pdfDoc.fontSize(8).fillColor('#333');
        pdfDoc.text(label, tableX + 4, y + 3, { width: col1W - 8, align: 'right' });
        useFont(false);
        pdfDoc.text(value || '', tableX + col1W + 4, y + 3, { width: col2W - 8, align: 'right' });
        y += rowH;
      };

      drawTableHeader('المعلومات الشخصية');
      drawTableRow('اسم سيطرة الدخول', doc.checkpointNameControl);
      drawTableRow('اسم السائق', doc.driverName);
      drawTableRow('رقم العجلة', doc.vehicleNumber);
      drawTableRow('محافظة تسجيل العجلة', doc.registrationGovernorate || '');
      drawTableRow('نوع / تفاصيل الحمولة', doc.cargoTypedetails || '');
      drawTableRow('الوزن / الكمية', doc.weightQuantity);
      drawTableRow('الوجهة النهائية / المحافظة', doc.destinationGovernorate || '');
      drawTableRow('اسم المحافظة', doc.governorateName || '');
      drawTableRow('اسم الشركة / المشروع', doc.companyNameProject || doc.companyName);
      drawTableRow('الجهة المانحة للإجازة / الموافقة', doc.grantingLicenseApproval || '');
      drawTableRow('رقم الإجازة / الموافقة', doc.licenseApprovalNumber || doc.licenceNumber);
      drawTableRow('تاريخ الإجازة / الموافقة', doc.licenseApprovalDate || '');
      drawTableRow('منطوق الإجازة / الاختصاص', doc.licenseTextSpecialization || '');
      drawTableRow('العلامة التجارية', doc.brand || '');

      if (items.length > 0) {
        pdfDoc.rect(tableX, y, contentW, rowH + 2).fill('#990707');
        useFont(true);
        pdfDoc.fontSize(9).fillColor('#fff');
        pdfDoc.text('المواد / المنتجات المرخَّصة', tableX, y + 3, { width: contentW, align: 'center' });
        y += rowH + 2;

        items.forEach((item) => {
          pdfDoc.rect(tableX, y, col1W, rowH).stroke('#bbb');
          pdfDoc.rect(tableX + col1W, y, col2W, rowH).stroke('#bbb');
          useFont(false);
          pdfDoc.fontSize(8).fillColor('#333');
          pdfDoc.text(item.itemName, tableX + 4, y + 3, { width: col1W - 8, align: 'right' });
          pdfDoc.text(`${item.productionCapacity || ''} ${item.unit}`, tableX + col1W + 4, y + 3, { width: col2W - 8, align: 'left' });
          y += rowH;
        });
      }

      y += 10;
      if (doc.qrCodeData) {
        const qrImageData = doc.qrCodeData.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrImageData, 'base64');
        const qrSize = 130;
        const qrX = (pageW - qrSize) / 2;
        pdfDoc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });
        y += qrSize + 8;
      }

      useFont(false);
      pdfDoc.fontSize(7).fillColor('#666');
      pdfDoc.text('إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.', margin, y, { align: 'center', width: contentW });
      y += 10;
      pdfDoc.text('يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.', margin, y, { align: 'center', width: contentW });

      const footerY = 842 - 45;
      pdfDoc.rect(0, footerY - 5, pageW, 50).fill('#f8f8f8');
      pdfDoc.moveTo(margin, footerY - 5).lineTo(pageW - margin, footerY - 5).stroke('#bbb');
      useFont(true);
      pdfDoc.fontSize(7).fillColor('#555');
      pdfDoc.text('مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي', margin, footerY + 2, { align: 'center', width: contentW });
      useFont(false);
      pdfDoc.fontSize(6).fillColor('#888');
      pdfDoc.text('بغداد – كرادة مريم | المركز الوطني للتحول الرقمي @2025', margin, footerY + 14, { align: 'center', width: contentW });

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
    companyNameProject: "شركة الرافدين للصناعات الغذائية",
    subject: "نقل مواد غذائية من بغداد إلى البصرة",
    driverName: "أحمد محمد علي",
    vehicleNumber: "12345 - بغداد",
    licenceNumber: "DRV-2024-001",
    checkpointNameControl: "نقطة أم قصر",
    registrationGovernorate: "بغداد",
    cargoTypedetails: "مواد غذائية - طحين وسكر",
    weightQuantity: "25 طن",
    destinationGovernorate: "البصرة",
    governorateName: "البصرة",
    xCoordinate: "47.9822",
    yCoordinate: "30.5085",
    grantingLicenseApproval: "وزارة الصناعة والمعادن",
    licenseApprovalNumber: "IND-2024-001",
    licenseApprovalDate: "2024-01-15",
    licenseTextSpecialization: "تصنيع وتوزيع مواد غذائية",
    brand: "الرافدين",
    notes: "شحنة مواد غذائية أساسية",
  });

  if (doc1) {
    const verifyUrl = `http://localhost:5000/verify/${doc1.documentNumber}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });
    await storage.updateDocument(doc1.id, { qrCodeData });
    
    await storage.createDocumentItem({
      documentId: doc1.id,
      hashId: "HASH-001-A",
      itemName: "طحين أبيض",
      unit: "طن",
      productionCapacity: "100",
    });
    await storage.createDocumentItem({
      documentId: doc1.id,
      hashId: "HASH-001-B",
      itemName: "سكر أبيض",
      unit: "طن",
      productionCapacity: "50",
    });
  }

  const doc2 = await storage.createDocument({
    companyId: company2.id,
    companyName: company2.companyName,
    companyNameProject: "شركة دجلة للتجارة العامة",
    subject: "نقل بضائع متنوعة",
    driverName: "حسين كاظم جاسم",
    vehicleNumber: "67890 - البصرة",
    licenceNumber: "DRV-2024-002",
    checkpointNameControl: "منفذ الشلامجة",
    registrationGovernorate: "البصرة",
    cargoTypedetails: "أجهزة كهربائية منوعة",
    weightQuantity: "18 طن",
    destinationGovernorate: "بغداد",
    governorateName: "البصرة",
    xCoordinate: "47.7835",
    yCoordinate: "30.5152",
    grantingLicenseApproval: "وزارة التجارة",
    licenseApprovalNumber: "TRD-2024-002",
    licenseApprovalDate: "2024-03-10",
    licenseTextSpecialization: "تجارة عامة - استيراد وتصدير",
    brand: "دجلة",
    notes: null,
  });

  if (doc2) {
    const verifyUrl = `http://localhost:5000/verify/${doc2.documentNumber}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });
    await storage.updateDocument(doc2.id, { qrCodeData });
    
    await storage.createDocumentItem({
      documentId: doc2.id,
      hashId: "HASH-002-A",
      itemName: "أجهزة كهربائية",
      unit: "قطعة",
      productionCapacity: "500",
    });
  }
}
