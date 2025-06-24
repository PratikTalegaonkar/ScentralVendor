import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import Razorpay from "razorpay";

// Initialize Razorpay with test credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_JC3STLbbaI4tzF';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'UWgSetKohp5TbYd2RwYMiNfQ';

const isRazorpayEnabled = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_KEY_ID.startsWith('rzp_');
console.log('Razorpay Enabled:', isRazorpayEnabled, 'Key ID:', RAZORPAY_KEY_ID);

const razorpay = isRazorpayEnabled ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Verify product exists and has sufficient spray stock
      const product = await storage.getProduct(orderData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.sprayStock < 1) {
        return res.status(400).json({ message: "Product out of stock" });
      }
      
      // Create order
      const order = await storage.createOrder(orderData);
      
      // Decrement spray stock by 1 for each order
      await storage.decrementSprayStock(orderData.productId, 1);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // Create Razorpay order (with test mode support)
  app.post("/api/razorpay/order", async (req, res) => {
    try {
      const { amount, currency = 'INR', orderId } = req.body;
      
      if (isRazorpayEnabled && razorpay) {
        // Real Razorpay integration
        const options = {
          amount: amount * 100, // Razorpay expects amount in paise
          currency,
          receipt: `receipt_${orderId}`,
          notes: {
            orderId: orderId.toString()
          }
        };
        
        const razorpayOrder = await razorpay.orders.create(options);
        
        res.json({
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        });
      } else {
        // Test mode - simulate Razorpay order creation
        const testOrder = {
          id: `order_test_${nanoid()}`,
          amount: amount * 100,
          currency,
          receipt: `receipt_${orderId}`,
          status: 'created'
        };
        
        res.json(testOrder);
      }
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      res.status(500).json({ message: "Failed to create Razorpay order" });
    }
  });

  // Verify Razorpay payment (with test mode support)
  app.post("/api/razorpay/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
      
      if (isRazorpayEnabled && process.env.RAZORPAY_KEY_SECRET) {
        // Real Razorpay verification
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
        
        if (generated_signature === razorpay_signature) {
          const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), "completed");
          res.json({
            success: true,
            order: updatedOrder,
            message: "Payment verified successfully"
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Payment verification failed"
          });
        }
      } else {
        // Test mode - simulate successful verification
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing delay
        const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), "completed");
        
        res.json({
          success: true,
          order: updatedOrder,
          message: "Payment verified successfully (Test Mode)"
        });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({ message: "Payment verification failed" });
    }
  });

  // Get Razorpay configuration status
  app.get("/api/razorpay/config", async (req, res) => {
    res.json({
      enabled: isRazorpayEnabled,
      testMode: false, // We're using real Razorpay test keys
      keyId: RAZORPAY_KEY_ID
    });
  });

  // Process payment (fallback for non-Razorpay methods)
  app.post("/api/orders/:id/payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentMethod } = req.body;
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Simulate payment processing for non-Razorpay methods
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order status
      const updatedOrder = await storage.updateOrderStatus(id, "completed");
      
      res.json({ 
        success: true, 
        order: updatedOrder,
        message: "Payment processed successfully" 
      });
    } catch (error) {
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Get order status
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin authentication middleware
  const authenticateAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const session = await storage.getAdminSession(token);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    req.adminSession = session;
    next();
  };

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const isValid = await storage.verifyAdminCredentials(username, password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      const session = await storage.createAdminSession({
        sessionToken: token,
        expiresAt
      });
      
      res.json({ token, expiresAt: session.expiresAt });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", authenticateAdmin, async (req: any, res) => {
    try {
      await storage.deleteAdminSession(req.adminSession.sessionToken);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Admin product management
  app.get("/api/admin/products", authenticateAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", authenticateAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const product = await storage.updateProduct(id, updateData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Admin order management
  app.get("/api/admin/orders", authenticateAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin inventory management - Update spray stock
  app.put("/api/admin/products/:id/spray-stock", authenticateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedProduct = await storage.updateSprayStock(productId, quantity);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update spray stock" });
    }
  });

  // Admin inventory management - Update bottle stock
  app.put("/api/admin/products/:id/bottle-stock", authenticateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { bottleSize, quantity } = req.body;
      
      if (!['30ml', '60ml', '100ml'].includes(bottleSize)) {
        return res.status(400).json({ message: "Invalid bottle size" });
      }
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedProduct = await storage.updateBottleStock(productId, bottleSize, quantity);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bottle stock" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
