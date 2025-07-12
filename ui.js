// UI Management Functions

// Global variables
let deals = [];
let inventory = [];

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Auto-fill product information based on selection
function updateProductSelection() {
    const productSelect = document.getElementById('product');
    const gradeInput = document.getElementById('grade');
    const companyInput = document.getElementById('company');
    const specificGradeInput = document.getElementById('specificGrade');
    
    const selectedProduct = productSelect.value;
    
    if (selectedProduct && sessionDB.getProduct(selectedProduct)) {
        const productData = sessionDB.getProduct(selectedProduct);
        
        // Auto-fill and make read-only
        gradeInput.value = productData.grade;
        gradeInput.readOnly = true;
        gradeInput.style.backgroundColor = '#f0f9ff';
        gradeInput.style.cursor = 'not-allowed';
        
        companyInput.value = productData.company;
        companyInput.readOnly = true;
        companyInput.style.backgroundColor = '#f0f9ff';
        companyInput.style.cursor = 'not-allowed';
        
        specificGradeInput.value = productData.specificGrade;
        specificGradeInput.readOnly = true;
        specificGradeInput.style.backgroundColor = '#f0f9ff';
        specificGradeInput.style.cursor = 'not-allowed';
    } else {
        // Clear and make editable if no product selected
        gradeInput.value = '';
        gradeInput.readOnly = false;
        gradeInput.style.backgroundColor = '#fafafa';
        gradeInput.style.cursor = 'text';
        
        companyInput.value = '';
        companyInput.readOnly = false;
        companyInput.style.backgroundColor = '#fafafa';
        companyInput.style.cursor = 'text';
        
        specificGradeInput.value = '';
        specificGradeInput.readOnly = false;
        specificGradeInput.style.backgroundColor = '#fafafa';
        specificGradeInput.style.cursor = 'text';
    }
}

// Update product dropdown with loaded data
function updateProductDropdown() {
    const productSelect = document.getElementById('product');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">Select Product Code</option>';
    
    const products = sessionDB.getAllProducts();
    Object.keys(products).sort().forEach(productCode => {
        const option = document.createElement('option');
        option.value = productCode;
        option.textContent = productCode;
        productSelect.appendChild(option);
    });
}

// Sale source selection
function selectSaleSource(source) {
    const radioGroups = document.querySelectorAll('.radio-group');
    radioGroups.forEach(group => group.classList.remove('selected'));
    
    const selectedGroup = event.currentTarget;
    selectedGroup.classList.add('selected');
    
    const radioInput = selectedGroup.querySelector('input[type="radio"]');
    radioInput.checked = true;
    
    const inventorySelection = document.getElementById('inventory-selection');
    const purchaseDetails = document.getElementById('purchase-details');
    
    if (source === 'inventory') {
        inventorySelection.classList.add('show');
        purchaseDetails.style.display = 'none';
        updateInventoryList();
    } else {
        inventorySelection.classList.remove('show');
        purchaseDetails.style.display = 'grid';
    }
}

// Update inventory list for selection
function updateInventoryList() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.onclick = () => selectInventoryItem(index);
        div.innerHTML = `
            <strong>${item.product} - ${item.grade}</strong><br>
            <small>${item.company} - ${item.specificGrade}</small><br>
            <small>Available: ${item.quantity} kgs @ ₹${item.rate}/kg</small>
        `;
        inventoryList.appendChild(div);
    });
}

// Select inventory item
function selectInventoryItem(index) {
    const inventoryItems = document.querySelectorAll('.inventory-item');
    inventoryItems.forEach(item => item.classList.remove('selected'));
    
    if (inventoryItems[index]) {
        inventoryItems[index].classList.add('selected');
        window.selectedInventoryItem = index;
    }
}

// Update deals history display
function updateDealsHistory() {
    const tbody = document.getElementById('deals-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    deals.slice().reverse().forEach(deal => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${deal.date}</td>
            <td>${deal.saleParty || 'N/A'}</td>
            <td>${deal.product}</td>
            <td>${deal.grade}</td>
            <td>${deal.company}</td>
            <td>${deal.quantitySold} kgs</td>
            <td>₹${deal.saleRate}/kg</td>
            <td>${deal.saleSource === 'inventory' ? '📦 Inventory' : '🆕 New'}</td>
            <td>${deal.purchaseParty || 'N/A'}</td>
            <td>₹${deal.purchaseRate || 0}/kg</td>
            <td style="color: ${deal.profit >= 0 ? 'green' : 'red'}">₹${deal.profit.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update inventory display
function updateInventoryDisplay() {
    const inventoryGrid = document.getElementById('inventory-grid');
    if (!inventoryGrid) return;
    
    inventoryGrid.innerHTML = '';
    
    inventory.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <h4>${item.product} - ${item.grade}</h4>
            <p><strong>Company:</strong> ${item.company}</p>
            <p><strong>Grade:</strong> ${item.specificGrade}</p>
            <p><strong>Quantity:</strong> ${item.quantity} kgs</p>
            <p><strong>Rate:</strong> ₹${item.rate}/kg</p>
            <p><strong>Total Value:</strong> ₹${(item.quantity * item.rate).toLocaleString()}</p>
            <p><strong>Supplier:</strong> ${item.purchaseParty}</p>
            <p><strong>Date Added:</strong> ${item.dateAdded}</p>
            <button onclick="removeInventoryItem(${index})" 
                style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                Remove
            </button>
        `;
        inventoryGrid.appendChild(card);
    });
}

// Remove inventory item
function removeInventoryItem(index) {
    if (confirm('Are you sure you want to remove this inventory item?')) {
        inventory.splice(index, 1);
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryDisplay();
        showNotification('Inventory item removed successfully!', 'success');
    }
}

// Update products database display
function updateProductsDatabase() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    const products = sessionDB.getAllProducts();
    Object.keys(products).forEach(productCode => {
        const product = products[productCode];
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <h4>${productCode}</h4>
            <p><strong>Grade:</strong> ${product.grade}</p>
            <p><strong>Company:</strong> ${product.company}</p>
            <p><strong>Specific Grade:</strong> ${product.specificGrade}</p>
            <p><strong>Source:</strong> ${product.source || 'Original'}</p>
            <p style="font-size: 0.8em; color: #666;">
                <strong>Last Updated:</strong> 
                ${product.lastUpdated ? new Date(product.lastUpdated).toLocaleString() : 'Unknown'}
            </p>
        `;
        productsGrid.appendChild(card);
    });
}

// Show add inventory form
function showAddInventoryForm() {
    const form = prompt(`Add Inventory Item (format: Product,Grade,Company,SpecificGrade,Quantity,Rate,Supplier)
Example: PP,Homopolymer,Reliance,H110MA,1000,85,ABC Suppliers`);
    
    if (form) {
        const [product, grade, company, specificGrade, quantity, rate, supplier] = form.split(',');
        
        if (product && grade && company && specificGrade && quantity && rate && supplier) {
            const inventoryItem = {
                id: Date.now(),
                product: product.trim(),
                grade: grade.trim(),
                company: company.trim(),
                specificGrade: specificGrade.trim(),
                quantity: parseFloat(quantity.trim()),
                rate: parseFloat(rate.trim()),
                purchaseParty: supplier.trim(),
                dateAdded: new Date().toISOString().split('T')[0]
            };
            
            inventory.push(inventoryItem);
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryDisplay();
            showNotification('Inventory item added successfully!', 'success');
        } else {
            showNotification('Invalid format! Please use the correct format.', 'error');
        }
    }
}

// Show add product form
function showAddProductForm() {
    const productCode = prompt(`Add New Product (format: ProductCode,Grade,Company,SpecificGrade)
Example: GRPLON30GF,30% Glass Filled Nylon,GRP,Nylon`);
    
    if (productCode) {
        const [product, grade, company, specificGrade] = productCode.split(',');
        
        if (product && grade && company && specificGrade) {
            const newProduct = {
                product: product.trim(),
                grade: grade.trim(),
                company: company.trim(),
                specificGrade: specificGrade.trim()
            };
            
            // Add via session database (handles sync automatically)
            sessionDB.addProduct(newProduct);
            
        } else {
            showNotification('Invalid format! Please use: ProductCode,Grade,Company,SpecificGrade', 'error');
        }
    }
}

// Show system statistics
function showSystemStats() {
    const stats = sessionDB.getStats();
    const lastSync = stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never';
    
    const statsMessage = `🖥️ SYSTEM STATISTICS 🖥️

📦 Products in Database: ${stats.products}
📊 Total Deals: ${stats.deals}
📋 Inventory Items: ${stats.inventory}
⏳ Pending Updates: ${stats.pendingUpdates}

🔄 Last Sync: ${lastSync}
🟢 System Status: ${stats.isInitialized ? 'Active' : 'Initializing'}

📈 Memory Usage: ${Object.keys(sessionDB.products).length} products loaded
🔗 Google Sheets: Connected
💾 Local Storage: Active`;

    alert(statsMessage);
}

// Add system status indicator
function addSystemStatusIndicator() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'system-status';
    
    updateSystemStatus();
    header.appendChild(statusDiv);
    
    // Update status every 30 seconds
    setInterval(updateSystemStatus, 30000);
}

// Update system status display
function updateSystemStatus() {
    const statusDiv = document.getElementById('system-status');
    if (!statusDiv) return;
    
    const stats = sessionDB.getStats();
    const lastSync = stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Never';
    
    statusDiv.innerHTML = `
        <div>
            <span>🟢 System Active</span> | 
            <span>📦 ${stats.products} Products</span> | 
            <span>📊 ${stats.deals} Deals</span> | 
            <span>📋 ${stats.inventory} Inventory Items</span>
        </div>
        <div>
            <span>🔄 Last Sync: ${lastSync}</span>
            ${stats.pendingUpdates > 0 ? `| <span style="color: #fbbf24;">⏳ ${stats.pendingUpdates} Pending</span>` : ''}
        </div>
    `;
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
