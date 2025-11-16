/**
 * EyeTrip VR - Ethereum Wallet Connection (Demo Mode)
 * Connects to MetaMask for future payment integration
 * Current: Display only - No actual transactions until after Chroma Awards
 */

class WalletManager {
    constructor() {
        this.connected = false;
        this.userAddress = null;
        this.networkId = null;
        this.demoMode = true; // Set to false after Chroma Awards
        this.affirmationPrice = 5; // USD
        this.artistWallet = '0x6303f255b3fcb58ba8c81f11ca7ab8587e25bc09';
    }

    async init() {
        console.log('🔗 Initializing Wallet Manager...');
        
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            console.log('✅ MetaMask detected!');
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
            
            return true;
        } else {
            console.log('❌ MetaMask not detected');
            return false;
        }
    }

    async connectWallet() {
        try {
            console.log('🔌 Attempting to connect wallet...');
            
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.userAddress = accounts[0];
            this.connected = true;
            
            // Get network info
            const chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            this.networkId = parseInt(chainId, 16);
            
            console.log('✅ Wallet connected:', this.userAddress);
            console.log('🌐 Network:', this.getNetworkName(this.networkId));
            
            // Update UI
            this.updateUI();
            
            // Track connection event
            if (window.trackVREvent) {
                window.trackVREvent('wallet_connected', 'MetaMask', this.networkId);
            }
            
            return {
                success: true,
                address: this.userAddress,
                network: this.getNetworkName(this.networkId)
            };
            
        } catch (error) {
            console.error('❌ Error connecting wallet:', error);
            
            if (error.code === 4001) {
                // User rejected the request
                return {
                    success: false,
                    error: 'Connection rejected by user'
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    async disconnectWallet() {
        this.connected = false;
        this.userAddress = null;
        this.networkId = null;
        this.updateUI();
        console.log('🔌 Wallet disconnected');
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            console.log('🔌 MetaMask is locked or user disconnected');
            this.disconnectWallet();
        } else if (accounts[0] !== this.userAddress) {
            this.userAddress = accounts[0];
            console.log('🔄 Account changed to:', this.userAddress);
            this.updateUI();
        }
    }

    handleChainChanged(chainId) {
        console.log('🔄 Network changed to:', chainId);
        // Reload the page as recommended by MetaMask
        window.location.reload();
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            137: 'Polygon Mainnet',
            80001: 'Polygon Mumbai',
            8453: 'Base Mainnet',
            84532: 'Base Sepolia'
        };
        return networks[chainId] || `Network ID: ${chainId}`;
    }

    async getETHPrice() {
        try {
            // Get current ETH/USD price from CoinGecko
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            const data = await response.json();
            return data.ethereum.usd;
        } catch (error) {
            console.error('Error fetching ETH price:', error);
            return 2000; // Fallback price
        }
    }

    async calculateAffirmationPrice() {
        const ethPrice = await this.getETHPrice();
        const ethAmount = this.affirmationPrice / ethPrice;
        return {
            usd: this.affirmationPrice,
            eth: ethAmount.toFixed(6),
            ethPrice: ethPrice
        };
    }

    async purchaseAffirmationExperience() {
        if (!this.connected) {
            return {
                success: false,
                error: 'Please connect your wallet first'
            };
        }

        const pricing = await this.calculateAffirmationPrice();
        
        if (this.demoMode) {
            console.log('🎭 DEMO MODE: Simulating transaction...');
            console.log('💰 Price:', pricing.usd, 'USD (', pricing.eth, 'ETH)');
            console.log('👨‍🎨 Artist wallet:', this.artistWallet);
            console.log('💳 User wallet:', this.userAddress);
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('✅ Demo transaction "successful"');
            
            if (window.trackVREvent) {
                window.trackVREvent('demo_purchase', 'Affirmation_Experience', this.affirmationPrice);
            }
            
            return {
                success: true,
                demo: true,
                txHash: '0x' + Math.random().toString(16).substr(2, 64), // Fake hash
                price: pricing
            };
        }
        
        // Real transaction (after Chroma Awards)
        try {
            const transactionParameters = {
                to: this.artistWallet,
                from: this.userAddress,
                value: '0x' + Math.floor(pricing.eth * 1e18).toString(16), // Convert to Wei
                data: '0x', // No contract call, just transfer
            };
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            
            console.log('✅ Transaction sent:', txHash);
            
            if (window.trackVREvent) {
                window.trackVREvent('real_purchase', 'Affirmation_Experience', this.affirmationPrice);
            }
            
            return {
                success: true,
                demo: false,
                txHash: txHash,
                price: pricing
            };
            
        } catch (error) {
            console.error('❌ Transaction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    updateUI() {
        const walletBtn = document.getElementById('walletConnectBtn');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        const walletNetwork = document.getElementById('walletNetwork');
        
        if (!walletBtn) return;
        
        if (this.connected) {
            walletBtn.innerHTML = '✅ Connected';
            walletBtn.classList.add('connected');
            
            if (walletInfo) {
                walletInfo.style.display = 'block';
                if (walletAddress) {
                    walletAddress.textContent = this.formatAddress(this.userAddress);
                }
                if (walletNetwork) {
                    walletNetwork.textContent = this.getNetworkName(this.networkId);
                }
            }
        } else {
            walletBtn.innerHTML = '🦊 Connect MetaMask';
            walletBtn.classList.remove('connected');
            
            if (walletInfo) {
                walletInfo.style.display = 'none';
            }
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    isConnected() {
        return this.connected;
    }

    getUserAddress() {
        return this.userAddress;
    }
}

// Global wallet manager instance
window.walletManager = new WalletManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const hasMetaMask = await window.walletManager.init();
    
    if (!hasMetaMask) {
        console.log('💡 MetaMask not found. Please install: https://metamask.io/');
    }
});
