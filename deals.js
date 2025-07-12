// Deal Management Functions

// Add deal to Google Sheets Main tab
async function addDealToSheets(dealData) {
    try {
        // Get current date for Sr.No generation
        const currentDate = new Date();
        
        // Generate Sr.No
        const srNo = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}_${Date.now().toString().slice(-4)}`;
        
        // Map the deal data to match your Google Sheets columns
        const dealRow = [
            srNo,                                    // Sr.No (A)
            dealData.date,                          // Date (B)
            dealData.date,                          // Date (C) - duplicate as per your sheet
            dealData.quantitySold,                  // Quantity Sold (kgs) (D)
            dealData.saleRate,                      // Rate (E)
            dealData.product,                       // Product (F)
            dealData.grade,                         // Grade (G)
            dealData.company,                       // Company (H)
            dealData.specificGrade,                 // Specific Grade (I)
            dealData.purchaseParty || '',           // Purchase Party (J)
            dealData.purchaseQuantity || 0,         // Purchase Quantity (kgs) (K)
            dealData.purchaseRate || 0              // Rate (L)
        ];

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${ENV_CONFIG.GOOGLE_SHEETS_ID}/values/${ENV_CONFIG.DEALS_SHEET_NAME}!A:L:append?valueInputOption=RAW&key=${ENV_CONFIG.GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [dealRow]
                })
            }
        );
        
        if (response.ok) {
            console.log('✅ Deal logged to Google Sheets successfully');
            showNotification('Deal logged to Google Sheets successfully!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            console.error('Google Sheets API Error:', errorData);
            throw new Error(`Failed to log deal: ${errorData.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error logging deal to Google Sheets:', error);
        showNotification(`Error logging deal to Google Sheets: ${error.message}`, 'error');
        return false;
    }
}

// Preview WhatsApp messages
function previewWhatsAppMessages() {
    const formData = new FormData(document.getElementById('dealForm'));
    const data = Object.fromEntries(formData);
    
    // Validate required fields
    if (!data.product || !data.quantitySold || !data.saleRate || !data.saleParty) {
        showNotification('Please fill in product, sale party, quantity, and rate first!', 'warning');
        return;
    }
    
    // Create data object for message templates
    const messageData = {
        date: data.date,
        saleParty: data.saleParty,
        quantitySold: data.quantitySold,
        saleRate: data.saleRate,
        deliveryTerms: data.deliveryTerms,
        saleComments: data.saleComments,
        product: data.product,
        grade: data.grade,
        company: data.company,
        specificGrade: data.specificGrade,
        purchaseParty: data.purchaseParty,
        purchaseQuantity: data.purchaseQuantity,
        purchaseRate: data.purchaseRate,
        finalComments: data.finalComments,
        warehouseInput: data.warehouseInput
    };
    
    // Generate messages using templates
    const accountsMessage = WhatsAppTemplates.accounts(messageData);
    const logisticsMessage = WhatsAppTemplates.logistics(messageData);
    
    document.getElementById('whatsapp-content-1').textContent = accountsMessage;
    document.getElementById('whatsapp-content-2').textContent = logisticsMessage;
    document.getElementById('whatsapp-preview-section').style.display = 'block';
}

// Handle deal form submission
function initializeDealForm() {
    const dealForm = document.getElementById('dealForm');
    if (!dealForm) return;
    
    dealForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Validate required fields
        if (!data.saleParty) {
            showNotification('Sale Party is required!', 'error');
            return;
        }
        
        if (!data.deliveryTerms) {
            showNotification('Delivery Terms is required!', 'error');
            return;
        }
        
        // Calculate profit
        const saleValue = parseFloat(data.quantitySold) * parseFloat(data.saleRate);
        const purchaseValue = parseFloat(data.purchaseQuantity || data.quantitySold) * parseFloat(data.purchaseRate || 0);
        const profit = saleValue - purchaseValue;
        
        // Create deal object with all necessary data
        const deal = {
            id: Date.now(),
            date: data.date,
            saleParty: data.saleParty,
            product: data.product,
            grade: data.grade,
            company: data.company,
            specificGrade: data.specificGrade,
            quantitySold: parseFloat(data.quantitySold),
            saleRate: parseFloat(data.saleRate),
            deliveryTerms: data.deliveryTerms,
            saleComments: data.saleComments,
            saleSource: data.saleSource,
            purchaseParty: data.purchaseParty,
            purchaseQuantity: parseFloat(data.purchaseQuantity || data.quantitySold),
            purchaseRate: parseFloat(data.purchaseRate || 0),
            purchaseComments: data.purchaseComments,
            finalComments: data.finalComments,
            warehouseInput: data.warehouseInput,
            profit: profit,
            saleValue: saleValue,
            purchaseValue: purchaseValue
        };
        
        // Handle inventory if selling from inventory
        if (data.saleSource === 'inventory' && window.selectedInventoryItem !== undefined) {
            const inventoryItem = inventory[window.selectedInventoryItem];
            if (inventoryItem.quantity >= parseFloat(data.quantitySold)) {
                inventoryItem.quantity -= parseFloat(data.quantitySold);
                if (inventoryItem.quantity === 0) {
                    inventory.splice(window.selectedInventoryItem, 1);
                }
                deal.purchaseParty = inventoryItem.purchaseParty;
                deal.purchaseRate = inventoryItem.rate;
                deal.purchaseQuantity = parseFloat(data.quantitySold);
                deal.purchaseValue = parseFloat(data.quantitySold) * inventoryItem.rate;
                deal.profit = deal.saleValue - deal.purchaseValue;
            } else {
                showNotification('Insufficient inventory quantity!', 'error');
                return;
            }
        } else if (data.saleSource === 'new' && parseFloat(data.purchaseQuantity) > parseFloat(data.quantitySold)) {
            // Add excess to inventory
            const excessQuantity = parseFloat(data.purchaseQuantity) - parseFloat(data.quantitySold);
            const inventoryItem = {
                id: Date.now(),
                product: data.product,
                grade: data.grade,
                company: data.company,
                specificGrade: data.specificGrade,
                quantity: excessQuantity,
                rate: parseFloat(data.purchaseRate),
                purchaseParty: data.purchaseParty,
                dateAdded: data.date
            };
            inventory.push(inventoryItem);
        }
        
        // Save deal locally
        deals.push(deal);
        localStorage.setItem('deals', JSON.stringify(deals));
        localStorage.setItem('inventory', JSON.stringify(inventory));
        
        // Update session database deals
        sessionDB.deals = deals;
        sessionDB.inventory = inventory;
        
        // Add deal to Google Sheets Main tab
        addDealToSheets(deal).then((success) => {
            if (success) {
                console.log('Deal successfully logged to Google Sheets');
            } else {
                console.warn('Failed to log deal to Google Sheets, but deal saved locally');
            }
        });
        
        // Update displays
        updateDealsHistory();
        updateInventoryDisplay();
        
        // Reset form
        resetDealForm();
        
        showNotification('Deal registered successfully!', 'success');
    });
}

// Reset deal form
function resetDealForm() {
    const form = document.getElementById('dealForm');
    if (!form) return;
    
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Hide WhatsApp preview
    const whatsappSection = document.getElementById('whatsapp-preview-section');
    if (whatsappSection) {
        whatsappSection.style.display = 'none';
    }
    
    // Reset radio groups
    document.querySelectorAll('.radio-group').forEach(group => group.classList.remove('selected'));
    
    // Hide inventory selection
    const inventorySelection = document.getElementById('inventory-selection');
    if (inventorySelection) {
        inventorySelection.classList.remove('show');
    }
    
    // Show purchase details
    const purchaseDetails = document.getElementById('purchase-details');
    if (purchaseDetails) {
        purchaseDetails.style.display = 'grid';
    }
    
    // Clear selected inventory
    window.selectedInventoryItem = undefined;
    
    // Reset auto-filled fields
    ['grade', 'company', 'specificGrade'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.readOnly = false;
            field.style.backgroundColor = '#fafafa';
            field.style.cursor = 'text';
        }
    });
}

// Load deals from local storage
function loadDealsFromStorage() {
    try {
        const storedDeals = localStorage.getItem('deals');
        const storedInventory = localStorage.getItem('inventory');
        
        deals = storedDeals ? JSON.parse(storedDeals) : [];
        inventory = storedInventory ? JSON.parse(storedInventory) : [];
        
        console.log(`📊 Loaded ${deals.length} deals and ${inventory.length} inventory items from local storage`);
    } catch (error) {
        console.warn('Failed to load deals from storage:', error);
        deals = [];
        inventory = [];
    }
}
