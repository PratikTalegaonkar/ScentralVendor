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

  // Create spray order
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
      
      // Create order (stock will be decremented after successful payment)
      const order = await storage.createOrder(orderData);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // Create bottle order (single order for multiple bottles)
  app.post("/api/bottle-orders", async (req, res) => {
    try {
      const { bottles, paymentMethod = 'razorpay' } = req.body;
      
      if (!bottles || !Array.isArray(bottles) || bottles.length === 0) {
        return res.status(400).json({ message: "Bottles array is required" });
      }
      
      let totalAmount = 0;
      const bottleDetails = [];
      
      // Validate all bottles and calculate total
      for (const bottle of bottles) {
        const { productId, bottleSize } = bottle;
        const product = await storage.getProduct(productId);
        
        if (!product) {
          return res.status(404).json({ message: `Product ${productId} not found` });
        }
        
        // Check stock for specific bottle size
        let stock = 0;
        let price = 0;
        if (bottleSize === '30ml') {
          stock = product.bottleStock30ml;
          price = product.price30ml;
        } else if (bottleSize === '60ml') {
          stock = product.bottleStock60ml;
          price = product.price60ml;
        } else if (bottleSize === '100ml') {
          stock = product.bottleStock100ml;
          price = product.price100ml;
        }
        
        if (stock < 1) {
          return res.status(400).json({ message: `${product.name} ${bottleSize} is out of stock` });
        }
        
        totalAmount += price;
        bottleDetails.push({ productId, bottleSize, price });
      }
      
      // Create a single order with bottle details stored
      const orderData = {
        productId: bottleDetails[0].productId, // Use first product for main reference
        paymentMethod: 'bottle',
        amount: totalAmount,
        status: 'pending' as const,
        bottleSize: JSON.stringify(bottleDetails) // Store all bottle details as JSON
      };
      
      const order = await storage.createOrder(orderData);
      
      res.status(201).json({
        order,
        totalAmount,
        bottleDetails,
        message: "Bottle order created successfully"
      });
    } catch (error) {
      console.error('Bottle order creation error:', error);
      res.status(500).json({ message: "Failed to create bottle orders" });
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
          
          // Decrement stock after successful payment
          if (updatedOrder) {
            if (updatedOrder.paymentMethod === 'bottle' && updatedOrder.bottleSize) {
              try {
                // Parse bottle details from JSON
                const bottleDetails = JSON.parse(updatedOrder.bottleSize);
                if (Array.isArray(bottleDetails)) {
                  // Multiple bottles - decrement each
                  for (const bottle of bottleDetails) {
                    await storage.decrementBottleStock(bottle.productId, bottle.bottleSize as '30ml' | '60ml' | '100ml', 1);
                  }
                } else {
                  // Single bottle - backward compatibility
                  await storage.decrementBottleStock(updatedOrder.productId, updatedOrder.bottleSize as '30ml' | '60ml' | '100ml', 1);
                }
              } catch (error) {
                // Fallback for non-JSON bottle size (backward compatibility)
                await storage.decrementBottleStock(updatedOrder.productId, updatedOrder.bottleSize as '30ml' | '60ml' | '100ml', 1);
              }
            } else {
              // Decrement spray stock
              await storage.decrementSprayStock(updatedOrder.productId, 1);
            }
          }
          
          res.json({
            success: true,
            order: updatedOrder,
            message: "Payment verified successfully",
            stockUpdated: true // Signal that stock was updated
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
        
        // Decrement stock after successful payment
        if (updatedOrder) {
          if (updatedOrder.paymentMethod === 'bottle' && updatedOrder.bottleSize) {
            try {
              // Parse bottle details from JSON
              const bottleDetails = JSON.parse(updatedOrder.bottleSize);
              if (Array.isArray(bottleDetails)) {
                // Multiple bottles - decrement each
                for (const bottle of bottleDetails) {
                  await storage.decrementBottleStock(bottle.productId, bottle.bottleSize as '30ml' | '60ml' | '100ml', 1);
                }
              } else {
                // Single bottle - backward compatibility
                await storage.decrementBottleStock(updatedOrder.productId, updatedOrder.bottleSize as '30ml' | '60ml' | '100ml', 1);
              }
            } catch (error) {
              // Fallback for non-JSON bottle size (backward compatibility)
              await storage.decrementBottleStock(updatedOrder.productId, updatedOrder.bottleSize as '30ml' | '60ml' | '100ml', 1);
            }
          } else {
            // Decrement spray stock
            await storage.decrementSprayStock(updatedOrder.productId, 1);
          }
        }
        
        res.json({
          success: true,
          order: updatedOrder,
          message: "Payment verified successfully (Test Mode)",
          stockUpdated: true // Signal that stock was updated
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

  // Admin slot management - Update product slot assignment
  app.put("/api/admin/products/:id/slot", authenticateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { slotType, slotNumber } = req.body;
      
      if (!['spray', 'bottle'].includes(slotType)) {
        return res.status(400).json({ message: "Invalid slot type" });
      }
      
      if (typeof slotNumber !== 'number' || slotNumber < 1) {
        return res.status(400).json({ message: "Invalid slot number" });
      }

      // Validate slot ranges
      if (slotType === 'spray' && (slotNumber < 1 || slotNumber > 5)) {
        return res.status(400).json({ message: "Spray slots must be between 1-5" });
      }
      
      if (slotType === 'bottle' && (slotNumber < 1 || slotNumber > 15)) {
        return res.status(400).json({ message: "Bottle slots must be between 1-15" });
      }

      const updatedProduct = await storage.updateProductSlot(productId, slotType, slotNumber);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product slot" });
    }
  });

  // Bottle Slots API
  app.get('/api/admin/bottle-slots', authenticateAdmin, async (req, res) => {
    try {
      const slots = await storage.getBottleSlots();
      res.json(slots);
    } catch (error) {
      console.error('Error getting bottle slots:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/bottle-slots/:slotNumber/assign', authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const { productId, bottleSize } = req.body;
      
      if (!productId || !bottleSize || !['30ml', '60ml', '100ml'].includes(bottleSize)) {
        return res.status(400).json({ message: 'Product ID and valid bottle size required' });
      }
      
      // First, clear any existing product from this slot
      await storage.clearBottleSlot(slotNumber);
      
      // Then assign the new product to this slot
      const updatedProduct = await storage.updateProductSlot(productId, 'bottle', slotNumber);
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error assigning bottle slot:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/admin/bottle-slots/:slotNumber/stock', authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const { stock } = req.body;
      
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Valid stock quantity required' });
      }
      
      const slot = await storage.updateBottleSlotStock(slotNumber, stock);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      res.json(slot);
    } catch (error) {
      console.error('Error updating bottle slot stock:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/bottle-slots/:slotNumber', authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      await storage.clearBottleSlot(slotNumber);
      const removed = true;
      
      if (!removed) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing bottle slot assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Heatmap and Usage Analytics API
  app.get('/api/admin/heatmap', authenticateAdmin, async (req, res) => {
    try {
      const heatmapData = await storage.getHeatmapData();
      res.json(heatmapData);
    } catch (error) {
      console.error('Error getting heatmap data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/usage-stats', authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getSlotUsageStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting usage stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/record-usage', authenticateAdmin, async (req, res) => {
    try {
      const { slotNumber, slotType, productId } = req.body;
      
      if (!slotNumber || !slotType || !['spray', 'bottle'].includes(slotType)) {
        return res.status(400).json({ message: 'Slot number and valid slot type required' });
      }
      
      await storage.recordSlotUsage(slotNumber, slotType, productId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording usage:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // New flexible slot assignment API routes
  
  // Assign product to spray slot
  app.post("/api/admin/slots/spray/:slotNumber/assign", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const { productId, priority = 0 } = req.body;
      
      if (!productId || slotNumber < 1 || slotNumber > 5) {
        return res.status(400).json({ message: "Invalid slot number or product ID" });
      }
      
      await storage.assignProductToSpraySlot(productId, slotNumber, priority);
      res.json({ message: "Product assigned to spray slot successfully" });
    } catch (error) {
      console.error("Spray slot assignment error:", error);
      res.status(500).json({ message: "Failed to assign product to spray slot" });
    }
  });

  // Assign product to bottle slot
  app.post("/api/admin/slots/bottle/:slotNumber/assign", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const { productId, bottleSize, priority = 0, slotQuantity = 1 } = req.body;
      
      if (!productId || !bottleSize || slotNumber < 1 || slotNumber > 15) {
        return res.status(400).json({ message: "Invalid slot number, product ID, or bottle size" });
      }
      
      if (!['30ml', '60ml', '100ml'].includes(bottleSize)) {
        return res.status(400).json({ message: "Invalid bottle size" });
      }

      if (slotQuantity < 1 || slotQuantity > 20) {
        return res.status(400).json({ message: "Slot quantity must be between 1 and 20" });
      }
      
      await storage.assignProductToBottleSlot(productId, slotNumber, bottleSize, priority, slotQuantity);
      res.json({ message: "Product assigned to bottle slot successfully" });
    } catch (error) {
      console.error("Bottle slot assignment error:", error);
      // Return specific error message if it's an inventory validation error
      const errorMessage = error instanceof Error ? error.message : "Failed to assign product to bottle slot";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get available quantity for a product variant
  app.get("/api/admin/products/:productId/available-quantity/:bottleSize", authenticateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const bottleSize = req.params.bottleSize as '30ml' | '60ml' | '100ml';
      
      if (!['30ml', '60ml', '100ml'].includes(bottleSize)) {
        return res.status(400).json({ message: "Invalid bottle size" });
      }
      
      const availableQuantity = await storage.getAvailableQuantityForProduct(productId, bottleSize);
      res.json({ availableQuantity });
    } catch (error) {
      console.error("Available quantity error:", error);
      res.status(500).json({ message: "Failed to get available quantity" });
    }
  });

  // Remove product from spray slot
  app.delete("/api/admin/slots/spray/:slotNumber/product/:productId", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const productId = parseInt(req.params.productId);
      
      await storage.removeProductFromSpraySlot(productId, slotNumber);
      res.json({ message: "Product removed from spray slot successfully" });
    } catch (error) {
      console.error("Remove spray slot error:", error);
      res.status(500).json({ message: "Failed to remove product from spray slot" });
    }
  });

  // Remove product from bottle slot
  app.delete("/api/admin/slots/bottle/:slotNumber/product/:productId", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const productId = parseInt(req.params.productId);
      const { bottleSize } = req.body;
      
      // If bottleSize not provided in body, try to get it from the current product assignment
      if (!bottleSize) {
        const product = await storage.getProduct(productId);
        if (product && product.bottleSlot === slotNumber) {
          bottleSize = product.bottleSize;
        }
      }
      
      if (!bottleSize || !['30ml', '60ml', '100ml'].includes(bottleSize)) {
        return res.status(400).json({ message: "Invalid bottle size or bottle size not found" });
      }
      
      await storage.removeProductFromBottleSlot(productId, slotNumber, bottleSize);
      res.json({ message: "Product removed from bottle slot successfully" });
    } catch (error) {
      console.error("Bottle slot removal error:", error);
      res.status(500).json({ message: "Failed to remove product from bottle slot" });
    }
  });

  // Get products in a specific spray slot
  app.get("/api/admin/slots/spray/:slotNumber/products", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const products = await storage.getProductsInSpraySlot(slotNumber);
      res.json(products);
    } catch (error) {
      console.error("Get spray slot products error:", error);
      res.status(500).json({ message: "Failed to get products in spray slot" });
    }
  });

  // Get products in a specific bottle slot
  app.get("/api/admin/slots/bottle/:slotNumber/products", authenticateAdmin, async (req, res) => {
    try {
      const slotNumber = parseInt(req.params.slotNumber);
      const products = await storage.getProductsInBottleSlot(slotNumber);
      res.json(products || []);
    } catch (error) {
      console.error("Get bottle slot products error:", error);
      res.status(500).json({ message: "Failed to get products in bottle slot", error: error.message });
    }
  });

  // Get all slot assignments for a product
  app.get("/api/admin/products/:productId/slots", authenticateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const assignments = await storage.getAssignedSlotsForProduct(productId);
      res.json(assignments);
    } catch (error) {
      console.error("Get product slots error:", error);
      res.status(500).json({ message: "Failed to get product slot assignments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
