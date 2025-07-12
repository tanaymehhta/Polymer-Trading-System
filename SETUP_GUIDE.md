# 🔄 Polymer Trading System - Setup Guide

## 📋 **Quick Setup Checklist**

### ✅ **Already Ready:**
- ✅ Service account authentication (`biz-manager-464709-6a7c412df35b.json`)
- ✅ All JavaScript files configured
- ✅ WhatsApp simulation mode ready
- ✅ UI and styling complete

### 🔧 **Required Configuration:**

## **Step 1: Create Google Sheets Document**

1. **Create a new Google Sheets document**
2. **Copy the Sheet ID from the URL:**
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
3. **Update `config.js` line 5:**
   ```javascript
   GOOGLE_SHEETS_ID: 'YOUR_ACTUAL_SHEET_ID_HERE', // Replace with your actual ID
   ```

## **Step 2: Set Up Google Sheets Structure**

Create these 4 sheets with exact names and headers:

### **Sheet 1: "Table1_2" (Product Database)**
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Product Code | Grade | Company | Specific Grade | Source |

**Sample Data:**
```
PP, Homopolymer, Reliance, H110MA, Original
PE, HDPE, Indian Oil, HI-50, Original
PVC, Rigid, Chemplast, RP-110, Original
```

### **Sheet 2: "PurchaseParties" (Suppliers)**
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Party Name | Contact Person | Phone | Email | Address | Source |

**Sample Data:**
```
ABC Suppliers, John Doe, +919876543210, john@abc.com, Mumbai, Original
XYZ Traders, Jane Smith, +919876543211, jane@xyz.com, Delhi, Original
```

### **Sheet 3: "SaleParties" (Customers)**
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Party Name | Contact Person | Phone | Email | Address | Source |

**Sample Data:**
```
Customer A, Contact A, +919876543212, contact@customer.com, Bangalore, Original
Customer B, Contact B, +919876543213, contact@customerb.com, Chennai, Original
```

### **Sheet 4: "Main" (Deals Log)**
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sr.No | Date | Date | Qty Sold | Rate | Product | Grade | Company | Specific Grade | Purchase Party | Purchase Qty | Rate |

**Leave this empty - deals will be added automatically**

## **Step 3: Share Google Sheets**

1. **Click "Share" in Google Sheets**
2. **Add this email with "Editor" access:**
   ```
   business-manager@biz-manager-464709.iam.gserviceaccount.com
   ```

## **Step 4: Update Phone Numbers (Optional)**

In `config.js`, update these lines with your actual WhatsApp numbers:

```javascript
WHATSAPP_PHONE_ACCOUNTS: '919702507574', // Your accounts team number
WHATSAPP_PHONE_LOGISTICS: '917977656248', // Your logistics team number
```

**Format:** Country code + number (e.g., '919702507574' for India)

## **Step 5: Test the System**

1. **Open `index.html` in a web browser**
2. **Check browser console for any errors**
3. **Try registering a test deal**

## **🚀 System Features**

### **✅ Ready to Use:**
- **Deal Registration**: Complete form with auto-fill
- **Inventory Management**: Track stock levels
- **Deal History**: View all transactions
- **WhatsApp Integration**: Simulation mode (messages in console)
- **Google Sheets Sync**: Automatic data sync

### **🔧 Optional Setup:**
- **WhatsApp Business API**: For actual message sending
- **Custom Phone Numbers**: Update with your team numbers

## **📊 Expected Behavior**

### **On Startup:**
- ✅ Loads fresh data from Google Sheets
- ✅ Populates product dropdowns
- ✅ Shows system status
- ✅ Ready for deal registration

### **When Registering Deals:**
- ✅ Auto-fills product information
- ✅ Calculates profit/loss
- ✅ Updates inventory
- ✅ Logs to Google Sheets
- ✅ Shows WhatsApp message preview

### **WhatsApp Messages:**
- 📱 **Accounts Team**: Detailed deal information
- 📱 **Logistics Team**: Simplified warehouse info
- 🔄 **Simulation Mode**: Messages shown in console

## **⚠️ Troubleshooting**

### **If system doesn't load:**
1. Check browser console for errors
2. Verify Google Sheets ID is correct
3. Ensure sheets are shared with service account
4. Check sheet names match exactly

### **If deals don't save:**
1. Check Google Sheets permissions
2. Verify sheet structure matches requirements
3. Check browser console for API errors

### **If WhatsApp doesn't work:**
- Messages will show in browser console (simulation mode)
- For actual sending, configure WhatsApp Business API tokens

## **🎯 Next Steps**

1. **Set up your Google Sheets** with the required structure
2. **Update the Google Sheets ID** in `config.js`
3. **Test with sample data**
4. **Customize phone numbers** if needed
5. **Start using the system!**

---

**Need Help?** Check the browser console for detailed error messages and setup instructions. 