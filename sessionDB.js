// Session-Based Product Database Manager
class SessionProductDatabase {
    constructor() {
        this.products = {};
        this.deals = [];
        this.inventory = [];
        this.isInitialized = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.pendingUpdates = [];
    }

    // Initialize session - load fresh data from Google Sheets
    async initialize() {
        try {
            console.log('🚀 Initializing Polymer Trading System...');
            showNotification('Loading fresh data from Google Sheets...', 'info');
            
            // Validate configuration first
            if (!validateConfig()) {
                throw new Error('Invalid configuration. Please check config.js');
            }
            
            // Load products from Google Sheets (master source)
            await this.loadProductsFromSheets();
            
            // Load existing deals and inventory from local storage (if any)
            this.loadLocalData();
            
            // Setup real-time sync
            this.setupRealTimeSync();
            
            this.isInitialized = true;
            this.lastSyncTime = Date.now();
            
            console.log(`✅ Session initialized with ${Object.keys(this.products).length} products`);
            showNotification(`System ready! Loaded ${Object.keys(this.products).length} products`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize session:', error);
            showNotification('Failed to load from Google Sheets. Check your configuration.', 'error');
            throw error;
        }
    }

    // Load fresh product data from Google Sheets
    async loadProductsFromSheets() {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PRODUCT_SHEET_RANGE}?key=${ENV_CONFIG.GOOGLE_API_KEY}`
            );
            
            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const rows = data.values;
            
            if (!rows || rows.length < 2) {
                throw new Error('No product data found in Google Sheets');
            }
            
            // Clear existing products and reload fresh
            this.products = {};
            
            // Skip header row, load all products
            for (let i = 1; i < rows.length; i++) {
                const [product, grade, company, specificGrade, source] = rows[i];
                if (product && product.trim()) {
                    this.products[product.trim()] = {
                        grade: grade?.trim() || '',
                        company: company?.trim() || '',
                        specificGrade: specificGrade?.trim() || '',
                        source: source?.trim() || 'Original',
                        rowIndex: i + 1,
                        lastUpdated: Date.now()
                    };
                }
            }
            
            console.log(`📦 Loaded ${Object.keys(this.products).length} products from Google Sheets`);
            
            // Update UI if available
            if (typeof updateProductDropdown === 'function') {
                updateProductDropdown();
            }
            if (typeof updateProductsDatabase === 'function') {
                updateProductsDatabase();
            }
            
            return this.products;
        } catch (error) {
            console.error('Error loading products from Google Sheets:', error);
            throw error;
        }
    }

    // Load deals and inventory from local storage
    loadLocalData() {
        try {
            const storedDeals = localStorage.getItem('deals');
            const storedInventory = localStorage.getItem('inventory');
            
            this.deals = storedDeals ? JSON.parse(storedDeals) : [];
            this.inventory = storedInventory ? JSON.parse(storedInventory) : [];
            
            console.log(`📊 Loaded ${this.deals.length} deals and ${this.inventory.length} inventory items from local storage`);
        } catch (error) {
            console.warn('Failed to load local data:', error);
            this.deals = [];
            this.inventory = [];
        }
    }

    // Setup real-time synchronization
    setupRealTimeSync() {
        // Periodic sync check for external updates
        this.syncInterval = setInterval(async () => {
            await this.checkForExternalUpdates();
        }, ENV_CONFIG.SYNC_INTERVAL);

        // Process pending updates
        setInterval(() => {
            this.processPendingUpdates();
        }, 30000); // Every 30 seconds

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        console.log(`🔄 Real-time sync enabled (checking every ${ENV_CONFIG.SYNC_INTERVAL / 1000}s)`);
    }

    // Check for external updates to Google Sheets
    async checkForExternalUpdates() {
        if (!this.isInitialized) return;

        try {
            console.log('🔍 Checking for external product updates...');
            
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PRODUCT_SHEET_RANGE}?key=${ENV_CONFIG.GOOGLE_API_KEY}`
            );
            
            if (!response.ok) {
                console.warn('Failed to check for updates:', response.statusText);
                return;
            }
            
            const data = await response.json();
            const rows = data.values;
            
            if (!rows || rows.length < 2) return;
            
            // Compare with current products
            const newProducts = {};
            for (let i = 1; i < rows.length; i++) {
                const [product, grade, company, specificGrade, source] = rows[i];
                if (product && product.trim()) {
                    newProducts[product.trim()] = {
                        grade: grade?.trim() || '',
                        company: company?.trim() || '',
                        specificGrade: specificGrade?.trim() || '',
                        source: source?.trim() || 'Original',
                        rowIndex: i + 1
                    };
                }
            }
            
            // Check if products have changed
            const hasChanges = this.detectProductChanges(newProducts);
            
            if (hasChanges) {
                console.log('📥 External product updates detected, refreshing...');
                this.products = newProducts;
                
                // Update UI if functions are available
                if (typeof updateProductDropdown === 'function') {
                    updateProductDropdown();
                }
                if (typeof updateProductsDatabase === 'function') {
                    updateProductsDatabase();
                }
                
                showNotification('Product database updated from Google Sheets', 'info');
            }
            
        } catch (error) {
            console.warn('Error checking for updates:', error);
        }
    }

    // Detect if products have changed
    detectProductChanges(newProducts) {
        const currentKeys = Object.keys(this.products).sort();
        const newKeys = Object.keys(newProducts).sort();
       
       // Check if number of products changed
       if (currentKeys.length !== newKeys.length) {
           return true;
       }
       
       // Check if product codes changed
       if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
           return true;
       }
       
       // Check if product details changed
       for (const key of currentKeys) {
           const current = this.products[key];
           const updated = newProducts[key];
           
           if (!updated || 
               current.grade !== updated.grade ||
               current.company !== updated.company ||
               current.specificGrade !== updated.specificGrade) {
               return true;
           }
       }
       
       return false;
   }

   // Add new product to session and sync to Google Sheets
   async addProduct(productData) {
       try {
           // 1. Add to in-memory database immediately
           this.products[productData.product] = {
               grade: productData.grade,
               company: productData.company,
               specificGrade: productData.specificGrade,
               source: `Added via App - ${new Date().toLocaleString()}`,
               lastUpdated: Date.now()
           };
           
           // 2. Update UI immediately
           if (typeof updateProductDropdown === 'function') {
               updateProductDropdown();
           }
           if (typeof updateProductsDatabase === 'function') {
               updateProductsDatabase();
           }
           
           // 3. Sync to Google Sheets
           const success = await this.syncProductToSheets(productData);
           
           if (success) {
               console.log(`✅ Product ${productData.product} added and synced to Google Sheets`);
               showNotification('Product added successfully!', 'success');
           } else {
               // 4. Queue for retry if sync fails
               this.pendingUpdates.push({
                   type: 'add-product',
                   data: productData,
                   timestamp: Date.now(),
                   retries: 0
               });
               showNotification('Product added locally. Will sync to Google Sheets when possible.', 'warning');
           }
           
       } catch (error) {
           console.error('Error adding product:', error);
           showNotification('Error adding product: ' + error.message, 'error');
       }
   }

   // Sync product to Google Sheets
   async syncProductToSheets(productData) {
       try {
           const response = await fetch(
               `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PRODUCT_SHEET_RANGE}:append?valueInputOption=RAW&key=${ENV_CONFIG.GOOGLE_API_KEY}`,
               {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({
                       values: [[
                           productData.product,
                           productData.grade,
                           productData.company,
                           productData.specificGrade,
                           `Added via App - ${new Date().toLocaleString()}`
                       ]]
                   })
               }
           );
           
           return response.ok;
       } catch (error) {
           console.error('Error syncing product to Google Sheets:', error);
           return false;
       }
   }

   // Process pending updates
   async processPendingUpdates() {
       if (this.pendingUpdates.length === 0) return;
       
       console.log(`🔄 Processing ${this.pendingUpdates.length} pending updates...`);
       
       const remainingUpdates = [];
       
       for (const update of this.pendingUpdates) {
           try {
               let success = false;
               
               if (update.type === 'add-product') {
                   success = await this.syncProductToSheets(update.data);
               }
               
               if (success) {
                   console.log(`✅ Successfully synced pending update: ${update.type}`);
               } else {
                   update.retries = (update.retries || 0) + 1;
                   if (update.retries < 5) {
                       remainingUpdates.push(update);
                   } else {
                       console.warn(`❌ Giving up on update after 5 retries: ${update.type}`);
                   }
               }
           } catch (error) {
               console.error('Error processing pending update:', error);
               remainingUpdates.push(update);
           }
       }
       
       this.pendingUpdates = remainingUpdates;
   }

   // Get product by code
   getProduct(productCode) {
       return this.products[productCode] || null;
   }

   // Get all products
   getAllProducts() {
       return { ...this.products };
   }

   // Manual refresh from Google Sheets
   async refresh() {
       showNotification('Refreshing from Google Sheets...', 'info');
       await this.loadProductsFromSheets();
       showNotification('Data refreshed successfully!', 'success');
   }

   // Cleanup session
   cleanup() {
       console.log('🧹 Cleaning up session...');
       
       // Clear intervals
       if (this.syncInterval) {
           clearInterval(this.syncInterval);
           this.syncInterval = null;
       }
       
       // Clear in-memory data
       this.products = {};
       this.pendingUpdates = [];
       this.isInitialized = false;
       
       console.log('✅ Session cleanup complete');
   }

   // Get session statistics
   getStats() {
       return {
           products: Object.keys(this.products).length,
           deals: this.deals.length,
           inventory: this.inventory.length,
           pendingUpdates: this.pendingUpdates.length,
           isInitialized: this.isInitialized,
           lastSyncTime: this.lastSyncTime
       };
   }
}

// Initialize session database
window.sessionDB = new SessionProductDatabase();
