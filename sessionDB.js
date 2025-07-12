// Session Database Management - Handles Google Sheets integration and local caching

// Centralized date formatting function for dd-mm-yyyy format
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

// Enhanced Session-Based Database Manager with Service Account Auth
class SessionProductDatabase {
    constructor() {
        this.products = {};
        this.purchaseParties = {};
        this.saleParties = {};
        this.deals = [];
        this.inventory = [];
        this.isInitialized = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.pendingUpdates = [];
    }

    // Make authenticated request to Google Sheets API
    async makeAuthenticatedRequest(url, options = {}) {
        try {
            const accessToken = await googleAuth.getAccessToken();
            
            const authenticatedOptions = {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            const response = await fetch(url, authenticatedOptions);
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
            }

            return response;
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    }

    // Initialize session - load fresh data from Google Sheets
    async initialize() {
        try {
            console.log('🚀 Initializing Polymer Trading System with Service Account...');
            showNotification('Loading fresh data from Google Sheets...', 'info');
            
            // Validate configuration first
            if (!validateConfig()) {
                throw new Error('Invalid configuration. Please check config.js');
            }
            
            // Test authentication
            await googleAuth.getAccessToken();
            
            // Load all data from Google Sheets (master sources)
            await Promise.all([
                this.loadProductsFromSheets(),
                this.loadPurchasePartiesFromSheets(),
                this.loadSalePartiesFromSheets()
            ]);
            
            // Load existing deals and inventory from local storage (if any)
            this.loadLocalData();
            
            // Setup real-time sync
            this.setupRealTimeSync();
            
            this.isInitialized = true;
            this.lastSyncTime = Date.now();
            
            const stats = this.getLoadStats();
            console.log(`✅ Session initialized: ${stats.products} products, ${stats.purchaseParties} purchase parties, ${stats.saleParties} sale parties`);
            showNotification(`System ready! Loaded ${stats.products} products, ${stats.purchaseParties} suppliers, ${stats.saleParties} customers`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize session:', error);
            showNotification('Failed to load from Google Sheets. Check your configuration and service account.', 'error');
            throw error;
        }
    }

    // Load fresh product data from Google Sheets
    async loadProductsFromSheets() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PRODUCT_SHEET_RANGE}`;
            const response = await this.makeAuthenticatedRequest(url);
            const data = await response.json();
            const rows = data.values;
            if (rows && rows.length > 0) {
                console.log('DEBUG first row:', rows[0]);
            }
            
            if (!rows || rows.length < 2) {
                console.warn('No product data found in Google Sheets');
                return;
            }
            
            // Clear existing products and reload fresh
            this.products = {};
            
            // Skip first 3 rows (empty, banner, headers), load all products
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const [product, grade, company, specificGrade] = row;
                if (product && product.trim()) {
                    this.products[product.trim()] = {
                        grade: grade?.trim() || '',
                        company: company?.trim() || '',
                        specificGrade: specificGrade?.trim() || '',
                        rowIndex: i + 4, // since we start from row 4
                        lastUpdated: Date.now()
                    };
                }
            }
            
            console.log(`📦 Loaded ${Object.keys(this.products).length} products from Google Sheets`);
            
            // Update UI if available
            if (typeof updateProductDropdown === 'function') {
                updateProductDropdown();
            }
            
        } catch (error) {
            console.error('Error loading products from Google Sheets:', error);
            throw error;
        }
    }

    // Load purchase parties from Google Sheets
    async loadPurchasePartiesFromSheets() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PURCHASE_PARTIES_RANGE}`;
            const response = await this.makeAuthenticatedRequest(url);
            const data = await response.json();
            const rows = data.values;
            
            if (!rows || rows.length < 1) {
                console.warn('No purchase parties data found in Google Sheets');
                return;
            }
            
            // Clear existing purchase parties and reload fresh
            this.purchaseParties = {};
            
            // Load all purchase parties (skip header row)
            for (let i = 1; i < rows.length; i++) {
                const [partyName] = rows[i];
                if (partyName && partyName.trim()) {
                    this.purchaseParties[partyName.trim()] = {};
                }
            }
            
            console.log(`🏭 Loaded ${Object.keys(this.purchaseParties).length} purchase parties from Google Sheets`);
            
            // Update UI if available
            if (typeof updatePurchasePartyDropdown === 'function') {
                updatePurchasePartyDropdown();
            }
            
        } catch (error) {
            console.error('Error loading purchase parties from Google Sheets:', error);
            throw error;
        }
    }

    // Load sale parties from Google Sheets
    async loadSalePartiesFromSheets() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.SALE_PARTIES_RANGE}`;
            const response = await this.makeAuthenticatedRequest(url);
            const data = await response.json();
            const rows = data.values;
            
            if (!rows || rows.length < 1) {
                console.warn('No sale parties data found in Google Sheets');
                return;
            }
            
            // Clear existing sale parties and reload fresh
            this.saleParties = {};
            
            // Load all sale parties (skip header row)
            for (let i = 1; i < rows.length; i++) {
                const [partyName] = rows[i];
                if (partyName && partyName.trim()) {
                    this.saleParties[partyName.trim()] = {};
                }
            }
            
            console.log(`👥 Loaded ${Object.keys(this.saleParties).length} sale parties from Google Sheets`);
            
            // Update UI if available
            if (typeof updateSalePartyDropdown === 'function') {
                updateSalePartyDropdown();
            }
            
        } catch (error) {
            console.error('Error loading sale parties from Google Sheets:', error);
            throw error;
        }
    }

    // Sync product to Google Sheets
    async syncProductToSheets(productData) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PRODUCT_SHEET_RANGE}:append?valueInputOption=RAW`;
            
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify({
                    values: [[
                        '', // empty for column A (Sr No)
                        productData.product,
                        productData.grade,
                        productData.company,
                        productData.specificGrade
                    ]]
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error syncing product to Google Sheets:', error);
            return false;
        }
    }

    // Sync purchase party to Google Sheets
    async syncPurchasePartyToSheets(partyData) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.PURCHASE_PARTIES_RANGE}:append?valueInputOption=RAW`;
            
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify({
                    values: [[
                        partyData.partyName,
                        partyData.contactPerson || '',
                        partyData.phone || '',
                        partyData.email || '',
                        partyData.address || ''
                    ]]
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error syncing purchase party to Google Sheets:', error);
            return false;
        }
    }

    // Sync sale party to Google Sheets
    async syncSalePartyToSheets(partyData) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.SALE_PARTIES_RANGE}:append?valueInputOption=RAW`;
            
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify({
                    values: [[
                        partyData.partyName,
                        partyData.contactPerson || '',
                        partyData.phone || '',
                        partyData.email || '',
                        partyData.address || ''
                    ]]
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error syncing sale party to Google Sheets:', error);
            return false;
        }
    }

    // Add new purchase party
    async addPurchaseParty(partyData) {
        try {
            // 1. Add to in-memory database immediately
            this.purchaseParties[partyData.partyName] = {
                contactPerson: partyData.contactPerson || '',
                phone: partyData.phone || '',
                email: partyData.email || '',
                address: partyData.address || '',
                source: `Added via App - ${formatDateToDDMMYYYY(new Date())}`,
                lastUpdated: Date.now()
            };
            
            // 2. Update UI immediately
            if (typeof updatePurchasePartyDropdown === 'function') {
                updatePurchasePartyDropdown();
            }
            
            // 3. Sync to Google Sheets
            const success = await this.syncPurchasePartyToSheets(partyData);
            
            if (success) {
                console.log(`✅ Purchase party ${partyData.partyName} added and synced to Google Sheets`);
                showNotification('Purchase party added successfully!', 'success');
            } else {
                this.queueUpdateForRetry('add-purchase-party', partyData);
                showNotification('Purchase party added locally. Will sync to Google Sheets when possible.', 'warning');
            }
            
        } catch (error) {
            console.error('Error adding purchase party:', error);
            showNotification('Error adding purchase party: ' + error.message, 'error');
        }
    }

    // Add new sale party
    async addSaleParty(partyData) {
        try {
            // 1. Add to in-memory database immediately
            this.saleParties[partyData.partyName] = {
                contactPerson: partyData.contactPerson || '',
                phone: partyData.phone || '',
                email: partyData.email || '',
                address: partyData.address || '',
                source: `Added via App - ${formatDateToDDMMYYYY(new Date())}`,
                lastUpdated: Date.now()
            };
            
            // 2. Update UI immediately
            if (typeof updateSalePartyDropdown === 'function') {
                updateSalePartyDropdown();
            }
            
            // 3. Sync to Google Sheets
            const success = await this.syncSalePartyToSheets(partyData);
            
            if (success) {
                console.log(`✅ Sale party ${partyData.partyName} added and synced to Google Sheets`);
                showNotification('Sale party added successfully!', 'success');
            } else {
                this.queueUpdateForRetry('add-sale-party', partyData);
                showNotification('Sale party added locally. Will sync to Google Sheets when possible.', 'warning');
            }
            
        } catch (error) {
            console.error('Error adding sale party:', error);
            showNotification('Error adding sale party: ' + error.message, 'error');
        }
    }

    async addProduct(productData) {
        // 1. Add to in-memory database immediately
        this.products[productData.product] = {
            grade: productData.grade || '',
            company: productData.company || '',
            specificGrade: productData.specificGrade || '',
            lastUpdated: Date.now()
        };

        // 2. Update UI immediately
        if (typeof updateProductDropdown === 'function') {
            updateProductDropdown();
        }

        // 3. Sync to Google Sheets
        const success = await this.syncProductToSheets(productData);

        if (success) {
            showNotification('Product added and synced to Google Sheets!', 'success');
        } else {
            showNotification('Product added locally. Will sync to Google Sheets when possible.', 'warning');
        }
    }

    // Queue update for retry
    queueUpdateForRetry(type, data) {
        this.pendingUpdates.push({
            type: type,
            data: data,
            timestamp: Date.now(),
            retries: 0
        });
    }

    // Get data methods
    getProduct(productCode) {
        return this.products[productCode] || null;
    }

    getPurchaseParty(partyName) {
        return this.purchaseParties[partyName] || null;
    }

    getSaleParty(partyName) {
        return this.saleParties[partyName] || null;
    }

    getAllProducts() {
        return { ...this.products };
    }

    getAllPurchaseParties() {
        return { ...this.purchaseParties };
    }

    getAllSaleParties() {
        return { ...this.saleParties };
    }

    // Get loading statistics
    getLoadStats() {
        return {
            products: Object.keys(this.products).length,
            purchaseParties: Object.keys(this.purchaseParties).length,
            saleParties: Object.keys(this.saleParties).length
        };
    }

    // Manual refresh from Google Sheets
    async refresh() {
        showNotification('Refreshing all data from Google Sheets...', 'info');
        await Promise.all([
            this.loadProductsFromSheets(),
            this.loadPurchasePartiesFromSheets(),
            this.loadSalePartiesFromSheets()
        ]);
        showNotification('All data refreshed successfully!', 'success');
    }

    // Setup real-time sync (polling every 1 minute)
    setupRealTimeSync() {
        // Clear any existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        // Poll every 1 minute (60000 ms)
        this.syncInterval = setInterval(() => {
            if (this.isInitialized) {
                console.log('🔄 Real-time sync: refreshing data from Google Sheets...');
                this.refresh();
            }
        }, 60000);
        console.log('⏰ Real-time sync enabled (1 minute interval)');
    }

    // Cleanup real-time sync
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('🛑 Real-time sync stopped');
        }
    }

    // Get enhanced session statistics
    getStats() {
        return {
            products: Object.keys(this.products).length,
            purchaseParties: Object.keys(this.purchaseParties).length,
            saleParties: Object.keys(this.saleParties).length,
            deals: this.deals.length,
            inventory: this.inventory.length,
            pendingUpdates: this.pendingUpdates.length,
            isInitialized: this.isInitialized,
            lastSyncTime: this.lastSyncTime
        };
    }

    // Load deals and inventory from localStorage
    loadLocalData() {
        try {
            const dealsData = localStorage.getItem('deals');
            const inventoryData = localStorage.getItem('inventory');
            this.deals = dealsData ? JSON.parse(dealsData) : [];
            this.inventory = inventoryData ? JSON.parse(inventoryData) : [];
            console.log(`📥 Loaded ${this.deals.length} deals and ${this.inventory.length} inventory items from local storage`);
        } catch (error) {
            console.error('Error loading local data:', error);
            this.deals = [];
            this.inventory = [];
        }
    }

    // [Include all other existing methods: loadLocalData, setupRealTimeSync, cleanup, etc.]
    // Keep all the existing methods from the previous version...
}

// Initialize session database
window.sessionDB = new SessionProductDatabase();