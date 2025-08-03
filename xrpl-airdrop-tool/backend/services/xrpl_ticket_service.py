import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.models.transactions import Payment, TicketCreate
from xrpl.models.requests import AccountObjects, AccountInfo
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.transaction import sign_and_submit, autofill
from xrpl.wallet import Wallet
from xrpl.utils import xrp_to_drops
import logging

logger = logging.getLogger(__name__)

class XRPLTicketManager:
    """Manages XRPL tickets for batch transactions"""
    
    def __init__(self, network='mainnet'):
        if network == 'mainnet':
            self.client = JsonRpcClient("https://xrplcluster.com")
        else:
            self.client = JsonRpcClient("https://s.altnet.rippletest.net:51234")
    
    def get_account_tickets(self, account_address):
        """Get available tickets for an account"""
        try:
            # Query account objects to find tickets
            request = AccountObjects(
                account=account_address,
                type="ticket",
                ledger_index="validated"
            )
            
            response = self.client.request(request)
            
            if not response.is_successful():
                logger.error(f"Failed to get account tickets: {response}")
                return []
            
            tickets = []
            if 'account_objects' in response.result:
                for obj in response.result['account_objects']:
                    if obj.get('LedgerEntryType') == 'Ticket':
                        tickets.append(obj.get('TicketSequence'))
            
            logger.info(f"Found {len(tickets)} tickets for account {account_address}")
            return sorted(tickets) if tickets else []
            
        except Exception as e:
            logger.error(f"Error getting account tickets: {str(e)}")
            return []
    
    def validate_account_readiness(self, wallet_address, recipients_count):
        """Validate account is ready for ticket-based airdrop"""
        try:
            # Check account info
            account_info_request = AccountInfo(account=wallet_address, ledger_index="validated")
            account_response = self.client.request(account_info_request)
            
            if not account_response.is_successful():
                return {
                    'ready': False,
                    'error': 'Account not found or not activated',
                    'details': {}
                }
            
            account_data = account_response.result.get('account_data', {})
            balance_drops = int(account_data.get('Balance', '0'))
            balance_xrp = balance_drops / 1000000
            
            # Get available tickets
            available_tickets = self.get_account_tickets(wallet_address)
            
            # Calculate requirements
            required_tickets = recipients_count
            fee_per_tx = 0.000012  # Standard fee
            required_xrp_for_fees = recipients_count * fee_per_tx
            base_reserve = 10  # Base account reserve (10 XRP)
            owner_reserve = 2   # Per-object reserve (2 XRP per ticket)
            
            # Calculate needed tickets
            tickets_to_create = max(0, required_tickets - len(available_tickets))
            ticket_creation_reserve = tickets_to_create * owner_reserve
            
            # Total XRP needed for operations (not including existing reserves)
            additional_xrp_needed = ticket_creation_reserve + required_xrp_for_fees
            
            # Check if we have enough XRP beyond the base reserve
            available_for_operations = max(0, balance_xrp - base_reserve)
            
            status = {
                'ready': True,
                'details': {
                    'balance_xrp': balance_xrp,
                    'available_tickets': len(available_tickets),
                    'required_tickets': required_tickets,
                    'tickets_to_create': tickets_to_create,
                    'tickets_sufficient': len(available_tickets) >= required_tickets,
                    'required_xrp_for_fees': required_xrp_for_fees,
                    'ticket_creation_reserve': ticket_creation_reserve,
                    'additional_xrp_needed': additional_xrp_needed,
                    'available_for_operations': available_for_operations,
                    'xrp_sufficient': available_for_operations >= additional_xrp_needed,
                    'ticket_sequences': available_tickets[:required_tickets] if available_tickets else []
                }
            }
            
            # Check if ready
            if len(available_tickets) < required_tickets:
                if available_for_operations < additional_xrp_needed:
                    status['ready'] = False
                    status['error'] = f'Insufficient XRP reserve. Need {additional_xrp_needed:.6f} XRP for {tickets_to_create} tickets and fees, but only have {available_for_operations:.6f} XRP available beyond base reserve.'
                else:
                    status['ready'] = False
                    status['error'] = f'Insufficient tickets. Have {len(available_tickets)}, need {required_tickets}. Can create {tickets_to_create} more tickets.'
            elif balance_xrp < (base_reserve + additional_xrp_needed):
                status['ready'] = False
                status['error'] = f'Insufficient XRP. Have {balance_xrp:.6f}, need {base_reserve + additional_xrp_needed:.6f}'
            
            return status
            
        except Exception as e:
            logger.error(f"Error validating account readiness: {str(e)}")
            return {
                'ready': False,
                'error': str(e),
                'details': {}
            }
    
    def create_tickets_directly(self, wallet_secret, ticket_count):
        """Create tickets directly on XRPL (for testing without Xaman)"""
        try:
            wallet = Wallet.from_seed(wallet_secret)
            
            # Create TicketCreate transaction
            ticket_create = TicketCreate(
                account=wallet.classic_address,
                ticket_count=ticket_count
            )
            
            # Autofill the transaction
            ticket_create = autofill(ticket_create, self.client)
            
            # Sign and submit
            response = sign_and_submit(ticket_create, self.client, wallet)
            
            if response.is_successful():
                return {
                    'success': True,
                    'txid': response.result.get('hash'),
                    'message': f'Created {ticket_count} tickets successfully'
                }
            else:
                return {
                    'success': False,
                    'error': response.result.get('engine_result_message', 'Unknown error')
                }
                
        except Exception as e:
            logger.error(f"Error creating tickets directly: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_ticket_payments(self, wallet_secret, recipients, token_amount, token_currency, token_issuer, ticket_sequences):
        """Create payment transactions using tickets for direct submission"""
        try:
            wallet = Wallet.from_seed(wallet_secret)
            results = []
            
            logger.info(f"Creating {len(recipients)} ticket payments with wallet {wallet.classic_address}")
            
            for i, recipient in enumerate(recipients):
                try:
                    if i >= len(ticket_sequences):
                        results.append({
                            'recipient': recipient,
                            'success': False,
                            'error': 'No ticket available for this recipient'
                        })
                        continue
                    
                    ticket_sequence = ticket_sequences[i]
                    
                    # Create payment transaction with ticket
                    payment = Payment(
                        account=wallet.classic_address,
                        destination=recipient,
                        amount=IssuedCurrencyAmount(
                            currency=token_currency,
                            value=str(token_amount),
                            issuer=token_issuer
                        ),
                        ticket_sequence=ticket_sequence
                    )
                    
                    # Autofill transaction (sets fee, sequence, etc.)
                    payment = autofill(payment, self.client)
                    
                    # Remove the auto-filled Sequence since we're using tickets
                    if hasattr(payment, 'sequence'):
                        delattr(payment, 'sequence')
                    
                    # Sign and submit transaction
                    response = sign_and_submit(payment, self.client, wallet)
                    
                    if response.is_successful():
                        results.append({
                            'recipient': recipient,
                            'success': True,
                            'txid': response.result.get('hash'),
                            'ticket_used': ticket_sequence
                        })
                        logger.info(f"Payment to {recipient} successful: {response.result.get('hash')}")
                    else:
                        error_msg = response.result.get('engine_result_message', 'Unknown error')
                        results.append({
                            'recipient': recipient,
                            'success': False,
                            'error': error_msg,
                            'ticket_used': ticket_sequence
                        })
                        logger.error(f"Payment to {recipient} failed: {error_msg}")
                        
                except Exception as e:
                    logger.error(f"Error processing payment to {recipient}: {str(e)}")
                    results.append({
                        'recipient': recipient,
                        'success': False,
                        'error': str(e)
                    })
            
            # Summary
            successful = [r for r in results if r.get('success')]
            failed = [r for r in results if not r.get('success')]
            
            logger.info(f"Ticket payments completed: {len(successful)} successful, {len(failed)} failed")
            
            return {
                'success': len(failed) == 0,
                'total': len(recipients),
                'successful': len(successful),
                'failed': len(failed),
                'results': results,
                'summary': f"Processed {len(recipients)} payments: {len(successful)} successful, {len(failed)} failed"
            }
            
        except Exception as e:
            logger.error(f"Error creating ticket payments: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'results': []
            }

# Global instance
ticket_manager = XRPLTicketManager()
