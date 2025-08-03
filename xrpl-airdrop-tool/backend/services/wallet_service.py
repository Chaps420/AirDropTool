import logging
from services.xrpl_service import XRPLService

logger = logging.getLogger(__name__)

class WalletService:
    """Service for wallet-related operations."""
    
    def __init__(self, network='testnet'):
        """Initialize wallet service."""
        self.network = network
        self.xrpl_service = XRPLService(network)
    
    def connect_wallet(self, seed):
        """Connect to a wallet and return comprehensive information."""
        try:
            # Create wallet from seed
            wallet = self.xrpl_service.wallet_from_seed(seed)
            
            # Get account information
            account_info = self.xrpl_service.get_account_info(wallet.classic_address)
            
            # Get token holdings
            tokens = self.xrpl_service.get_account_tokens(wallet.classic_address)
            
            # Combine information
            wallet_info = {
                'address': wallet.classic_address,
                'xrp_balance': account_info['xrp_balance'],
                'sequence': account_info['sequence'],
                'tokens': tokens,
                'network': self.network
            }
            
            logger.info(f"Wallet connected successfully: {wallet.classic_address}")
            return wallet_info
            
        except Exception as e:
            logger.error(f"Failed to connect wallet: {str(e)}")
            raise ValueError(f"Failed to connect wallet: {str(e)}")
    
    def get_account_info(self, address):
        """Get account information for a specific address."""
        try:
            return self.xrpl_service.get_account_info(address)
        except Exception as e:
            logger.error(f"Failed to get account info for {address}: {str(e)}")
            raise
    
    def get_account_tokens(self, address):
        """Get token holdings for a specific address."""
        try:
            return self.xrpl_service.get_account_tokens(address)
        except Exception as e:
            logger.error(f"Failed to get tokens for {address}: {str(e)}")
            raise
    
    def get_comprehensive_wallet_info(self, address):
        """Get comprehensive wallet information including balance and tokens."""
        try:
            # Get basic account info
            account_info = self.get_account_info(address)
            
            # Get token holdings
            tokens = self.get_account_tokens(address)
            
            # Combine information
            wallet_info = {
                'address': address,
                'xrp_balance': account_info['xrp_balance'],
                'sequence': account_info['sequence'],
                'tokens': tokens,
                'network': self.network,
                'account_data': account_info.get('account_data', {})
            }
            
            return wallet_info
            
        except Exception as e:
            logger.error(f"Failed to get comprehensive wallet info for {address}: {str(e)}")
            raise
    
    def validate_wallet_for_airdrop(self, seed, token_config, recipients):
        """Validate if a wallet can perform an airdrop."""
        try:
            # Connect to wallet
            wallet_info = self.connect_wallet(seed)
            
            # Check if wallet has the required token
            required_currency = token_config['currency']
            required_issuer = token_config['issuer']
            required_amount = token_config['amount'] * len(recipients)
            
            # Find the token in wallet
            wallet_token = None
            for token in wallet_info['tokens']:
                if (token['currency'] == required_currency and 
                    token['issuer'] == required_issuer):
                    wallet_token = token
                    break
            
            if not wallet_token:
                return {
                    'valid': False,
                    'error': f'Token {required_currency} not found in wallet'
                }
            
            # Check if wallet has sufficient balance
            available_balance = wallet_token['value']
            if available_balance < required_amount:
                return {
                    'valid': False,
                    'error': f'Insufficient token balance. Required: {required_amount}, Available: {available_balance}'
                }
            
            # Check XRP balance for transaction fees
            estimated_fees = self._estimate_airdrop_fees(len(recipients))
            if wallet_info['xrp_balance'] < estimated_fees['total_xrp'] + 10:  # 10 XRP buffer
                return {
                    'valid': False,
                    'error': f'Insufficient XRP for transaction fees. Required: {estimated_fees["total_xrp"] + 10} XRP'
                }
            
            return {
                'valid': True,
                'wallet_info': wallet_info,
                'estimated_fees': estimated_fees,
                'token_info': wallet_token
            }
            
        except Exception as e:
            logger.error(f"Wallet validation error: {str(e)}")
            return {
                'valid': False,
                'error': str(e)
            }
    
    def _estimate_airdrop_fees(self, recipient_count):
        """Estimate fees for an airdrop."""
        try:
            fee_info = self.xrpl_service.estimate_fee()
            base_fee_drops = fee_info['base_fee']
            
            total_fee_drops = base_fee_drops * recipient_count
            total_fee_xrp = total_fee_drops / 1000000
            
            return {
                'base_fee_drops': base_fee_drops,
                'total_fee_drops': total_fee_drops,
                'total_xrp': total_fee_xrp,
                'recipient_count': recipient_count
            }
        except Exception as e:
            logger.warning(f"Fee estimation failed, using defaults: {str(e)}")
            # Return default estimates
            base_fee_drops = 12
            total_fee_drops = base_fee_drops * recipient_count
            total_fee_xrp = total_fee_drops / 1000000
            
            return {
                'base_fee_drops': base_fee_drops,
                'total_fee_drops': total_fee_drops,
                'total_xrp': total_fee_xrp,
                'recipient_count': recipient_count
            }
    
    def prepare_airdrop_config(self, wallet_info, token_config, recipients):
        """Prepare configuration for airdrop execution."""
        try:
            # Validate inputs
            if not wallet_info or not token_config or not recipients:
                raise ValueError("Missing required parameters")
            
            # Find token in wallet
            wallet_token = None
            for token in wallet_info['tokens']:
                if (token['currency'] == token_config['currency'] and 
                    token['issuer'] == token_config['issuer']):
                    wallet_token = token
                    break
            
            if not wallet_token:
                raise ValueError(f"Token {token_config['currency']} not found in wallet")
            
            # Prepare recipient configurations
            recipients_config = []
            for recipient in recipients:
                recipients_config.append({
                    'recipient': recipient,
                    'currency': token_config['currency'],
                    'issuer': token_config['issuer'],
                    'amount': token_config['amount']
                })
            
            # Calculate totals
            total_amount = token_config['amount'] * len(recipients)
            estimated_fees = self._estimate_airdrop_fees(len(recipients))
            
            return {
                'recipients_config': recipients_config,
                'total_amount': total_amount,
                'estimated_fees': estimated_fees,
                'wallet_token': wallet_token,
                'wallet_address': wallet_info['address']
            }
            
        except Exception as e:
            logger.error(f"Failed to prepare airdrop config: {str(e)}")
            raise
    
    def get_wallet_transaction_history(self, address, limit=50):
        """Get transaction history for a wallet (if needed for future features)."""
        # This would require additional XRPL API calls
        # For now, return placeholder
        return {
            'address': address,
            'transactions': [],
            'message': 'Transaction history feature not implemented yet'
        }
