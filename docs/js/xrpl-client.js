// XRPL Client for direct blockchain interactions
console.log('Loading XRPL client...');

class XRPLClient {
    constructor() {
        this.client = null;
        this.connected = false;
        console.log('XRPLClient created');
    }

    async connect() {
        try {
            // Use mainnet server
            this.client = new xrpl.Client('wss://s1.ripple.com');
            await this.client.connect();
            this.connected = true;
            console.log('Connected to XRPL mainnet');
            return true;
        } catch (error) {
            console.error('Failed to connect to XRPL:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client && this.connected) {
            await this.client.disconnect();
            this.connected = false;
            console.log('Disconnected from XRPL');
        }
    }

    async getAccountInfo(address) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.client.request({
                command: 'account_info',
                account: address,
                ledger_index: 'validated'
            });

            return {
                address: address,
                balance: xrpl.dropsToXrp(response.result.account_data.Balance),
                sequence: response.result.account_data.Sequence,
                reserve: response.result.account_data.OwnerCount * 2 + 10, // Base + owner reserves
                exists: true
            };
        } catch (error) {
            if (error.data?.error === 'actNotFound') {
                return {
                    address: address,
                    balance: '0',
                    sequence: 0,
                    reserve: 10,
                    exists: false
                };
            }
            throw error;
        }
    }

    async getAccountLines(address) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.client.request({
                command: 'account_lines',
                account: address,
                ledger_index: 'validated'
            });

            return response.result.lines.map(line => ({
                currency: line.currency,
                issuer: line.account,
                balance: line.balance,
                limit: line.limit,
                limitPeer: line.limit_peer
            }));
        } catch (error) {
            if (error.data?.error === 'actNotFound') {
                return [];
            }
            throw error;
        }
    }

    async validateAddress(address) {
        try {
            return xrpl.isValidAddress(address);
        } catch (error) {
            return false;
        }
    }

    async submitTransaction(signedTx) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.client.submit(signedTx);
            return {
                success: response.result.engine_result === 'tesSUCCESS',
                hash: response.result.tx_json.hash,
                result: response.result.engine_result,
                message: response.result.engine_result_message
            };
        } catch (error) {
            throw error;
        }
    }

    async getTransaction(hash) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.client.request({
                command: 'tx',
                transaction: hash
            });

            return {
                hash: hash,
                result: response.result.meta.TransactionResult,
                validated: response.result.validated,
                ledgerIndex: response.result.ledger_index,
                fee: xrpl.dropsToXrp(response.result.Fee),
                transaction: response.result
            };
        } catch (error) {
            throw error;
        }
    }

    formatAmount(amount, currency, issuer) {
        if (currency === 'XRP') {
            return xrpl.xrpToDrops(amount.toString());
        } else {
            return {
                currency: currency,
                value: amount.toString(),
                issuer: issuer
            };
        }
    }

    async estimateFee() {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.client.request({
                command: 'server_info'
            });

            // Get base fee from server info
            const baseFee = response.result.info.validated_ledger.base_fee_xrp;
            return baseFee || 0.00001; // Default to 10 drops if not available
        } catch (error) {
            console.warn('Could not estimate fee, using default:', error);
            return 0.00001; // 10 drops default
        }
    }
}

// Create global instance
console.log('Creating XRPLClient instance...');
window.xrplClient = new XRPLClient();
console.log('XRPLClient instance created:', window.xrplClient);
