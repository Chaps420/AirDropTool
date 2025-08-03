// Real Xaman Integration
// Based on https://docs.xaman.dev/

console.log('Loading real Xaman integration...');

// Real Xaman Integration Class
class RealXamanIntegration {
    constructor() {
        this.apiKey = '335efd5b-f1c8-450e-b844-bd26b8c223f0';
        this.apiSecret = '5715a322-ff36-4c80-bc42-e7ccf0c0225d';
        this.baseUrl = 'https://xumm.app/api/v1/platform';
        this.connected = false;
        this.account = null;
        this.currentPayload = null;
        this.websocket = null;
        console.log('RealXamanIntegration created');
    }

    async connect() {
        console.log('RealXamanIntegration.connect() called');
        
        try {
            // Show QR modal
            const qrContainer = document.getElementById('xaman-qr-container');
            if (qrContainer) {
                qrContainer.style.display = 'flex';
                // Add close button functionality
                this.setupModalCloseHandlers();
            }

            // Update status
            const statusText = document.getElementById('xaman-status-text');
            if (statusText) {
                statusText.textContent = 'Creating sign-in request...';
            }

            // Create sign-in payload
            const payload = await this.createSignInPayload();
            
            if (!payload || !payload.uuid) {
                throw new Error('Failed to create Xaman payload');
            }

            this.currentPayload = payload;

            // Show real QR code
            this.showRealQR(payload.refs.qr_png, payload.refs.websocket_status);

            // Start monitoring the payload
            return await this.monitorPayload(payload.uuid, payload.refs.websocket_status);

        } catch (error) {
            console.error('Connection error:', error);
            this.showError(`Connection failed: ${error.message}`);
            throw error;
        }
    }

    async createSignInPayload() {
        console.log('Creating Xaman sign-in payload via backend...');
        
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/xaman/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    network: window.state?.selectedNetwork || 'testnet'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend API error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success && result.payload) {
                console.log('Payload created successfully:', result.payload);
                return result.payload;
            } else {
                throw new Error(result.error || 'Failed to create payload');
            }

        } catch (error) {
            console.error('Error creating payload:', error);
            throw error;
        }
    }

    showRealQR(qrImageUrl, websocketUrl) {
        console.log('Showing real QR code:', qrImageUrl);
        
        const qrCode = document.getElementById('xaman-qr-code');
        if (qrCode) {
            qrCode.innerHTML = `
                <img src="${qrImageUrl}" 
                     alt="Xaman QR Code" 
                     style="width: 200px; height: 200px; border-radius: 8px;">
            `;
        }

        // Update status
        const statusText = document.getElementById('xaman-status-text');
        if (statusText) {
            statusText.innerHTML = `
                <div style="color: #667eea;">
                    📱 Scan QR code with Xaman app to connect your wallet
                </div>
            `;
        }
    }

    async monitorPayload(payloadUuid, websocketUrl) {
        console.log('Monitoring payload:', payloadUuid);
        
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeout = setTimeout(() => {
                if (this.websocket) {
                    this.websocket.close();
                }
                reject(new Error('Connection timeout - please try again'));
            }, 300000); // 5 minutes

            // Connect to websocket for real-time updates
            try {
                this.websocket = new WebSocket(websocketUrl);
                
                this.websocket.onopen = () => {
                    console.log('WebSocket connected');
                    const statusText = document.getElementById('xaman-status-text');
                    if (statusText) {
                        statusText.innerHTML = `
                            <div style="color: #667eea;">
                                🔗 Connected - waiting for you to sign in Xaman app...
                            </div>
                        `;
                    }
                };

                this.websocket.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('WebSocket message:', data);

                        if (data.signed === true) {
                            clearTimeout(timeout);
                            
                            // Get the account info from the payload result
                            const payloadResult = await this.getPayloadResult(payloadUuid);
                            
                            if (payloadResult && payloadResult.response && payloadResult.response.account) {
                                const account = {
                                    address: payloadResult.response.account,
                                    balance: '0', // Will be fetched separately
                                    network: window.state?.selectedNetwork || 'testnet'
                                };

                                this.connected = true;
                                this.account = account;

                                // Hide QR modal
                                this.hideQRModal();

                                console.log('Sign-in successful:', account);
                                resolve(account);
                            } else {
                                reject(new Error('Failed to get account information'));
                            }
                        } else if (data.signed === false) {
                            clearTimeout(timeout);
                            reject(new Error('Sign-in was rejected or cancelled'));
                        }
                    } catch (error) {
                        console.error('Error processing WebSocket message:', error);
                    }
                };

                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    clearTimeout(timeout);
                    reject(new Error('WebSocket connection failed'));
                };

                this.websocket.onclose = () => {
                    console.log('WebSocket connection closed');
                };

            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    async getPayloadResult(payloadUuid) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/xaman/payload/${payloadUuid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success && result.payload) {
                console.log('Payload result:', result.payload);
                return result.payload;
            } else {
                throw new Error(result.error || 'Failed to get payload result');
            }

        } catch (error) {
            console.error('Error getting payload result:', error);
            throw error;
        }
    }

    showError(message) {
        const statusText = document.getElementById('xaman-status-text');
        if (statusText) {
            statusText.innerHTML = `
                <div style="color: #dc2626;">
                    ❌ ${message}
                </div>
            `;
        }

        // Hide QR modal on error
        this.hideQRModal();
    }

    setupModalCloseHandlers() {
        // Close button
        const closeButton = document.getElementById('close-qr-modal');
        if (closeButton) {
            closeButton.onclick = () => this.hideQRModal();
        }

        // Click outside modal to close
        const qrContainer = document.getElementById('xaman-qr-container');
        if (qrContainer) {
            qrContainer.onclick = (e) => {
                if (e.target === qrContainer) {
                    this.hideQRModal();
                }
            };
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideQRModal();
            }
        });
    }

    hideQRModal() {
        const qrContainer = document.getElementById('xaman-qr-container');
        if (qrContainer) {
            qrContainer.style.display = 'none';
        }
    }

    disconnect() {
        this.connected = false;
        this.account = null;
        this.currentPayload = null;
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        console.log('Disconnected from Xaman');
    }
}

// Create global instance
console.log('Creating RealXamanIntegration instance...');
window.xamanIntegration = new RealXamanIntegration();
console.log('RealXamanIntegration instance created:', window.xamanIntegration);
console.log('Connect method type:', typeof window.xamanIntegration.connect);
