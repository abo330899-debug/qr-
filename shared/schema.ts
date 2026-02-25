import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  driverName: text("driver_name").notNull(),
  vehicleNumber: text("vehicle_number").notNull(),
  licenceNumber: text("licence_number").notNull(),
  checkpointName: text("checkpoint_name").notNull(),
  governorate: text("governorate").notNull(),
  weightQuantity: text("weight_quantity").notNull(),
  specialization: text("specialization"),
  notes: text("notes"),
  qrCodeData: text("qr_code_data"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentItems = pgTable("document_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  itemName: text("item_name").notNull(),
  productionLine: text("production_line"),
  unit: text("unit").notNull(),
  productionCapacity: text("production_capacity"),
  requestedQuantity: text("requested_quantity").notNull(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentItem = typeof documentItems.$inferSelect;
export type InsertDocumentItem = z.infer<typeof insertDocumentItemSchema>;
