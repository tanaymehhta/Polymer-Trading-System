// config.js - Service Account Configuration
// Loads sensitive config from secrets.config.js (window.SECRETS)

const ENV_CONFIG = {
    // ===== GOOGLE SHEETS CONFIGURATION =====
    GOOGLE_SHEETS_ID: window.SECRETS.GOOGLE_SHEETS_ID,
    SERVICE_ACCOUNT_FILE: 'biz-manager-464709-6a7c412df35b.json',
    PRODUCT_SHEET_RANGE: 'Product Database!B4:E',
    PURCHASE_PARTIES_RANGE: 'Purchase Parties!A:A',
    SALE_PARTIES_RANGE: 'Sale Parties!A:A',
    DEALS_SHEET_RANGE: 'Main!A:L',
    DEALS_SHEET_NAME: 'Main',

    // ===== WHATSAPP BUSINESS API CONFIGURATION =====
    WHATSAPP_API_TOKEN: window.SECRETS.WHATSAPP_API_TOKEN,
    WHATSAPP_API_URL: window.SECRETS.WHATSAPP_API_URL,
    WHATSAPP_PHONE_NUMBER_ID: window.SECRETS.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_PHONE_ACCOUNTS: window.SECRETS.WHATSAPP_PHONE_ACCOUNTS,
    WHATSAPP_PHONE_LOGISTICS: window.SECRETS.WHATSAPP_PHONE_LOGISTICS,
    WHATSAPP_PHONE_BOSS1: window.SECRETS.WHATSAPP_PHONE_BOSS1,
    WHATSAPP_PHONE_BOSSOG: window.SECRETS.WHATSAPP_PHONE_BOSSOG,

    // ===== APPLICATION SETTINGS =====
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes - sync with Google Sheets
    SERVER_MODE: true,
    DEBUG_MODE: true // Set to false in production
};

// Google Sheets Authentication using Service Account
class GoogleSheetsAuth {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.serviceAccount = null;
    }

    // Load service account from JSON file
    async loadServiceAccount() {
        if (this.serviceAccount) return this.serviceAccount;
        
        try {
            const response = await fetch(ENV_CONFIG.SERVICE_ACCOUNT_FILE);
            if (!response.ok) {
                throw new Error(`Failed to load service account file: ${response.status}`);
            }
            
            this.serviceAccount = await response.json();
            console.log('✅ Service account loaded successfully');
            return this.serviceAccount;
            
        } catch (error) {
            console.error('❌ Failed to load service account:', error);
            throw error;
        }
    }

    // Get access token using service account
    async getAccessToken() {
        // Check if current token is still valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Load service account if not already loaded
            await this.loadServiceAccount();
            
            // Create JWT for service account authentication
            const jwt = await this.createJWT();
            
            // Exchange JWT for access token
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Auth failed: ${response.status} - ${errorData.error_description || response.statusText}`);
            }

            const data = await response.json();
            
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
            
            console.log('✅ Google Sheets authentication successful');
            return this.accessToken;
            
        } catch (error) {
            console.error('❌ Google Sheets authentication failed:', error);
            throw error;
        }
    }

    // Create JWT for service account (simplified version for browser)
    async createJWT() {
        const header = {
            "alg": "RS256",
            "typ": "JWT"
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            "iss": this.serviceAccount.client_email,
            "scope": "https://www.googleapis.com/auth/spreadsheets",
            "aud": "https://oauth2.googleapis.com/token",
            "exp": now + 3600, // 1 hour
            "iat": now
        };

        // For browser compatibility, we'll use a simplified approach
        // In production, you'd want to use a proper JWT library
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        
        const signatureInput = `${encodedHeader}.${encodedPayload}`;
        
        // Use Web Crypto API to sign
        const signature = await this.signWithPrivateKey(signatureInput);
        
        return `${signatureInput}.${signature}`;
    }

    // Base64 URL encode
    base64UrlEncode(str) {
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Sign with private key using Web Crypto API
    async signWithPrivateKey(data) {
        try {
            // Import the private key
            const key = await window.crypto.subtle.importKey(
                'pkcs8',
                this.pemToArrayBuffer(this.serviceAccount.private_key),
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: 'SHA-256',
                },
                false,
                ['sign']
            );

            // Sign the data
            const signature = await window.crypto.subtle.sign(
                'RSASSA-PKCS1-v1_5',
                key,
                new TextEncoder().encode(data)
            );

            // Convert to base64url
            return this.arrayBufferToBase64Url(signature);
            
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error('Failed to sign JWT - check your private key format');
        }
    }

    // Convert PEM to ArrayBuffer
    pemToArrayBuffer(pem) {
        const b64Lines = pem
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\s/g, '');
        
        const binaryString = atob(b64Lines);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    // Convert ArrayBuffer to Base64URL
    arrayBufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}

// Initialize auth helper
window.googleAuth = new GoogleSheetsAuth();
window.ENV_CONFIG = ENV_CONFIG;

// Validation function with detailed guidance
function validateConfig() {
    const required = ['GOOGLE_SHEETS_ID', 'SERVICE_ACCOUNT_FILE'];
    let isValid = true;
    
    for (const key of required) {
        if (!ENV_CONFIG[key] || ENV_CONFIG[key].includes('YOUR_ACTUAL_') || ENV_CONFIG[key].includes('your-')) {
            console.warn(`⚠️  Please configure ${key} in config.js`);
            isValid = false;
        }
    }
    
    // Check Google Sheets ID specifically
    if (ENV_CONFIG.GOOGLE_SHEETS_ID === 'YOUR_ACTUAL_GOOGLE_SHEET_ID_HERE') {
        console.error('❌ CRITICAL: Please set your Google Sheets ID in config.js');
        console.log('📋 Setup Instructions:');
        console.log('1. Create a Google Sheets document');
        console.log('2. Copy the ID from the URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit');
        console.log('3. Replace "YOUR_ACTUAL_GOOGLE_SHEET_ID_HERE" with your actual sheet ID');
        console.log('4. Share the sheet with: business-manager@biz-manager-464709.iam.gserviceaccount.com');
        isValid = false;
    }
    
    if (isValid) {
        console.log('✅ Configuration validated successfully');
    }
    
    return isValid;
}

window.validateConfig = validateConfig;