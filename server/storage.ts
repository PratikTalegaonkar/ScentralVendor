import { users, products, orders, adminSessions, bottleSlots, slotUsageStats, spraySlotAssignments, bottleSlotAssignments, salesSummary, productSales, type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type AdminSession, type InsertAdminSession, type BottleSlot, type InsertBottleSlot, type SlotUsageStats, type InsertSlotUsageStats, type SalesSummary, type InsertSalesSummary, type ProductSales, type InsertProductSales } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Inventory management
  updateSprayStock(productId: number, quantity: number): Promise<Product | undefined>;
  updateBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined>;
  updateProductSlot(productId: number, slotType: 'spray' | 'bottle', slotNumber: number): Promise<Product | undefined>;
  decrementSprayStock(productId: number, quantity: number): Promise<Product | undefined>;
  decrementBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined>;
  
  // New flexible slot assignment methods
  assignProductToSpraySlot(productId: number, slotNumber: number, priority?: number): Promise<void>;
  assignProductToBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml', priority?: number, slotQuantity?: number): Promise<void>;
  getAvailableQuantityForProduct(productId: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<number>;
  removeProductFromSpraySlot(productId: number, slotNumber: number): Promise<void>;
  removeProductFromBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<void>;
  getProductsInSpraySlot(slotNumber: number): Promise<Product[]>;
  getProductsInBottleSlot(slotNumber: number): Promise<{ product: Product, bottleSize: '30ml' | '60ml' | '100ml' }[]>;
  getAssignedSlotsForProduct(productId: number): Promise<{ spraySlots: number[], bottleSlots: { slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml' }[] }>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Admin authentication
  verifyAdminCredentials(username: string, password: string): Promise<boolean>;
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
  
  // Bottle slot management (keep for backward compatibility)
  getBottleSlots(): Promise<BottleSlot[]>;
  getBottleSlot(slotNumber: number): Promise<BottleSlot | undefined>;
  assignBottleSlot(slotNumber: number, productId: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<BottleSlot>;
  updateBottleSlotStock(slotNumber: number, stock: number): Promise<BottleSlot | undefined>;
  removeBottleSlotAssignment(slotNumber: number): Promise<boolean>;
  clearBottleSlot(slotNumber: number): Promise<void>;
  
  // Usage tracking and heatmap
  recordSlotUsage(slotNumber: number, slotType: 'spray' | 'bottle', productId?: number): Promise<void>;
  getSlotUsageStats(): Promise<SlotUsageStats[]>;
  calculatePopularityScores(): Promise<void>;
  getHeatmapData(): Promise<{ spraySlots: any[], bottleSlots: any[] }>;

  // Sales analytics and reporting methods
  recordSale(productId: number, orderType: 'spray' | 'bottle', bottleSize?: '30ml' | '60ml' | '100ml', quantity?: number, revenue?: number, slotNumber?: number): Promise<void>;
  getDailySalesReport(date: string): Promise<SalesSummary | null>;
  getWeeklySalesReport(startDate: string, endDate: string): Promise<SalesSummary[]>;
  getMonthlySalesReport(year: number, month: number): Promise<SalesSummary[]>;
  getProductSalesReport(productId: number, startDate: string, endDate: string): Promise<ProductSales[]>;
  getTopSellingProducts(period: 'daily' | 'weekly' | 'monthly', date?: string): Promise<Array<Product & {totalSales: number, totalRevenue: number}>>;
  getSalesAnalytics(period: 'daily' | 'weekly' | 'monthly', date?: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    sprayOrders: number;
    bottleOrders: number;
    topProducts: Array<{product: Product, sales: number, revenue: number}>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private adminSessions: Map<string, AdminSession>;
  private currentUserId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.adminSessions = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentSessionId = 1;
    
    // Initialize with default products
    this.initializeProducts();
  }

  private initializeProducts() {
    const defaultProducts: Omit<Product, 'id'>[] = [
      {
        name: "Noir Elegance",
        description: "Mysterious & Sophisticated",
        price: 12500, // ₹125.00
        price30ml: 2500, // ₹25.00
        price60ml: 4500, // ₹45.00
        price100ml: 6500, // ₹65.00
        imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 85,
        bottleStock30ml: 45,
        bottleStock60ml: 25,
        bottleStock100ml: 15,
        spraySlot: null,
        bottleSlot: null,
        bottleSize: null
      },
      {
        name: "Rose Gold",
        description: "Romantic & Luxurious",
        price: 15000, // ₹150.00
        price30ml: 2800, // ₹28.00
        price60ml: 5200, // ₹52.00
        price100ml: 7500, // ₹75.00
        imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 92,
        bottleStock30ml: 38,
        bottleStock60ml: 22,
        bottleStock100ml: 12,
        spraySlot: null,
        bottleSlot: null,
        bottleSize: null
      },
      {
        name: "Ocean Breeze",
        description: "Fresh & Invigorating",
        price: 10000, // ₹100.00
        price30ml: 2200, // ₹22.00
        price60ml: 4000, // ₹40.00
        price100ml: 5800, // ₹58.00
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 78,
        bottleStock30ml: 52,
        bottleStock60ml: 28,
        bottleStock100ml: 18,
        spraySlot: null,
        bottleSlot: null,
        bottleSize: null
      },
      {
        name: "Amber Sunset",
        description: "Warm & Sensual",
        price: 16700, // ₹167.00
        price30ml: 3200, // ₹32.00
        price60ml: 5800, // ₹58.00
        price100ml: 8500, // ₹85.00
        imageUrl: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 65,
        bottleStock30ml: 35,
        bottleStock60ml: 20,
        bottleStock100ml: 8,
        spraySlot: null,
        bottleSlot: null,
        bottleSize: null
      },
      {
        name: "Crystal Pure",
        description: "Clean & Ethereal",
        price: 11700, // ₹117.00
        price30ml: 2400, // ₹24.00
        price60ml: 4300, // ₹43.00
        price100ml: 6200, // ₹62.00
        imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 88,
        bottleStock30ml: 42,
        bottleStock60ml: 31,
        bottleStock100ml: 16,
        spraySlot: null,
        bottleSlot: null,
        bottleSize: null
      }
    ];

    defaultProducts.forEach(product => {
      const id = this.currentProductId++;
      this.products.set(id, { ...product, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.available);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      available: insertProduct.available ?? true,
      sprayStock: insertProduct.sprayStock ?? 100,
      bottleStock30ml: insertProduct.bottleStock30ml ?? 50,
      bottleStock60ml: insertProduct.bottleStock60ml ?? 30,
      bottleStock100ml: insertProduct.bottleStock100ml ?? 20,
      price30ml: insertProduct.price30ml ?? 2500,
      price60ml: insertProduct.price60ml ?? 4500,
      price100ml: insertProduct.price100ml ?? 6500,
      spraySlot: insertProduct.spraySlot || null,
      bottleSlot: insertProduct.bottleSlot || null,
      bottleSize: insertProduct.bottleSize || null
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (product) {
      const updatedProduct = { ...product, ...updateData };
      this.products.set(id, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id,
      status: insertOrder.status ?? 'pending',
      orderType: insertOrder.orderType ?? 'spray',
      quantity: insertOrder.quantity ?? 1,
      slotNumber: insertOrder.slotNumber ?? null,
      createdAt: new Date().toISOString(),
      bottleSize: insertOrder.bottleSize || null
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      this.orders.set(id, order);
      return order;
    }
    return undefined;
  }

  // Admin authentication methods
  async verifyAdminCredentials(username: string, password: string): Promise<boolean> {
    // Test mode: allow blank password for admin user
    return username === 'admin' && (password === 'admin' || password === '');
  }

  async createAdminSession(insertSession: InsertAdminSession): Promise<AdminSession> {
    const id = this.currentSessionId++;
    const session: AdminSession = {
      ...insertSession,
      id,
      createdAt: new Date().toISOString()
    };
    this.adminSessions.set(insertSession.sessionToken, session);
    return session;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const session = this.adminSessions.get(token);
    if (session && new Date(session.expiresAt) > new Date()) {
      return session;
    }
    // Clean up expired session
    if (session) {
      this.adminSessions.delete(token);
    }
    return undefined;
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    return this.adminSessions.delete(token);
  }

  // Inventory management methods
  async updateSprayStock(productId: number, quantity: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (product) {
      const updatedProduct = { ...product, sprayStock: quantity };
      this.products.set(productId, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  async updateBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (product) {
      const updatedProduct = { ...product };
      switch (bottleSize) {
        case '30ml':
          updatedProduct.bottleStock30ml = quantity;
          break;
        case '60ml':
          updatedProduct.bottleStock60ml = quantity;
          break;
        case '100ml':
          updatedProduct.bottleStock100ml = quantity;
          break;
      }
      this.products.set(productId, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  async updateProductSlot(productId: number, slotType: 'spray' | 'bottle', slotNumber: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (product) {
      const updatedProduct = { ...product };
      
      // Clear any existing slot assignment for this product
      if (slotType === 'spray') {
        updatedProduct.spraySlot = slotNumber;
        updatedProduct.bottleSlot = null; // Clear bottle slot
      } else {
        updatedProduct.bottleSlot = slotNumber;
        updatedProduct.spraySlot = null; // Clear spray slot
      }
      
      this.products.set(productId, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  async decrementSprayStock(productId: number, quantity: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (product && product.sprayStock >= quantity) {
      const updatedProduct = { ...product, sprayStock: product.sprayStock - quantity };
      this.products.set(productId, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  async decrementBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (product) {
      const updatedProduct = { ...product };
      let currentStock = 0;
      
      switch (bottleSize) {
        case '30ml':
          currentStock = product.bottleStock30ml;
          if (currentStock >= quantity) {
            updatedProduct.bottleStock30ml = currentStock - quantity;
          } else {
            return undefined;
          }
          break;
        case '60ml':
          currentStock = product.bottleStock60ml;
          if (currentStock >= quantity) {
            updatedProduct.bottleStock60ml = currentStock - quantity;
          } else {
            return undefined;
          }
          break;
        case '100ml':
          currentStock = product.bottleStock100ml;
          if (currentStock >= quantity) {
            updatedProduct.bottleStock100ml = currentStock - quantity;
          } else {
            return undefined;
          }
          break;
      }
      
      this.products.set(productId, updatedProduct);
      return updatedProduct;
    }
    return undefined;
  }

  // Bottle slot management methods
  async getBottleSlots(): Promise<BottleSlot[]> {
    const slots: BottleSlot[] = [];
    for (let i = 1; i <= 15; i++) {
      slots.push({
        id: i,
        slotNumber: i,
        productId: null,
        bottleSize: '30ml',
        stock: 0
      });
    }
    return slots;
  }

  async getBottleSlot(slotNumber: number): Promise<BottleSlot | undefined> {
    if (slotNumber < 1 || slotNumber > 15) return undefined;
    return {
      id: slotNumber,
      slotNumber,
      productId: null,
      bottleSize: '30ml',
      stock: 0
    };
  }

  async assignBottleSlot(slotNumber: number, productId: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<BottleSlot> {
    return {
      id: slotNumber,
      slotNumber,
      productId,
      bottleSize,
      stock: 0
    };
  }

  async updateBottleSlotStock(slotNumber: number, stock: number): Promise<BottleSlot | undefined> {
    if (slotNumber < 1 || slotNumber > 15) return undefined;
    return {
      id: slotNumber,
      slotNumber,
      productId: null,
      bottleSize: '30ml',
      stock
    };
  }

  async removeBottleSlotAssignment(slotNumber: number): Promise<boolean> {
    return slotNumber >= 1 && slotNumber <= 15;
  }

  async clearBottleSlot(slotNumber: number): Promise<void> {
    // For MemStorage, this is a no-op since bottle slots are not persisted
    return;
  }

  // Usage tracking and heatmap methods
  async recordSlotUsage(slotNumber: number, slotType: 'spray' | 'bottle', productId?: number): Promise<void> {
    // For now, simulate usage tracking - in real implementation this would update the database
    console.log(`Recording usage: Slot ${slotNumber} (${slotType}) for product ${productId}`);
  }

  async getSlotUsageStats(): Promise<SlotUsageStats[]> {
    // Generate mock usage statistics for demonstration
    const stats: SlotUsageStats[] = [];
    
    // Spray slot stats (1-5)
    for (let i = 1; i <= 5; i++) {
      stats.push({
        id: i,
        slotNumber: i,
        slotType: 'spray',
        productId: Math.random() > 0.5 ? 1 : null,
        usageCount: Math.floor(Math.random() * 100) + 10,
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        popularityScore: Math.floor(Math.random() * 100)
      });
    }
    
    // Bottle slot stats (1-15)
    for (let i = 1; i <= 15; i++) {
      stats.push({
        id: i + 5,
        slotNumber: i,
        slotType: 'bottle',
        productId: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : null,
        usageCount: Math.floor(Math.random() * 80) + 5,
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        popularityScore: Math.floor(Math.random() * 100)
      });
    }
    
    return stats;
  }

  async calculatePopularityScores(): Promise<void> {
    // Calculate weighted popularity scores based on recent usage
    console.log('Calculating popularity scores based on usage patterns');
  }

  async getHeatmapData(): Promise<{ spraySlots: any[], bottleSlots: any[] }> {
    const stats = await this.getSlotUsageStats();
    const products = Array.from(this.products.values());
    
    const spraySlots = stats
      .filter(s => s.slotType === 'spray')
      .map(stat => {
        const product = products.find(p => p.id === stat.productId);
        return {
          slotNumber: stat.slotNumber,
          productId: stat.productId,
          productName: product?.name || 'Empty',
          usageCount: stat.usageCount,
          popularityScore: stat.popularityScore,
          lastUsed: stat.lastUsed,
          heatLevel: this.calculateHeatLevel(stat.popularityScore),
          product
        };
      });
    
    const bottleSlots = stats
      .filter(s => s.slotType === 'bottle')
      .map(stat => {
        const product = products.find(p => p.id === stat.productId);
        return {
          slotNumber: stat.slotNumber,
          productId: stat.productId,
          productName: product?.name || 'Empty',
          usageCount: stat.usageCount,
          popularityScore: stat.popularityScore,
          lastUsed: stat.lastUsed,
          heatLevel: this.calculateHeatLevel(stat.popularityScore),
          product
        };
      });
    
    return { spraySlots, bottleSlots };
  }

  private calculateHeatLevel(score: number): 'cold' | 'warm' | 'hot' | 'very-hot' {
    if (score >= 80) return 'very-hot';
    if (score >= 60) return 'hot';
    if (score >= 30) return 'warm';
    return 'cold';
  }

  // New flexible slot assignment methods (stub implementations for MemStorage)
  async assignProductToSpraySlot(productId: number, slotNumber: number, priority: number = 0): Promise<void> {
    // Stub implementation for MemStorage
    console.log(`MemStorage: Assigning product ${productId} to spray slot ${slotNumber} with priority ${priority}`);
  }

  async assignProductToBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml', priority: number = 0): Promise<void> {
    // Stub implementation for MemStorage
    console.log(`MemStorage: Assigning product ${productId} to bottle slot ${slotNumber} (${bottleSize}) with priority ${priority}`);
  }

  async removeProductFromSpraySlot(productId: number, slotNumber: number): Promise<void> {
    // Stub implementation for MemStorage
    console.log(`MemStorage: Removing product ${productId} from spray slot ${slotNumber}`);
  }

  async removeProductFromBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<void> {
    // Stub implementation for MemStorage
    console.log(`MemStorage: Removing product ${productId} from bottle slot ${slotNumber} (${bottleSize})`);
  }

  async getProductsInSpraySlot(slotNumber: number): Promise<Product[]> {
    // Stub implementation for MemStorage - return products assigned to this spray slot
    const products = Array.from(this.products.values());
    return products.filter(p => p.spraySlot === slotNumber);
  }

  async getProductsInBottleSlot(slotNumber: number): Promise<{ product: Product, bottleSize: '30ml' | '60ml' | '100ml' }[]> {
    // Stub implementation for MemStorage - return products assigned to this bottle slot
    const products = Array.from(this.products.values());
    const assignedProducts = products.filter(p => p.bottleSlot === slotNumber);
    return assignedProducts.map(product => ({
      product,
      bottleSize: product.bottleSize || '30ml'
    }));
  }

  async getAssignedSlotsForProduct(productId: number): Promise<{ spraySlots: number[], bottleSlots: { slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml' }[] }> {
    // Stub implementation for MemStorage
    const product = this.products.get(productId);
    if (!product) {
      return { spraySlots: [], bottleSlots: [] };
    }

    const spraySlots = product.spraySlot ? [product.spraySlot] : [];
    const bottleSlots = product.bottleSlot ? [{ slotNumber: product.bottleSlot, bottleSize: product.bottleSize || '30ml' }] : [];

    return { spraySlots, bottleSlots };
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateSprayStock(productId: number, quantity: number): Promise<Product | undefined> {
    const result = await db.update(products).set({ sprayStock: quantity }).where(eq(products.id, productId)).returning();
    return result[0];
  }

  async updateBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined> {
    const field = bottleSize === '30ml' ? 'bottleStock30ml' : bottleSize === '60ml' ? 'bottleStock60ml' : 'bottleStock100ml';
    const result = await db.update(products).set({ [field]: quantity }).where(eq(products.id, productId)).returning();
    return result[0];
  }

  async updateProductSlot(productId: number, slotType: 'spray' | 'bottle', slotNumber: number): Promise<Product | undefined> {
    const field = slotType === 'spray' ? 'spraySlot' : 'bottleSlot';
    const result = await db.update(products).set({ [field]: slotNumber }).where(eq(products.id, productId)).returning();
    return result[0];
  }

  async decrementSprayStock(productId: number, quantity: number): Promise<Product | undefined> {
    const result = await db.update(products)
      .set({ sprayStock: sql`${products.sprayStock} - ${quantity}` })
      .where(eq(products.id, productId))
      .returning();
    return result[0];
  }

  async decrementBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined> {
    const field = bottleSize === '30ml' ? products.bottleStock30ml : bottleSize === '60ml' ? products.bottleStock60ml : products.bottleStock100ml;
    const result = await db.update(products)
      .set({ [bottleSize === '30ml' ? 'bottleStock30ml' : bottleSize === '60ml' ? 'bottleStock60ml' : 'bottleStock100ml']: sql`${field} - ${quantity}` })
      .where(eq(products.id, productId))
      .returning();
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderWithTimestamp = {
      ...order,
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(orders).values(orderWithTimestamp).returning();
    return result[0];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async verifyAdminCredentials(username: string, password: string): Promise<boolean> {
    // Test mode: allow blank password for admin user
    return username === 'admin' && (password === 'admin' || password === '');
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const sessionWithTimestamp = {
      ...session,
      createdAt: new Date().toISOString()
    };
    const result = await db.insert(adminSessions).values(sessionWithTimestamp).returning();
    return result[0];
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, token)).limit(1);
    return result[0];
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.sessionToken, token));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBottleSlots(): Promise<BottleSlot[]> {
    return await db.select().from(bottleSlots);
  }

  async getBottleSlot(slotNumber: number): Promise<BottleSlot | undefined> {
    const result = await db.select().from(bottleSlots).where(eq(bottleSlots.slotNumber, slotNumber)).limit(1);
    return result[0];
  }

  async assignBottleSlot(slotNumber: number, productId: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<BottleSlot> {
    const result = await db.insert(bottleSlots)
      .values({ slotNumber, productId, bottleSize, stock: 10 })
      .onConflictDoUpdate({
        target: bottleSlots.slotNumber,
        set: { productId, bottleSize }
      })
      .returning();
    return result[0];
  }

  async updateBottleSlotStock(slotNumber: number, stock: number): Promise<BottleSlot | undefined> {
    const result = await db.update(bottleSlots).set({ stock }).where(eq(bottleSlots.slotNumber, slotNumber)).returning();
    return result[0];
  }

  async removeBottleSlotAssignment(slotNumber: number): Promise<boolean> {
    const result = await db.delete(bottleSlots).where(eq(bottleSlots.slotNumber, slotNumber));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async clearBottleSlot(slotNumber: number): Promise<void> {
    // Remove any existing product assignment from this bottle slot
    await db.update(products)
      .set({ bottleSlot: null })
      .where(eq(products.bottleSlot, slotNumber));
    
    // Also clear the bottle slots table
    await db.delete(bottleSlots).where(eq(bottleSlots.slotNumber, slotNumber));
  }

  async recordSlotUsage(slotNumber: number, slotType: 'spray' | 'bottle', productId?: number): Promise<void> {
    await db.insert(slotUsageStats)
      .values({
        slotNumber,
        slotType,
        productId,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
        popularityScore: 1
      })
      .onConflictDoUpdate({
        target: [slotUsageStats.slotNumber, slotUsageStats.slotType],
        set: {
          usageCount: sql`${slotUsageStats.usageCount} + 1`,
          lastUsed: new Date().toISOString(),
          popularityScore: sql`${slotUsageStats.popularityScore} + 1`
        }
      });
  }

  async getSlotUsageStats(): Promise<SlotUsageStats[]> {
    return await db.select().from(slotUsageStats);
  }

  async calculatePopularityScores(): Promise<void> {
    // Update popularity scores based on usage patterns
    await db.execute(sql`
      UPDATE ${slotUsageStats} 
      SET popularity_score = usage_count * (1 + (86400 - EXTRACT(EPOCH FROM (NOW() - last_used))) / 86400.0)
    `);
  }

  async getHeatmapData(): Promise<{ spraySlots: any[], bottleSlots: any[] }> {
    const sprayStats = await db.select().from(slotUsageStats).where(eq(slotUsageStats.slotType, 'spray'));
    const bottleStats = await db.select().from(slotUsageStats).where(eq(slotUsageStats.slotType, 'bottle'));
    
    const allProducts = await this.getProducts();
    
    const spraySlots = [];
    for (let i = 1; i <= 5; i++) {
      const product = allProducts.find(p => p.spraySlot === i && p.sprayStock && p.sprayStock > 0);
      const stats = sprayStats.find(s => s.slotNumber === i);
      
      spraySlots.push({
        slotNumber: i,
        productId: product?.id || null,
        productName: product?.name || null,
        stock: product?.sprayStock || 0,
        usageCount: stats?.usageCount || 0,
        lastUsed: stats?.lastUsed || null,
        popularityScore: stats?.popularityScore || 0
      });
    }
    
    const bottleSlots = [];
    const slots = await this.getBottleSlots();
    for (let i = 1; i <= 15; i++) {
      const slot = slots.find(s => s.slotNumber === i);
      const product = slot ? allProducts.find(p => p.id === slot.productId) : null;
      const stats = bottleStats.find(s => s.slotNumber === i);
      
      bottleSlots.push({
        slotNumber: i,
        productId: slot?.productId || null,
        productName: product?.name || null,
        bottleSize: slot?.bottleSize || null,
        stock: slot?.stock || 0,
        usageCount: stats?.usageCount || 0,
        lastUsed: stats?.lastUsed || null,
        popularityScore: stats?.popularityScore || 0
      });
    }
    
    return { spraySlots, bottleSlots };
  }

  // New flexible slot assignment methods
  async assignProductToSpraySlot(productId: number, slotNumber: number, priority: number = 0): Promise<void> {
    // Clear other products from this slot first
    await db.update(products)
      .set({ spraySlot: null })
      .where(sql`${products.spraySlot} = ${slotNumber} AND ${products.id} != ${productId}`);
    
    // Assign this product to the slot
    await db.update(products)
      .set({ spraySlot: slotNumber })
      .where(eq(products.id, productId));
    
    // Also maintain the slot assignments table for analytics
    await db.insert(spraySlotAssignments).values({
      slotNumber,
      productId,
      priority
    }).onConflictDoUpdate({
      target: [spraySlotAssignments.slotNumber, spraySlotAssignments.productId],
      set: { priority }
    });
  }

  async assignProductToBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml', priority: number = 0, slotQuantity: number = 1): Promise<void> {
    // Get product inventory for the specific bottle size
    const product = await this.getProduct(productId);
    if (!product) throw new Error('Product not found');
    
    const totalInventory = bottleSize === '30ml' ? product.bottleStock30ml : 
                          bottleSize === '60ml' ? product.bottleStock60ml : 
                          product.bottleStock100ml;
    
    // Get current total assigned quantity for this product variant across all slots
    const currentAssignments = await db.select()
      .from(bottleSlotAssignments)
      .where(sql`${bottleSlotAssignments.productId} = ${productId} AND ${bottleSlotAssignments.bottleSize} = ${bottleSize}`);
    
    // Calculate total currently assigned (excluding the slot we're updating if it exists)
    const totalAssigned = currentAssignments
      .filter(assignment => assignment.slotNumber !== slotNumber)
      .reduce((sum, assignment) => sum + (assignment.slotQuantity || 1), 0);
    
    // Check if new assignment would exceed inventory
    if (totalAssigned + slotQuantity > totalInventory) {
      const available = totalInventory - totalAssigned;
      throw new Error(`Cannot assign ${slotQuantity} units. Only ${available} units available for ${product.name} ${bottleSize} (Total inventory: ${totalInventory}, Currently assigned: ${totalAssigned})`);
    }
    
    // Clear existing assignment for this specific slot/product/size combination
    await db.delete(bottleSlotAssignments)
      .where(sql`${bottleSlotAssignments.slotNumber} = ${slotNumber} AND ${bottleSlotAssignments.productId} = ${productId} AND ${bottleSlotAssignments.bottleSize} = ${bottleSize}`);
    
    // Insert the new assignment
    await db.insert(bottleSlotAssignments).values({
      slotNumber,
      productId,
      bottleSize,
      priority,
      slotQuantity
    });
  }

  async removeProductFromSpraySlot(productId: number, slotNumber: number): Promise<void> {
    // Remove from product record
    await db.update(products)
      .set({ spraySlot: null })
      .where(sql`${products.id} = ${productId} AND ${products.spraySlot} = ${slotNumber}`);
    
    // Remove from slot assignments table
    await db.delete(spraySlotAssignments)
      .where(sql`${spraySlotAssignments.productId} = ${productId} AND ${spraySlotAssignments.slotNumber} = ${slotNumber}`);
  }

  async removeProductFromBottleSlot(productId: number, slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<void> {
    // Only remove from slot assignments table - don't touch the main product record
    // This allows the product to remain assigned to other bottle slots
    await db.delete(bottleSlotAssignments)
      .where(sql`${bottleSlotAssignments.productId} = ${productId} AND ${bottleSlotAssignments.slotNumber} = ${slotNumber} AND ${bottleSlotAssignments.bottleSize} = ${bottleSize}`);
  }

  async getProductsInSpraySlot(slotNumber: number): Promise<Product[]> {
    const assignments = await db.select().from(spraySlotAssignments)
      .where(eq(spraySlotAssignments.slotNumber, slotNumber))
      .orderBy(spraySlotAssignments.priority);
    
    const productIds = assignments.map(a => a.productId);
    if (productIds.length === 0) return [];
    
    const allProducts = await this.getProducts();
    return allProducts.filter(p => productIds.includes(p.id));
  }

  async getProductsInBottleSlot(slotNumber: number): Promise<any[]> {
    // First get the assignments
    const assignments = await db.select()
      .from(bottleSlotAssignments)
      .where(eq(bottleSlotAssignments.slotNumber, slotNumber))
      .orderBy(bottleSlotAssignments.priority);
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Then get the products separately and combine
    const allProducts = await this.getProducts();
    const results = assignments.map(assignment => {
      const product = allProducts.find(p => p.id === assignment.productId);
      return {
        id: assignment.id,
        slotNumber: assignment.slotNumber,
        productId: assignment.productId,
        bottleSize: assignment.bottleSize,
        priority: assignment.priority,
        slotQuantity: assignment.slotQuantity,
        product: product
      };
    }).filter(item => item.product);
    
    return results;
  }

  async getAssignedSlotsForProduct(productId: number): Promise<{ spraySlots: number[], bottleSlots: { slotNumber: number, bottleSize: '30ml' | '60ml' | '100ml' }[] }> {
    const [sprayAssignments, bottleAssignments] = await Promise.all([
      db.select().from(spraySlotAssignments).where(eq(spraySlotAssignments.productId, productId)),
      db.select().from(bottleSlotAssignments).where(eq(bottleSlotAssignments.productId, productId))
    ]);

    return {
      spraySlots: sprayAssignments.map(a => a.slotNumber),
      bottleSlots: bottleAssignments.map(a => ({ slotNumber: a.slotNumber, bottleSize: a.bottleSize }))
    };
  }

  async getAvailableProductsWithSlots(): Promise<Product[]> {
    // Get all products that have slot assignments
    const allProducts = await this.getProducts();
    const availableProducts = [];

    for (const product of allProducts) {
      const assignments = await this.getAssignedSlotsForProduct(product.id);
      const hasSpraySlots = assignments.spraySlots.length > 0;
      const hasBottleSlots = assignments.bottleSlots.length > 0;
      
      // Product is available if it has slots assigned AND has inventory
      if ((hasSpraySlots && product.sprayStock > 0) || 
          (hasBottleSlots && (product.bottleStock30ml > 0 || product.bottleStock60ml > 0 || product.bottleStock100ml > 0))) {
        availableProducts.push(product);
      }
    }

    return availableProducts;
  }

  // Sales analytics implementations
  async recordSale(productId: number, orderType: 'spray' | 'bottle', bottleSize?: '30ml' | '60ml' | '100ml', quantity: number = 1, revenue: number = 0, slotNumber?: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Update daily sales summary
    await db.insert(salesSummary).values({
      date: today,
      totalRevenue: revenue,
      totalOrders: 1,
      sprayOrders: orderType === 'spray' ? 1 : 0,
      bottleOrders: orderType === 'bottle' ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).onConflictDoUpdate({
      target: salesSummary.date,
      set: {
        totalRevenue: sql`${salesSummary.totalRevenue} + ${revenue}`,
        totalOrders: sql`${salesSummary.totalOrders} + 1`,
        sprayOrders: sql`${salesSummary.sprayOrders} + ${orderType === 'spray' ? 1 : 0}`,
        bottleOrders: sql`${salesSummary.bottleOrders} + ${orderType === 'bottle' ? 1 : 0}`,
        updatedAt: new Date().toISOString()
      }
    });

    // Update product sales summary
    await db.insert(productSales).values({
      productId,
      date: today,
      sprayQuantity: orderType === 'spray' ? quantity : 0,
      bottle30mlQuantity: orderType === 'bottle' && bottleSize === '30ml' ? quantity : 0,
      bottle60mlQuantity: orderType === 'bottle' && bottleSize === '60ml' ? quantity : 0,
      bottle100mlQuantity: orderType === 'bottle' && bottleSize === '100ml' ? quantity : 0,
      totalRevenue: revenue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).onConflictDoUpdate({
      target: [productSales.productId, productSales.date],
      set: {
        sprayQuantity: sql`${productSales.sprayQuantity} + ${orderType === 'spray' ? quantity : 0}`,
        bottle30mlQuantity: sql`${productSales.bottle30mlQuantity} + ${orderType === 'bottle' && bottleSize === '30ml' ? quantity : 0}`,
        bottle60mlQuantity: sql`${productSales.bottle60mlQuantity} + ${orderType === 'bottle' && bottleSize === '60ml' ? quantity : 0}`,
        bottle100mlQuantity: sql`${productSales.bottle100mlQuantity} + ${orderType === 'bottle' && bottleSize === '100ml' ? quantity : 0}`,
        totalRevenue: sql`${productSales.totalRevenue} + ${revenue}`,
        updatedAt: new Date().toISOString()
      }
    });
  }

  async getDailySalesReport(date: string): Promise<SalesSummary | null> {
    const result = await db.select().from(salesSummary).where(eq(salesSummary.date, date)).limit(1);
    return result[0] || null;
  }

  async getWeeklySalesReport(startDate: string, endDate: string): Promise<SalesSummary[]> {
    return await db.select().from(salesSummary)
      .where(sql`${salesSummary.date} >= ${startDate} AND ${salesSummary.date} <= ${endDate}`)
      .orderBy(salesSummary.date);
  }

  async getMonthlySalesReport(year: number, month: number): Promise<SalesSummary[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return this.getWeeklySalesReport(startDate, endDate);
  }

  async getProductSalesReport(productId: number, startDate: string, endDate: string): Promise<ProductSales[]> {
    return await db.select().from(productSales)
      .where(sql`${productSales.productId} = ${productId} AND ${productSales.date} >= ${startDate} AND ${productSales.date} <= ${endDate}`)
      .orderBy(productSales.date);
  }

  async getTopSellingProducts(period: 'daily' | 'weekly' | 'monthly', date?: string): Promise<Array<Product & {totalSales: number, totalRevenue: number}>> {
    // This is a simplified implementation
    const allProducts = await this.getProducts();
    return allProducts.map(product => ({
      ...product,
      totalSales: 0,
      totalRevenue: 0
    }));
  }

  async getSalesAnalytics(period: 'daily' | 'weekly' | 'monthly', date?: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    sprayOrders: number;
    bottleOrders: number;
    topProducts: Array<{product: Product, sales: number, revenue: number}>;
  }> {
    const today = date || new Date().toISOString().split('T')[0];
    const dailyReport = await this.getDailySalesReport(today);
    
    return {
      totalRevenue: dailyReport?.totalRevenue || 0,
      totalOrders: dailyReport?.totalOrders || 0,
      averageOrderValue: dailyReport && dailyReport.totalOrders > 0 ? dailyReport.totalRevenue / dailyReport.totalOrders : 0,
      sprayOrders: dailyReport?.sprayOrders || 0,
      bottleOrders: dailyReport?.bottleOrders || 0,
      topProducts: []
    };
  }

  async getAvailableQuantityForProduct(productId: number, bottleSize: '30ml' | '60ml' | '100ml'): Promise<number> {
    // Get product inventory
    const product = await this.getProduct(productId);
    if (!product) return 0;
    
    const totalInventory = bottleSize === '30ml' ? product.bottleStock30ml : 
                          bottleSize === '60ml' ? product.bottleStock60ml : 
                          product.bottleStock100ml;
    
    // Get current total assigned quantity for this product variant across all slots
    const currentAssignments = await db.select()
      .from(bottleSlotAssignments)
      .where(sql`${bottleSlotAssignments.productId} = ${productId} AND ${bottleSlotAssignments.bottleSize} = ${bottleSize}`);
    
    const totalAssigned = currentAssignments.reduce((sum, assignment) => sum + (assignment.slotQuantity || 1), 0);
    
    return Math.max(0, totalInventory - totalAssigned);
  }
}

export const storage = new DatabaseStorage();
