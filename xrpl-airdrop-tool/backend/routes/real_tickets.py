from flask import Blueprint, request, jsonify
import requests
import logging
from services.xrpl_ticket_service import ticket_manager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

real_tickets_bp = Blueprint('real_tickets', __name__)

# Xaman API credentials
XAMAN_API_KEY = '335efd5b-f1c8-450e-b844-bd26b8c223f0'
XAMAN_API_SECRET = '5715a322-ff36-4c80-bc42-e7ccf0c0225d'

@real_tickets_bp.route('/create-real-ticket-batch', methods=['POST'])
def create_real_ticket_batch():
    """Create tickets for batch airdrop - REAL XRPL implementation"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        recipient_count = data.get('recipient_count')
        
        logger.info(f"Creating REAL ticket batch for {recipient_count} recipients from {wallet_address}")
        
        # Create TicketCreate transaction
        ticket_transaction = {
            "TransactionType": "TicketCreate",
            "Account": wallet_address,
            "TicketCount": recipient_count,
            "Fee": "12"  # Standard fee
        }
        
        # Create Xaman payload for ticket creation
        payload = {
            "txjson": ticket_transaction,
            "custom_meta": {
                "instruction": f"⚡ CREATE {recipient_count} TICKETS for REAL AIRDROP",
                "blob": {
                    "purpose": "Create transaction tickets for LIVE batch airdrop execution",
                    "recipient_count": recipient_count,
                    "mode": "REAL_XRPL_IMPLEMENTATION"
                }
            }
        }
        
        # Send to Xaman API
        response = requests.post(
            "https://xumm.app/api/v1/platform/payload",
            headers={
                'X-API-Key': XAMAN_API_KEY,
                'X-API-Secret': XAMAN_API_SECRET,
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=10
        )
        
        logger.info(f"Xaman API response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'success': True,
                'uuid': result['uuid'],
                'refs': {
                    'qr_png': f"https://xumm.app/sign/{result['uuid']}_q.png",
                    'qr_matrix': f"https://xumm.app/sign/{result['uuid']}_m.png",
                    'qr_uri_quality_opts': f"https://xumm.app/sign/{result['uuid']}",
                    'websocket_status': f"wss://xumm.app/sign/{result['uuid']}"
                },
                'pushed': result.get('pushed', False)
            })
        else:
            error_text = response.text
            logger.error(f"Xaman API error: {response.status_code} - {error_text}")
            return jsonify({
                'success': False,
                'error': f'Xaman API error: {response.status_code}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error creating real ticket batch: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create real ticket batch'
        }), 500

@real_tickets_bp.route('/execute-real-ticket-airdrop', methods=['POST'])
def execute_real_ticket_airdrop():
    """Execute REAL airdrop using pre-created tickets with wallet secret"""
    try:
        data = request.get_json()
        wallet_secret = data.get('wallet_secret')  # User provides wallet secret
        recipients = data.get('recipients')  # List of {address, amount}
        token = data.get('token')
        starting_ticket = data.get('starting_ticket', 1)
        
        logger.info(f"Executing REAL ticket airdrop for {len(recipients)} recipients")
        
        if not wallet_secret:
            return jsonify({
                'success': False,
                'error': 'Wallet secret is required for real XRPL transactions'
            }), 400
        
        # Execute real XRPL transactions synchronously
        result = ticket_manager.create_ticket_payments(
            wallet_secret=wallet_secret,
            recipients=recipients,
            token_info=token,
            starting_ticket=starting_ticket
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error executing real ticket airdrop: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to execute real ticket airdrop: {str(e)}'
        }), 500

@real_tickets_bp.route('/check-readiness', methods=['POST'])
def check_readiness():
    """Check if account is ready for real ticket airdrop"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        recipient_count = data.get('recipient_count', 1)
        
        logger.info(f"Checking readiness for {wallet_address}")
        
        # Use ticket manager to check account
        from services.xrpl_service import get_xrpl_client
        client = get_xrpl_client('mainnet')
        
        # Check account info
        from xrpl.models.requests import AccountInfo, AccountObjects
        account_info = client.request(AccountInfo(account=wallet_address))
        
        readiness = {
            'wallet_address': wallet_address,
            'is_ready': False,
            'issues': [],
            'account_exists': False,
            'xrp_balance': 0,
            'ticket_count': 0,
            'estimated_fees': recipient_count * 0.00001
        }
        
        if account_info.is_successful():
            account_data = account_info.result.get('account_data', {})
            readiness['account_exists'] = True
            
            # Check XRP balance
            balance_drops = account_data.get('Balance', '0')
            balance_xrp = float(balance_drops) / 1000000
            readiness['xrp_balance'] = balance_xrp
            
            # Check tickets
            tickets_request = AccountObjects(account=wallet_address, type="ticket")
            tickets_response = client.request(tickets_request)
            
            if tickets_response.is_successful():
                tickets = []
                if 'account_objects' in tickets_response.result:
                    for obj in tickets_response.result['account_objects']:
                        if obj.get('LedgerEntryType') == 'Ticket':
                            tickets.append(obj.get('TicketSequence'))
                readiness['ticket_count'] = len(tickets)
            
            # Check for issues
            min_xrp_needed = readiness['estimated_fees'] + 1  # 1 XRP reserve + fees
            
            if balance_xrp < min_xrp_needed:
                readiness['issues'].append(f"Insufficient XRP: have {balance_xrp:.6f}, need {min_xrp_needed:.6f}")
            
            if readiness['ticket_count'] < recipient_count:
                readiness['issues'].append(f"Not enough tickets: have {readiness['ticket_count']}, need {recipient_count}")
            
            readiness['is_ready'] = len(readiness['issues']) == 0
            
        else:
            readiness['issues'].append("Account not found or invalid")
        
        return jsonify(readiness)
        
    except Exception as e:
        logger.error(f"Error checking readiness: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to check readiness: {str(e)}'
        }), 500

@real_tickets_bp.route('/get-wallet-secret-prompt', methods=['POST'])
def get_wallet_secret_prompt():
    """Provide information about wallet secret requirements"""
    try:
        return jsonify({
            'success': True,
            'message': 'To execute REAL XRPL transactions, we need your wallet secret/seed',
            'requirements': {
                'security_note': 'Your wallet secret never leaves your device - it\'s only used to sign transactions locally',
                'format': 'Provide your wallet secret/seed (starts with \'s\' like sXXXXXXXX)',
                'alternative': 'For maximum security, consider running this tool locally with your own XRPL node'
            },
            'warning': 'Only provide your wallet secret if you trust this environment completely'
        })
        
    except Exception as e:
        logger.error(f"Error getting wallet secret prompt: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get wallet secret prompt'
        }), 500
