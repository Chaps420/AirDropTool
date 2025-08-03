// Wallet-specific utilities and functions
class WalletUtils {
    // XRPL address validation
    static isValidXRPLAddress(address) {
        // Basic XRPL address validation
        const xrplRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/;
        return xrplRegex.test(address);
    }
    
    // Format XRPL address for display
    static formatAddress(address, maxLength = 20) {
        if (!address) return '';
        if (address.length <= maxLength) return address;
        
        const start = address.substring(0, 8);
        const end = address.substring(address.length - 8);
        return `${start}...${end}`;
    }
    
    // Format token amount for display
    static formatTokenAmount(amount, decimals = 6) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0';
        
        return num.toFixed(decimals);
    }
    
    // Validate seed/secret format
    static isValidSeed(seed) {
        if (!seed || typeof seed !== 'string') return false;
        
        // Remove whitespace
        seed = seed.trim();
        
        // Check for family seed format (starts with 's')
        if (seed.match(/^s[1-9A-HJ-NP-Za-km-z]{24,30}$/)) {
            return true;
        }
        
        // Check for hex format (64 characters)
        if (seed.match(/^[0-9A-Fa-f]{64}$/)) {
            return true;
        }
        
        // Check for mnemonic phrase (12 or 24 words)
        const words = seed.split(/\s+/);
        if (words.length === 12 || words.length === 24) {
            return true;
        }
        
        return false;
    }
    
    // Parse token information from XRPL response
    static parseTokenInfo(trustline) {
        return {
            currency: trustline.currency,
            issuer: trustline.account,
            value: parseFloat(trustline.balance),
            limit: parseFloat(trustline.limit) || 0,
            quality_in: trustline.quality_in || 0,
            quality_out: trustline.quality_out || 0
        };
    }
    
    // Calculate transaction fee estimate
    static estimateTransactionFee(recipientCount) {
        // Base fee is typically 12 drops (0.000012 XRP) per transaction
        const baseFeeDrops = 12;
        const totalFeeDrops = baseFeeDrops * recipientCount;
        const totalFeeXRP = totalFeeDrops / 1000000; // Convert drops to XRP
        
        return {
            perTransaction: baseFeeDrops,
            totalDrops: totalFeeDrops,
            totalXRP: totalFeeXRP
        };
    }
    
    // Generate transaction memo
    static generateMemo(purpose = 'Airdrop') {
        const timestamp = new Date().toISOString();
        return {
            MemoType: Buffer.from('text/plain', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(`${purpose} - ${timestamp}`, 'utf8').toString('hex').toUpperCase()
        };
    }
    
    // Validate transaction result
    static isTransactionSuccessful(result) {
        return result && 
               result.meta && 
               result.meta.TransactionResult === 'tesSUCCESS';
    }
    
    // Extract transaction hash from result
    static getTransactionHash(result) {
        return result && result.hash ? result.hash : null;
    }
    
    // Parse error message from XRPL response
    static parseErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.message) {
            return error.message;
        }
        
        if (error.error_message) {
            return error.error_message;
        }
        
        if (error.error) {
            return error.error;
        }
        
        return 'Unknown error occurred';
    }
    
    // Format currency code for display
    static formatCurrency(currency) {
        if (!currency) return '';
        
        // If it's a 3-character currency code, return as is
        if (currency.length === 3) {
            return currency.toUpperCase();
        }
        
        // If it's a hex-encoded currency, try to decode it
        if (currency.length === 40 && /^[0-9A-Fa-f]+$/.test(currency)) {
            try {
                const decoded = Buffer.from(currency, 'hex').toString('utf8').replace(/\0/g, '');
                return decoded || currency;
            } catch (e) {
                return currency;
            }
        }
        
        return currency;
    }
    
    // Check if amount is valid for token transfer
    static isValidTransferAmount(amount, availableBalance) {
        const numAmount = parseFloat(amount);
        const numBalance = parseFloat(availableBalance);
        
        if (isNaN(numAmount) || isNaN(numBalance)) {
            return false;
        }
        
        return numAmount > 0 && numAmount <= numBalance;
    }
    
    // Generate unique identifier for tracking
    static generateTrackingId() {
        return 'airdrop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Batch array into smaller chunks
    static batchArray(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }
    
    // Delay function for rate limiting
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Retry function for failed operations
    static async retry(operation, maxRetries = 3, delayMs = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`, error.message);
                await this.delay(delayMs);
                delayMs *= 2; // Exponential backoff
            }
        }
    }
    
    // Network configuration
    static getNetworkConfig(network) {
        const configs = {
            testnet: {
                server: 'wss://s.altnet.rippletest.net:51233',
                name: 'Testnet',
                explorer: 'https://testnet.xrpl.org'
            },
            mainnet: {
                server: 'wss://xrplcluster.com',
                name: 'Mainnet',
                explorer: 'https://xrpl.org'
            }
        };
        
        return configs[network] || configs.testnet;
    }
    
    // Transaction URL for explorer
    static getTransactionUrl(hash, network = 'testnet') {
        const config = this.getNetworkConfig(network);
        return `${config.explorer}/transactions/${hash}`;
    }
    
    // Account URL for explorer
    static getAccountUrl(address, network = 'testnet') {
        const config = this.getNetworkConfig(network);
        return `${config.explorer}/accounts/${address}`;
    }
}

// Export for use in other files
window.WalletUtils = WalletUtils;

// Additional wallet management functions
class WalletManager {
    constructor() {
        this.connectedWallet = null;
        this.walletInfo = null;
    }
    
    // Store wallet connection securely
    setConnectedWallet(walletData) {
        this.connectedWallet = walletData;
        this.walletInfo = walletData.info;
    }
    
    // Get connected wallet info
    getWalletInfo() {
        return this.walletInfo;
    }
    
    // Check if wallet is connected
    isConnected() {
        return this.connectedWallet !== null;
    }
    
    // Disconnect wallet (clear sensitive data)
    disconnect() {
        this.connectedWallet = null;
        this.walletInfo = null;
    }
    
    // Get available tokens for airdrop
    getAvailableTokens() {
        if (!this.walletInfo || !this.walletInfo.tokens) {
            return [];
        }
        
        return this.walletInfo.tokens.filter(token => {
            return parseFloat(token.value) > 0;
        });
    }
    
    // Get token by currency and issuer
    getToken(currency, issuer) {
        if (!this.walletInfo || !this.walletInfo.tokens) {
            return null;
        }
        
        return this.walletInfo.tokens.find(token => 
            token.currency === currency && token.issuer === issuer
        );
    }
    
    // Validate if wallet can perform airdrop
    canPerformAirdrop(tokenConfig, recipientCount) {
        if (!this.isConnected()) {
            return { valid: false, reason: 'Wallet not connected' };
        }
        
        const token = this.getToken(tokenConfig.currency, tokenConfig.issuer);
        if (!token) {
            return { valid: false, reason: 'Token not found in wallet' };
        }
        
        const requiredAmount = tokenConfig.amount * recipientCount;
        const availableAmount = parseFloat(token.value);
        
        if (requiredAmount > availableAmount) {
            return { 
                valid: false, 
                reason: `Insufficient balance. Required: ${requiredAmount}, Available: ${availableAmount}` 
            };
        }
        
        // Check XRP balance for transaction fees
        const estimatedFees = WalletUtils.estimateTransactionFee(recipientCount);
        const xrpBalance = parseFloat(this.walletInfo.xrp_balance);
        
        if (xrpBalance < estimatedFees.totalXRP + 10) { // 10 XRP reserve
            return {
                valid: false,
                reason: `Insufficient XRP for transaction fees. Required: ${estimatedFees.totalXRP + 10} XRP`
            };
        }
        
        return { valid: true };
    }
}

// Create global wallet manager instance
window.walletManager = new WalletManager();

// Local storage utilities for saving/loading data
class StorageUtils {
    static KEYS = {
        RECIPIENTS: 'xrpl_airdrop_recipients',
        NETWORK: 'xrpl_airdrop_network',
        SETTINGS: 'xrpl_airdrop_settings'
    };
    
    // Save recipients list
    static saveRecipients(recipients) {
        try {
            localStorage.setItem(this.KEYS.RECIPIENTS, JSON.stringify(recipients));
        } catch (e) {
            console.warn('Failed to save recipients to localStorage:', e);
        }
    }
    
    // Load recipients list
    static loadRecipients() {
        try {
            const saved = localStorage.getItem(this.KEYS.RECIPIENTS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load recipients from localStorage:', e);
            return [];
        }
    }
    
    // Save network selection
    static saveNetwork(network) {
        try {
            localStorage.setItem(this.KEYS.NETWORK, network);
        } catch (e) {
            console.warn('Failed to save network to localStorage:', e);
        }
    }
    
    // Load network selection
    static loadNetwork() {
        try {
            return localStorage.getItem(this.KEYS.NETWORK) || 'testnet';
        } catch (e) {
            console.warn('Failed to load network from localStorage:', e);
            return 'testnet';
        }
    }
    
    // Save app settings
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }
    
    // Load app settings
    static loadSettings() {
        try {
            const saved = localStorage.getItem(this.KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
            return {};
        }
    }
    
    // Clear all saved data
    static clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    }
}

// Export storage utilities
window.StorageUtils = StorageUtils;
