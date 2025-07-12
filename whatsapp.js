// WhatsApp Integration Functions

// Send WhatsApp messages
function sendWhatsAppMessages() {
    const accountsMessage = document.getElementById('whatsapp-content-1').textContent;
    const logisticsMessage = document.getElementById('whatsapp-content-2').textContent;
    
    if (!accountsMessage || !logisticsMessage) {
        showNotification('Please preview messages first!', 'warning');
        return;
    }
    
    // Send messages to both teams
    Promise.all([
        sendWhatsAppMessage(ENV_CONFIG.WHATSAPP_PHONE_ACCOUNTS, accountsMessage, 'accounts'),
        sendWhatsAppMessage(ENV_CONFIG.WHATSAPP_PHONE_LOGISTICS, logisticsMessage, 'logistics')
   ]).then(results => {
       const successCount = results.filter(r => r !== null).length;
       if (successCount === 2) {
           showNotification('WhatsApp messages sent successfully!', 'success');
       } else if (successCount === 1) {
           showNotification('One WhatsApp message sent, one failed. Check console for details.', 'warning');
       } else {
           showNotification('Failed to send WhatsApp messages. Check your configuration.', 'error');
       }
   }).catch(error => {
       console.error('Error sending WhatsApp messages:', error);
       showNotification('Error sending WhatsApp messages', 'error');
   });
}

// WhatsApp Business API integration function
async function sendWhatsAppMessage(phoneNumber, message, type) {
   try {
       // Check if WhatsApp API is configured
       if (!ENV_CONFIG.WHATSAPP_API_TOKEN || ENV_CONFIG.WHATSAPP_API_TOKEN.includes('your-')) {
           console.warn('WhatsApp API not configured. Simulating message send...');
           simulateWhatsAppSend(phoneNumber, message, type);
           return { success: true, simulated: true };
       }
       
       // Actual WhatsApp Business API call
       const response = await fetch(`${ENV_CONFIG.WHATSAPP_API_URL}/${ENV_CONFIG.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${ENV_CONFIG.WHATSAPP_API_TOKEN}`
           },
           body: JSON.stringify({
               messaging_product: 'whatsapp',
               to: phoneNumber,
               type: 'text',
               text: {
                   body: message
               }
           })
       });
       
       if (!response.ok) {
           const errorData = await response.json();
           throw new Error(`WhatsApp API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
       }
       
       const result = await response.json();
       console.log(`✅ ${type} WhatsApp message sent successfully:`, result);
       return result;
       
   } catch (error) {
       console.error(`❌ Error sending ${type} WhatsApp message:`, error);
       
       // Fallback: Log the message that would have been sent
       console.log(`📱 ${type.toUpperCase()} MESSAGE (${phoneNumber}):`);
       console.log(message);
       console.log('---');
       
       return null;
   }
}

// Simulate WhatsApp message sending for testing
function simulateWhatsAppSend(phoneNumber, message, type) {
   console.log(`🔄 SIMULATING ${type.toUpperCase()} WHATSAPP MESSAGE`);
   console.log(`📱 To: ${phoneNumber}`);
   console.log(`💬 Message:`);
   console.log(message);
   console.log('---');
   
   // Show in console as if it were sent
   setTimeout(() => {
       console.log(`✅ Simulated ${type} message "sent" successfully`);
   }, 1000);
}

// Validate WhatsApp configuration
function validateWhatsAppConfig() {
   const requiredFields = [
       'WHATSAPP_PHONE_ACCOUNTS',
       'WHATSAPP_PHONE_LOGISTICS'
   ];
   
   const optionalFields = [
       'WHATSAPP_API_TOKEN',
       'WHATSAPP_PHONE_NUMBER_ID'
   ];
   
   let isValid = true;
   
   // Check required fields
   for (const field of requiredFields) {
       if (!ENV_CONFIG[field] || ENV_CONFIG[field].includes('your-') || ENV_CONFIG[field].includes('xxx')) {
           console.warn(`⚠️  WhatsApp ${field} not configured`);
           isValid = false;
       }
   }
   
   // Check optional fields (for API integration)
   let apiConfigured = true;
   for (const field of optionalFields) {
       if (!ENV_CONFIG[field] || ENV_CONFIG[field].includes('your-')) {
           apiConfigured = false;
       }
   }
   
   if (!apiConfigured) {
       console.warn('⚠️  WhatsApp Business API not fully configured. Messages will be simulated.');
   }
   
   return { isValid, apiConfigured };
}

// Format phone number for WhatsApp API
function formatPhoneNumber(phoneNumber) {
   // Remove any non-digit characters except +
   let formatted = phoneNumber.replace(/[^\d+]/g, '');
   
   // Ensure it starts with +
   if (!formatted.startsWith('+')) {
       formatted = '+' + formatted;
   }
   
   return formatted;
}

// Format date for WhatsApp messages
function formatDateForWhatsApp(dateString) {
   const date = new Date(dateString);
   return date.toLocaleDateString('en-IN', {
       day: '2-digit',
       month: '2-digit',
       year: 'numeric'
   });
}

// Create WhatsApp message templates
const WhatsAppTemplates = {
   // Message 1: To Accounts Team (919702507574)
   accounts: (data) => {
       const formattedDate = formatDateForWhatsApp(data.date);
       
       return `Date: ${formattedDate}

Sold to **${data.saleParty}**
Quantity: ${data.quantitySold} kg
Rate: ${data.saleRate} ${data.deliveryTerms}
Comments: ${data.saleComments || 'None'}

${data.product}  ${data.company} ${data.specificGrade}

Purchase from **${data.purchaseParty || 'TBD'}**
Quantity: ${data.purchaseQuantity || data.quantitySold} kg
Rate: ${data.purchaseRate || 'TBD'}
Comments: ${data.finalComments || 'None'}`;
   },

   // Message 2: To Logistics Team (917977656248)
   logistics: (data) => {
       return `Sold to **${data.saleParty}**
${data.product}  ${data.company} ${data.specificGrade}
${data.purchaseQuantity || data.quantitySold} kg
Purchase from **${data.purchaseParty || 'TBD'}**
Warehouse: ${data.warehouseInput || 'TBD'}`;
   },

   notification: (message) => `📢 *SYSTEM NOTIFICATION* 📢

${message}

Sent from Polymer Trading System
${new Date().toLocaleString()}`,

   inventory: (data) => `📦 *INVENTORY UPDATE* 📦

Product: ${data.product}
Current Stock: ${data.quantity} kgs
Rate: ₹${data.rate}/kg
Total Value: ₹${(data.quantity * data.rate).toLocaleString()}

${data.action === 'low' ? '⚠️ Low stock alert!' : '✅ Stock updated'}

#InventoryAlert`
};

// Send notification message
async function sendNotificationMessage(message, recipient = 'accounts') {
   const phoneNumber = recipient === 'accounts' ? ENV_CONFIG.WHATSAPP_PHONE_ACCOUNTS : ENV_CONFIG.WHATSAPP_PHONE_LOGISTICS;
   const formattedMessage = WhatsAppTemplates.notification(message);
   
   return await sendWhatsAppMessage(phoneNumber, formattedMessage, 'notification');
}

// Send inventory alert
async function sendInventoryAlert(inventoryData) {
   const message = WhatsAppTemplates.inventory(inventoryData);
   
   // Send to both accounts and logistics teams
   return Promise.all([
       sendWhatsAppMessage(ENV_CONFIG.WHATSAPP_PHONE_ACCOUNTS, message, 'inventory-alert'),
       sendWhatsAppMessage(ENV_CONFIG.WHATSAPP_PHONE_LOGISTICS, message, 'inventory-alert')
   ]);
}

// Check for low inventory and send alerts
function checkInventoryAlerts() {
   const lowStockThreshold = 100; // kgs
   
   inventory.forEach(item => {
       if (item.quantity <= lowStockThreshold) {
           sendInventoryAlert({
               ...item,
               action: 'low'
           });
       }
   });
}

// Initialize WhatsApp integration
function initializeWhatsApp() {
   const validation = validateWhatsAppConfig();
   
   if (validation.isValid) {
       console.log('📱 WhatsApp integration initialized');
       console.log(`📞 Accounts team: ${ENV_CONFIG.WHATSAPP_PHONE_ACCOUNTS}`);
       console.log(`📞 Logistics team: ${ENV_CONFIG.WHATSAPP_PHONE_LOGISTICS}`);
       
       if (validation.apiConfigured) {
           console.log('✅ WhatsApp Business API configured');
       } else {
           console.log('⚠️  WhatsApp Business API not configured - using simulation mode');
       }
   } else {
       console.warn('❌ WhatsApp configuration incomplete');
   }
   
   return validation;
}
