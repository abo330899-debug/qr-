import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  specialization: text("specialization").notNull(),
  governorate: text("governorate").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentNumber: text("document_number").notNull().unique(),
  companyId: varchar("company_id").notNull(),
  companyName: text("company_name").notNull(),
  companyNameProject: text("company_name_project"),
  subject: text("subject"),
  driverName: text("driver_name").notNull(),
  vehicleNumber: text("vehicle_number").notNull(),
  licenceNumber: text("licence_number"),
  checkpointNameControl: text("checkpoint_name_control").notNull(),
  registrationGovernorate: text("registration_governorate"),
  cargoTypedetails: text("cargo_typedetails"),
  weightQuantity: text("weight_quantity").notNull(),
  destinationGovernorate: text("destination_governorate"),
  governorateName: text("governorate_name"),
  xCoordinate: text("x_coordinate"),
  yCoordinate: text("y_coordinate"),
  grantingLicenseApproval: text("granting_license_approval"),
  licenseApprovalNumber: text("license_approval_number"),
  licenseApprovalDate: text("license_approval_date"),
  licenseTextSpecialization: text("license_text_specialization"),
  brand: text("brand"),
  notes: text("notes"),
  qrCodeData: text("qr_code_data"),
  status: text("status").notNull().default("active"),
  documentValue: text("document_value").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentItems = pgTable("document_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  hashId: text("hash_id"),
  itemName: text("item_name").notNull(),
  unit: text("unit").notNull(),
  productionCapacity: text("production_capacity"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  documentId: varchar("document_id"),
  documentNumber: text("document_number"),
  driverName: text("driver_name"),
  type: text("type").notNull().default("charge"),
  amount: text("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  documentNumber: true, 
  qrCodeData: true, 
  createdAt: true, 
  status: true 
});

export const insertDocumentItemSchema = createInsertSchema(documentItems).omit({ id: true });

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentItem = typeof documentItems.$inferSelect;
export type InsertDocumentItem = z.infer<typeof insertDocumentItemSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
