from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sys
import os
import requests
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.xrpl_ticket_service import ticket_manager
import logging

logger = logging.getLogger(__name__)

# Xaman API credentials
XAMAN_API_KEY = '335efd5b-f1c8-450e-b844-bd26b8c223f0'
XAMAN_API_SECRET = '5715a322-ff36-4c80-bc42-e7ccf0c0225d'
XAMAN_BASE_URL = 'https://xumm.app/api/v1/platform'

enhanced_real_tickets_bp = Blueprint('enhanced_real_tickets', __name__)
CORS(enhanced_real_tickets_bp)

@enhanced_real_tickets_bp.route('/validate-readiness', methods=['POST'])
def validate_readiness():
    """Validate account readiness for ticket-based airdrop"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        recipients_count = data.get('recipients_count')
        
        if not wallet_address or not recipients_count:
            return jsonify({'error': 'Missing wallet_address or recipients_count'}), 400
        
        result = ticket_manager.validate_account_readiness(wallet_address, recipients_count)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error validating readiness: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_real_tickets_bp.route('/create-tickets', methods=['POST'])
def create_tickets():
    """Create tickets via Xaman payload"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        ticket_count = data.get('ticket_count')
        
        if not wallet_address or not ticket_count:
            return jsonify({'error': 'Missing wallet_address or ticket_count'}), 400
        
        # Create TicketCreate transaction
        ticket_transaction = {
            'TransactionType': 'TicketCreate',
            'Account': wallet_address,
            'TicketCount': ticket_count
        }
        
        # Create Xaman payload
        payload_data = {
            'txjson': ticket_transaction,
            'custom_meta': {
                'instruction': f'Create {ticket_count} tickets for airdrop execution',
                'blob_info': f'This will create {ticket_count} transaction tickets for batch processing'
            }
        }
        
        # Make request to Xaman API
        headers = {
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{XAMAN_BASE_URL}/payload',
            json=payload_data,
            headers=headers
        )
        
        if response.status_code == 200:
            payload_response = response.json()
            return jsonify({
                'success': True,
                'payload_uuid': payload_response['uuid'],
                'qr_url': payload_response['refs']['qr_png'],
                'message': f'Ticket creation payload ready'
            })
        else:
            logger.error(f"Xaman API error: {response.status_code} - {response.text}")
            return jsonify({'success': False, 'error': 'Failed to create Xaman payload'}), 500
            
    except Exception as e:
        logger.error(f"Error creating tickets: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_real_tickets_bp.route('/check-ticket-payload/<payload_uuid>', methods=['GET'])
def check_ticket_payload(payload_uuid):
    """Check the status of a ticket creation payload"""
    try:
        headers = {
            'X-API-Key': XAMAN_API_KEY,
            'X-API-Secret': XAMAN_API_SECRET,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{XAMAN_BASE_URL}/payload/{payload_uuid}',
            headers=headers
        )
        
        if response.status_code == 200:
            payload_data = response.json()
            
            if payload_data.get('meta', {}).get('signed', False):
                # Payload was signed successfully
                tx_hash = payload_data.get('response', {}).get('txid')
                return jsonify({
                    'success': True,
                    'signed': True,
                    'txid': tx_hash,
                    'message': 'Tickets created successfully'
                })
            elif payload_data.get('meta', {}).get('cancelled', False):
                return jsonify({
                    'success': False,
                    'signed': False,
                    'cancelled': True,
                    'message': 'Ticket creation was cancelled'
                })
            else:
                return jsonify({
                    'success': False,
                    'signed': False,
                    'pending': True,
                    'message': 'Waiting for signature'
                })
        else:
            logger.error(f"Error checking payload: {response.status_code} - {response.text}")
            return jsonify({'error': 'Failed to check payload status'}), 500
            
    except Exception as e:
        logger.error(f"Error checking ticket payload: {str(e)}")
        return jsonify({'error': str(e)}), 500@enhanced_real_tickets_bp.route('/execute-airdrop', methods=['POST'])
def execute_airdrop():
    """Execute airdrop using tickets with direct XRPL submission"""
    try:
        data = request.get_json()
        wallet_secret = data.get('wallet_secret')
        recipients = data.get('recipients', [])
        token_amount = data.get('token_amount')
        token_currency = data.get('token_currency')
        token_issuer = data.get('token_issuer')
        ticket_sequences = data.get('ticket_sequences', [])
        
        # Validation
        if not all([wallet_secret, recipients, token_amount, token_currency]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        if not ticket_sequences:
            return jsonify({'error': 'No ticket sequences provided'}), 400
        
        if len(recipients) > len(ticket_sequences):
            return jsonify({'error': 'Not enough tickets for all recipients'}), 400
        
        # Execute the airdrop
        result = ticket_manager.create_ticket_payments(
            wallet_secret, 
            recipients, 
            token_amount, 
            token_currency, 
            token_issuer, 
            ticket_sequences
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error executing airdrop: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_real_tickets_bp.route('/get-account-tickets', methods=['POST'])
def get_account_tickets():
    """Get available tickets for an account"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return jsonify({'error': 'Missing wallet_address'}), 400
        
        tickets = ticket_manager.get_account_tickets(wallet_address)
        return jsonify({
            'success': True,
            'tickets': tickets,
            'count': len(tickets)
        })
        
    except Exception as e:
        logger.error(f"Error getting account tickets: {str(e)}")
        return jsonify({'error': str(e)}), 500
