import logging
import xrpl
from xrpl.models.transactions import Payment
from xrpl.models.requests import AccountInfo, AccountLines
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.clients import JsonRpcClient, WebsocketClient
from xrpl.wallet import Wallet
import asyncio
import time

logger = logging.getLogger(__name__)

class XRPLService:
    """Service for interacting with the XRPL network."""
    
    def __init__(self, network='testnet'):
        """Initialize XRPL service with network configuration."""
        self.network = network
        self.client = None
        self._setup_client()
    
    def _setup_client(self):
        """Setup XRPL client based on network."""
        if self.network == 'testnet':
            self.client = JsonRpcClient("https://s.altnet.rippletest.net:51234")
        elif self.network == 'mainnet':
            self.client = JsonRpcClient("https://xrplcluster.com")
        else:
            raise ValueError(f"Unsupported network: {self.network}")
        
        logger.info(f"XRPL client initialized for {self.network}")
    
    def wallet_from_seed(self, seed):
        """Create wallet from seed/secret."""
        try:
            # Handle different seed formats
            seed = seed.strip()
            
            # Try different wallet creation methods
            if seed.startswith('s') and len(seed) >= 25:
                # Family seed format
                wallet = Wallet.from_seed(seed)
            elif len(seed) == 64 and all(c in '0123456789ABCDEFabcdef' for c in seed):
                # Hex private key
                wallet = Wallet.from_secret(seed)
            else:
                # Try as family seed first, then as secret
                try:
                    wallet = Wallet.from_seed(seed)
                except:
                    wallet = Wallet.from_secret(seed)
            
            logger.info(f"Wallet created successfully: {wallet.classic_address}")
            return wallet
            
        except Exception as e:
            logger.error(f"Failed to create wallet from seed: {str(e)}")
            raise ValueError(f"Invalid wallet seed format: {str(e)}")
    
    def get_account_info(self, address):
        """Get account information for an address."""
        try:
            request = AccountInfo(account=address)
            response = self.client.request(request)
            
            if response.is_successful():
                account_data = response.result['account_data']
                
                # Convert XRP balance from drops to XRP
                xrp_balance = float(account_data['Balance']) / 1000000
                
                return {
                    'address': address,
                    'xrp_balance': xrp_balance,
                    'sequence': account_data['Sequence'],
                    'account_data': account_data
                }
            else:
                raise Exception(f"Failed to get account info: {response.result}")
                
        except Exception as e:
            logger.error(f"Error getting account info for {address}: {str(e)}")
            raise
    
    def get_account_tokens(self, address):
        """Get token holdings (trust lines) for an address."""
        try:
            request = AccountLines(account=address)
            response = self.client.request(request)
            
            if response.is_successful():
                lines = response.result.get('lines', [])
                tokens = []
                
                for line in lines:
                    # Only include lines with positive balance
                    balance = float(line['balance'])
                    if balance > 0:
                        tokens.append({
                            'currency': line['currency'],
                            'issuer': line['account'],
                            'balance': balance,
                            'limit': float(line['limit']) if line['limit'] != '0' else 0
                        })
                
                return tokens
            else:
                raise Exception(f"Failed to get account lines: {response.result}")
                
        except Exception as e:
            logger.error(f"Error getting account tokens for {address}: {str(e)}")
            raise
    
    def send_xrp(self, wallet, destination, amount_xrp):
        """Send XRP to a destination address."""
        try:
            # Convert XRP to drops
            amount_drops = str(int(float(amount_xrp) * 1000000))
            
            # Create payment transaction
            payment = Payment(
                account=wallet.classic_address,
                destination=destination,
                amount=amount_drops
            )
            
            # Submit transaction
            response = xrpl.transaction.submit_and_wait(payment, self.client, wallet)
            
            if response.is_successful():
                return {
                    'success': True,
                    'tx_hash': response.result['hash'],
                    'amount': amount_xrp,
                    'currency': 'XRP'
                }
            else:
                return {
                    'success': False,
                    'error': f"Transaction failed: {response.result}"
                }
                
        except Exception as e:
            logger.error(f"Error sending XRP: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_token(self, wallet, destination, currency, issuer, amount):
        """Send a token to a destination address."""
        try:
            # Create issued currency amount
            token_amount = IssuedCurrencyAmount(
                currency=currency,
                issuer=issuer,
                value=str(amount)
            )
            
            # Create payment transaction
            payment = Payment(
                account=wallet.classic_address,
                destination=destination,
                amount=token_amount
            )
            
            # Submit transaction
            response = xrpl.transaction.submit_and_wait(payment, self.client, wallet)
            
            if response.is_successful():
                return {
                    'success': True,
                    'tx_hash': response.result['hash'],
                    'amount': amount,
                    'currency': currency,
                    'issuer': issuer
                }
            else:
                return {
                    'success': False,
                    'error': f"Transaction failed: {response.result}"
                }
                
        except Exception as e:
            logger.error(f"Error sending token: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def validate_address(self, address):
        """Validate an XRPL address."""
        try:
            return xrpl.core.addresscodec.is_valid_classic_address(address)
        except:
            return False
    
    def get_network_info(self):
        """Get information about the connected network."""
        try:
            response = self.client.request(xrpl.models.requests.ServerInfo())
            
            if response.is_successful():
                return {
                    'network': self.network,
                    'server_info': response.result.get('info', {}),
                    'connected': True
                }
            else:
                return {
                    'network': self.network,
                    'connected': False,
                    'error': 'Failed to get server info'
                }
        except Exception as e:
            logger.error(f"Error getting network info: {str(e)}")
            return {
                'network': self.network,
                'connected': False,
                'error': str(e)
            }
    
    def estimate_fee(self):
        """Estimate current network fees."""
        try:
            response = self.client.request(xrpl.models.requests.Fee())
            
            if response.is_successful():
                fee_info = response.result
                return {
                    'base_fee': int(fee_info.get('drops', {}).get('base_fee', 12)),
                    'reserve_base': int(fee_info.get('drops', {}).get('reserve_base', 20000000)),
                    'reserve_inc': int(fee_info.get('drops', {}).get('reserve_inc', 5000000))
                }
            else:
                # Return default values if fee lookup fails
                return {
                    'base_fee': 12,
                    'reserve_base': 20000000,
                    'reserve_inc': 5000000
                }
        except Exception as e:
            logger.warning(f"Error estimating fees, using defaults: {str(e)}")
            return {
                'base_fee': 12,
                'reserve_base': 20000000,
                'reserve_inc': 5000000
            }
    
    def get_base_fee(self, network='testnet'):
        """Get current base fee from XRPL network (for external use)"""
        try:
            # Create a temporary client for the specified network if different from current
            if network != self.network:
                from xrpl.clients import JsonRpcClient
                temp_url = "https://s.altnet.rippletest.net:51234" if network == 'testnet' else "https://xrplcluster.com"
                temp_client = JsonRpcClient(temp_url)
                
                response = temp_client.request(xrpl.models.requests.Fee())
                if response.is_successful():
                    return int(response.result.get('drops', {}).get('base_fee', 10))
            else:
                # Use current client
                fee_info = self.estimate_fee()
                return fee_info.get('base_fee', 10)
                
        except Exception as e:
            logger.warning(f"Could not get base fee from {network}: {e}")
            
        return 10  # Default base fee: 10 drops (0.00001 XRP)
    
    def batch_send_tokens(self, wallet, recipients_config, delay_seconds=1):
        """Send tokens to multiple recipients with rate limiting."""
        results = []
        
        for i, config in enumerate(recipients_config):
            try:
                recipient = config['recipient']
                currency = config['currency']
                issuer = config['issuer']
                amount = config['amount']
                
                logger.info(f"Sending {amount} {currency} to {recipient} ({i+1}/{len(recipients_config)})")
                
                result = self.send_token(wallet, recipient, currency, issuer, amount)
                results.append({
                    'recipient': recipient,
                    'result': result,
                    'index': i
                })
                
                # Rate limiting
                if i < len(recipients_config) - 1:  # Don't delay after last transaction
                    time.sleep(delay_seconds)
                    
            except Exception as e:
                logger.error(f"Error in batch send for recipient {recipient}: {str(e)}")
                results.append({
                    'recipient': recipient,
                    'result': {
                        'success': False,
                        'error': str(e)
                    },
                    'index': i
                })
        
        return results
    
    def close(self):
        """Close the XRPL client connection."""
        try:
            if hasattr(self.client, 'close'):
                self.client.close()
            logger.info("XRPL client connection closed")
        except Exception as e:
            logger.warning(f"Error closing XRPL client: {str(e)}")

    def get_issuer_tokens(self, issuer_address):
        """Get tokens issued by a specific address"""
        try:
            # Get account info to verify the address exists
            account_info = self.get_account_info(issuer_address)
            if not account_info:
                raise Exception("Issuer address not found")
            
            # For now, return some common tokens as examples
            # In a real implementation, you would query the ledger for actual issued tokens
            example_tokens = [
                {
                    'currency': 'USD',
                    'description': 'US Dollar Token',
                    'balance': '1000000',
                    'holders': '250+'
                },
                {
                    'currency': 'EUR',
                    'description': 'Euro Token', 
                    'balance': '500000',
                    'holders': '150+'
                },
                {
                    'currency': 'BTC',
                    'description': 'Bitcoin Token',
                    'balance': '100',
                    'holders': '75+'
                }
            ]
            
            # TODO: Implement actual token discovery from XRPL ledger
            # This would involve:
            # 1. Querying account_lines for trust lines with this issuer
            # 2. Getting token metadata from the ledger
            # 3. Calculating circulation and holder counts
            
            logger.info(f"Found {len(example_tokens)} tokens for issuer {issuer_address}")
            return example_tokens
            
        except Exception as e:
            logger.error(f"Error getting issuer tokens: {str(e)}")
            raise Exception(f"Failed to get issuer tokens: {str(e)}")

    def get_token_info(self, issuer_address, currency_code):
        """Get detailed information about a specific token"""
        try:
            # Get account info to verify addresses
            account_info = self.get_account_info(issuer_address)
            if not account_info:
                raise Exception("Issuer address not found")
            
            # For demo purposes, return mock token info
            token_info = {
                'currency': currency_code,
                'issuer': issuer_address,
                'total_supply': '1000000',
                'circulating_supply': '750000',
                'holders': '125',
                'description': f'{currency_code} token issued by {issuer_address[:10]}...',
                'created_date': '2024-01-15',
                'verified': False
            }
            
            # TODO: Implement actual token info retrieval from XRPL
            # This would involve querying the ledger for:
            # - Token metadata
            # - Supply information  
            # - Holder statistics
            # - Trust line data
            
            logger.info(f"Retrieved token info for {currency_code} from {issuer_address}")
            return token_info
            
        except Exception as e:
            logger.error(f"Error getting token info: {str(e)}")
            raise Exception(f"Failed to get token info: {str(e)}")
