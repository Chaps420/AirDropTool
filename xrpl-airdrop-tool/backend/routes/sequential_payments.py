from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.xrpl_service import XRPLService
import logging
from xrpl.models.transactions import Payment
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.wallet import Wallet
from xrpl.transaction import autofill, sign_and_submit
import time

logger = logging.getLogger(__name__)

sequential_payments_bp = Blueprint('sequential_payments', __name__)
CORS(sequential_payments_bp)

@sequential_payments_bp.route('/execute-sequential-payments', methods=['POST'])
def execute_sequential_payments():
    """Execute sequential payments automatically using wallet secret"""
    try:
        data = request.get_json()
        wallet_secret = data.get('wallet_secret')
        
        # Support both old format (recipients + amount_per_recipient) and new format (recipient_amounts)
        recipient_amounts = data.get('recipient_amounts')
        if recipient_amounts:
            # New enhanced distribution format: [{'address': 'rXXX', 'amount': '10'}, ...]
            recipients_data = recipient_amounts
        else:
            # Legacy format: recipients list + single amount_per_recipient
            recipients_list = data.get('recipients', [])
            amount_per_recipient = data.get('amount_per_recipient')
            recipients_data = [{'address': r if isinstance(r, str) else r.get('address', r), 'amount': amount_per_recipient} for r in recipients_list]
            
        currency = data.get('currency')
        issuer = data.get('issuer')
        network = data.get('network', 'mainnet')
        
        # Validation
        if not all([wallet_secret, recipients_data, currency]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        if not recipients_data:
            return jsonify({'error': 'No recipients provided'}), 400
        
        logger.info(f"Starting sequential payments for {len(recipients_data)} recipients")
        logger.info(f"Recipients data received: {recipients_data}")
        logger.info(f"Currency: {currency}")
        logger.info(f"Issuer: {issuer}")
        logger.info(f"Network: {network}")
        logger.info(f"Wallet secret provided: {'YES' if wallet_secret else 'NO'}")
        
        # Initialize XRPL service
        xrpl_service = XRPLService(network)
        client = xrpl_service.client
        
        # Create wallet from secret
        try:
            wallet = Wallet.from_seed(wallet_secret)
            logger.info(f"Wallet created successfully: {wallet.classic_address}")
        except Exception as e:
            logger.error(f"Failed to create wallet from secret: {str(e)}")
            return jsonify({'error': f'Invalid wallet secret: {str(e)}'}), 400
        
        logger.info(f"Executing payments from wallet: {wallet.classic_address}")
        
        results = []
        success_count = 0
        
        for i, recipient_data in enumerate(recipients_data):
            try:
                recipient_address = recipient_data['address']
                amount_for_recipient = recipient_data['amount']
                
                logger.info(f"Processing payment {i + 1}/{len(recipients_data)} to {recipient_address} amount: {amount_for_recipient}")
                
                # Create payment transaction
                if currency == 'XRP':
                    # XRP payment (in drops)
                    amount_drops = str(int(float(amount_for_recipient) * 1000000))
                    logger.info(f"Creating XRP payment: {amount_drops} drops")
                    payment = Payment(
                        account=wallet.classic_address,
                        destination=recipient_address,
                        amount=amount_drops
                    )
                else:
                    # Token payment
                    logger.info(f"Creating token payment: {amount_for_recipient} {currency}")
                    payment = Payment(
                        account=wallet.classic_address,
                        destination=recipient_address,
                        amount=IssuedCurrencyAmount(
                            currency=currency,
                            value=str(amount_for_recipient),
                            issuer=issuer
                        )
                    )
                
                logger.info(f"Payment object created: {payment}")
                
                # Autofill and submit transaction
                logger.info("Autofilling transaction...")
                payment = autofill(payment, client)
                logger.info(f"Transaction autofilled: {payment}")
                
                logger.info("Submitting transaction...")
                response = sign_and_submit(payment, client, wallet)
                logger.info(f"Transaction response: {response}")
                
                if response.is_successful():
                    tx_hash = response.result.get('hash')
                    success_count += 1
                    results.append({
                        'recipient': recipient_address,
                        'amount': amount_for_recipient,
                        'success': True,
                        'tx_hash': tx_hash,
                        'sequence': i + 1
                    })
                    logger.info(f"Payment {i + 1} successful: {tx_hash}")
                else:
                    error_msg = response.result.get('engine_result_message', 'Unknown error')
                    error_code = response.result.get('engine_result', 'Unknown')
                    logger.error(f"Payment {i + 1} failed: {error_code} - {error_msg}")
                    results.append({
                        'recipient': recipient_address,
                        'amount': amount_for_recipient,
                        'success': False,
                        'error': f"{error_code}: {error_msg}",
                        'sequence': i + 1
                    })
                
                # Small delay between transactions to avoid rate limits
                if i < len(recipients_data) - 1:
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error processing payment {i + 1}: {str(e)}")
                results.append({
                    'recipient': recipient_address,
                    'amount': amount_for_recipient,
                    'success': False,
                    'error': str(e),
                    'sequence': i + 1
                })
        
        # Calculate total amount distributed for successful payments
        total_amount_distributed = sum(float(result['amount']) for result in results if result['success'])
        
        logger.info(f"Sequential payments completed: {success_count}/{len(recipients_data)} successful")
        
        return jsonify({
            'success': True,
            'message': f'Sequential payments completed: {success_count}/{len(recipients_data)} successful',
            'results': results,
            'summary': {
                'total_payments': len(recipients_data),
                'successful_payments': success_count,
                'failed_payments': len(recipients_data) - success_count,
                'total_amount_distributed': total_amount_distributed,
                'currency': currency
            }
        })
        
    except Exception as e:
        logger.error(f"Error in sequential payments execution: {str(e)}")
        return jsonify({'error': str(e)}), 500
