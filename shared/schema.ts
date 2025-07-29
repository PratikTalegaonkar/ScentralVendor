import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Base spray price in cents
  imageUrl: text("image_url").notNull(),
  available: boolean("available").notNull().default(true),
  sprayStock: integer("spray_stock").notNull().default(100), // Stock for vending machine sprays
  bottleStock30ml: integer("bottle_stock_30ml").notNull().default(50), // 30ml bottle inventory
  bottleStock60ml: integer("bottle_stock_60ml").notNull().default(30), // 60ml bottle inventory  
  bottleStock100ml: integer("bottle_stock_100ml").notNull().default(20), // 100ml bottle inventory
  
  // Bottle pricing (in cents)
  price30ml: integer("price_30ml").notNull().default(2500), // 30ml bottle price
  price60ml: integer("price_60ml").notNull().default(4500), // 60ml bottle price
  price100ml: integer("price_100ml").notNull().default(6500), // 100ml bottle price
  
  // Slot assignments
  spraySlot: integer("spray_slot"), // Slot 1-5 for spray
  bottleSlot: integer("bottle_slot"), // Slot 1-15 for bottle
  bottleSize: text("bottle_size", { enum: ['30ml', '60ml', '100ml'] }), // Size for this bottle slot
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  paymentMethod: text("payment_method").notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  status: text("status").notNull().default("pending"), // pending, completed, failed
  bottleSize: text("bottle_size"), // For bottle orders - can store JSON or single size
  orderType: text("order_type").notNull().default("spray"), // 'spray' or 'bottle'
  quantity: integer("quantity").notNull().default(1), // Number of items ordered
  slotNumber: integer("slot_number"), // Physical slot used for dispensing
  createdAt: text("created_at").notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// New flexible slot assignment system
export const spraySlotAssignments = pgTable("spray_slot_assignments", {
  id: serial("id").primaryKey(),
  slotNumber: integer("slot_number").notNull(), // 1-5, multiple products can be assigned to same slot
  productId: integer("product_id").notNull(), // Reference to products table
  priority: integer("priority").notNull().default(0), // Higher priority = dispensed first
});

export const bottleSlotAssignments = pgTable("bottle_slot_assignments", {
  id: serial("id").primaryKey(),
  slotNumber: integer("slot_number").notNull(), // 1-15, multiple products can be assigned to same slot
  productId: integer("product_id").notNull(), // Reference to products table
  bottleSize: text("bottle_size", { enum: ['30ml', '60ml', '100ml'] }).notNull(),
  priority: integer("priority").notNull().default(0), // Higher priority = dispensed first
  slotQuantity: integer("slot_quantity").notNull().default(1), // Individual quantity per slot assignment
});

// Keep the old bottleSlots table for backward compatibility during migration
export const bottleSlots = pgTable("bottle_slots", {
  id: serial("id").primaryKey(),
  slotNumber: integer("slot_number").notNull().unique(), // 1-15
  productId: integer("product_id"), // Reference to products table
  bottleSize: text("bottle_size", { enum: ['30ml', '60ml', '100ml'] }).notNull(),
  stock: integer("stock").notNull().default(0),
});

// Sales analytics and reporting tables
export const salesSummary = pgTable("sales_summary", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalRevenue: integer("total_revenue").notNull().default(0), // Total revenue in cents
  totalOrders: integer("total_orders").notNull().default(0), // Total number of orders
  sprayOrders: integer("spray_orders").notNull().default(0), // Number of spray orders
  bottleOrders: integer("bottle_orders").notNull().default(0), // Number of bottle orders
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productSales = pgTable("product_sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  sprayQuantity: integer("spray_quantity").notNull().default(0),
  bottle30mlQuantity: integer("bottle_30ml_quantity").notNull().default(0),
  bottle60mlQuantity: integer("bottle_60ml_quantity").notNull().default(0),
  bottle100mlQuantity: integer("bottle_100ml_quantity").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // Revenue from this product in cents
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const slotUsageStats = pgTable("slot_usage_stats", {
  id: serial("id").primaryKey(),
  slotNumber: integer("slot_number").notNull(),
  slotType: text("slot_type", { enum: ['spray', 'bottle'] }).notNull(),
  productId: integer("product_id"),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsed: text("last_used"),
  popularityScore: integer("popularity_score").notNull().default(0), // Weighted score based on recent usage
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;

export const insertBottleSlotSchema = createInsertSchema(bottleSlots).omit({
  id: true,
});

export type BottleSlot = typeof bottleSlots.$inferSelect;
export type InsertBottleSlot = z.infer<typeof insertBottleSlotSchema>;

export const insertSlotUsageStatsSchema = createInsertSchema(slotUsageStats).omit({
  id: true,
});

export type SlotUsageStats = typeof slotUsageStats.$inferSelect;
export type InsertSlotUsageStats = z.infer<typeof insertSlotUsageStatsSchema>;

// New flexible slot assignment schemas
export const insertSpraySlotAssignmentSchema = createInsertSchema(spraySlotAssignments).omit({
  id: true,
});
export type InsertSpraySlotAssignment = z.infer<typeof insertSpraySlotAssignmentSchema>;
export type SpraySlotAssignment = typeof spraySlotAssignments.$inferSelect;

export const insertBottleSlotAssignmentSchema = createInsertSchema(bottleSlotAssignments).omit({
  id: true,
});
export type InsertBottleSlotAssignment = z.infer<typeof insertBottleSlotAssignmentSchema>;
export type BottleSlotAssignment = typeof bottleSlotAssignments.$inferSelect;

// Sales analytics schemas
export const insertSalesSummarySchema = createInsertSchema(salesSummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSalesSummary = z.infer<typeof insertSalesSummarySchema>;
export type SalesSummary = typeof salesSummary.$inferSelect;

export const insertProductSalesSchema = createInsertSchema(productSales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProductSales = z.infer<typeof insertProductSalesSchema>;
export type ProductSales = typeof productSales.$inferSelect;
