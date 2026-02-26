import { 
  type User, type InsertUser, 
  type Company, type InsertCompany,
  type Document, type InsertDocument,
  type DocumentItem, type InsertDocumentItem
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentByNumber(documentNumber: string): Promise<Document | undefined>;
  getDocumentsByCompany(companyId: string): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, doc: Partial<InsertDocument & { qrCodeData?: string; status?: string; documentNumber?: string }>): Promise<Document | undefined>;
  
  getDocumentItems(documentId: string): Promise<DocumentItem[]>;
  createDocumentItem(item: InsertDocumentItem): Promise<DocumentItem>;
  deleteDocumentItems(documentId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private companies: Map<string, Company>;
  private documents: Map<string, Document>;
  private documentItems: Map<string, DocumentItem>;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.documents = new Map();
    this.documentItems = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const newCompany: Company = { ...company, id, address: company.address ?? null, phone: company.phone ?? null, email: company.email ?? null };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existing = this.companies.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...company };
    this.companies.set(id, updated);
    return updated;
  }

  async deleteCompany(id: string): Promise<boolean> {
    return this.companies.delete(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByNumber(documentNumber: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(d => d.documentNumber === documentNumber);
  }

  async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.companyId === companyId);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const docNum = `DOC-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newDoc: Document = { 
      ...doc, 
      id, 
      documentNumber: docNum,
      qrCodeData: null,
      status: "active",
      createdAt: now,
      licenceNumber: doc.licenceNumber ?? null,
      companyNameProject: doc.companyNameProject ?? null,
      subject: doc.subject ?? null,
      registrationGovernorate: doc.registrationGovernorate ?? null,
      cargoTypedetails: doc.cargoTypedetails ?? null,
      destinationGovernorate: doc.destinationGovernorate ?? null,
      governorateName: doc.governorateName ?? null,
      xCoordinate: doc.xCoordinate ?? null,
      yCoordinate: doc.yCoordinate ?? null,
      grantingLicenseApproval: doc.grantingLicenseApproval ?? null,
      licenseApprovalNumber: doc.licenseApprovalNumber ?? null,
      licenseApprovalDate: doc.licenseApprovalDate ?? null,
      licenseTextSpecialization: doc.licenseTextSpecialization ?? null,
      brand: doc.brand ?? null,
      notes: doc.notes ?? null,
    };
    this.documents.set(id, newDoc);
    return newDoc;
  }

  async updateDocument(id: string, doc: Partial<InsertDocument & { qrCodeData?: string; status?: string; documentNumber?: string }>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...doc } as Document;
    this.documents.set(id, updated);
    return updated;
  }

  async getDocumentItems(documentId: string): Promise<DocumentItem[]> {
    return Array.from(this.documentItems.values()).filter(i => i.documentId === documentId);
  }

  async createDocumentItem(item: InsertDocumentItem): Promise<DocumentItem> {
    const id = randomUUID();
    const newItem: DocumentItem = { 
      ...item, 
      id,
      hashId: item.hashId ?? null,
      productionCapacity: item.productionCapacity ?? null,
    };
    this.documentItems.set(id, newItem);
    return newItem;
  }

  async deleteDocumentItems(documentId: string): Promise<void> {
    for (const [key, item] of this.documentItems) {
      if (item.documentId === documentId) {
        this.documentItems.delete(key);
      }
    }
  }
}

export const storage = new MemStorage();
