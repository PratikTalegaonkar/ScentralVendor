import { users, products, orders, adminSessions, type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type AdminSession, type InsertAdminSession } from "@shared/schema";

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
  decrementSprayStock(productId: number, quantity: number): Promise<Product | undefined>;
  decrementBottleStock(productId: number, bottleSize: '30ml' | '60ml' | '100ml', quantity: number): Promise<Product | undefined>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Admin authentication
  verifyAdminCredentials(username: string, password: string): Promise<boolean>;
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
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
        imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 85,
        bottleStock30ml: 45,
        bottleStock60ml: 25,
        bottleStock100ml: 15
      },
      {
        name: "Rose Gold",
        description: "Romantic & Luxurious",
        price: 15000, // ₹150.00
        imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 92,
        bottleStock30ml: 38,
        bottleStock60ml: 22,
        bottleStock100ml: 12
      },
      {
        name: "Ocean Breeze",
        description: "Fresh & Invigorating",
        price: 10000, // ₹100.00
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 78,
        bottleStock30ml: 52,
        bottleStock60ml: 28,
        bottleStock100ml: 18
      },
      {
        name: "Amber Sunset",
        description: "Warm & Sensual",
        price: 16700, // ₹167.00
        imageUrl: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 65,
        bottleStock30ml: 35,
        bottleStock60ml: 20,
        bottleStock100ml: 8
      },
      {
        name: "Crystal Pure",
        description: "Clean & Ethereal",
        price: 11700, // ₹117.00
        imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=300&fit=crop",
        available: true,
        sprayStock: 88,
        bottleStock30ml: 42,
        bottleStock60ml: 31,
        bottleStock100ml: 16
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
      bottleStock100ml: insertProduct.bottleStock100ml ?? 20
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
      createdAt: new Date().toISOString()
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
    // Simple hardcoded credentials for testing
    return username === 'admin' && password === 'admin';
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
}

export const storage = new MemStorage();
