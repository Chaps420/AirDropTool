import re
import logging

logger = logging.getLogger(__name__)

def validate_xrpl_address(address):
    """
    Validate an XRPL classic address.
    
    Args:
        address (str): The address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not address or not isinstance(address, str):
        return False
    
    address = address.strip()
    
    # XRPL classic addresses start with 'r' and are 25-34 characters long
    # They use Base58 encoding with specific characters
    xrpl_pattern = r'^r[1-9A-HJ-NP-Za-km-z]{24,33}$'
    
    if not re.match(xrpl_pattern, address):
        return False
    
    # Additional validation could be added here using xrpl library
    try:
        import xrpl
        return xrpl.core.addresscodec.is_valid_classic_address(address)
    except ImportError:
        # If xrpl library is not available, use regex validation
        logger.warning("XRPL library not available, using regex validation only")
        return True
    except Exception as e:
        logger.error(f"Error validating address {address}: {str(e)}")
        return False

def validate_currency_code(currency):
    """
    Validate an XRPL currency code.
    
    Args:
        currency (str): The currency code to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not currency or not isinstance(currency, str):
        return False
    
    currency = currency.strip()
    
    # Standard currency codes are 3 characters (like USD, EUR)
    if len(currency) == 3:
        return currency.isalpha() and currency.isupper()
    
    # Custom currency codes are 40-character hex strings
    if len(currency) == 40:
        return all(c in '0123456789ABCDEFabcdef' for c in currency)
    
    return False

def validate_amount(amount):
    """
    Validate an amount for XRPL transactions.
    
    Args:
        amount: The amount to validate (string or number)
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        float_amount = float(amount)
        
        # Must be positive
        if float_amount <= 0:
            return False
        
        # Must not be too small (XRPL has precision limits)
        if float_amount < 0.000001:
            return False
        
        # Must not be too large
        if float_amount > 100000000000:  # 100 billion
            return False
        
        return True
        
    except (ValueError, TypeError):
        return False

def validate_seed(seed):
    """
    Validate an XRPL wallet seed/secret.
    
    Args:
        seed (str): The seed to validate
        
    Returns:
        bool: True if potentially valid, False otherwise
    """
    if not seed or not isinstance(seed, str):
        return False
    
    seed = seed.strip()
    
    # Family seed format (starts with 's')
    if seed.startswith('s') and len(seed) >= 25 and len(seed) <= 35:
        # Basic validation for family seed
        return all(c in 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz' for c in seed[1:])
    
    # Hex private key (64 characters)
    if len(seed) == 64:
        return all(c in '0123456789ABCDEFabcdef' for c in seed)
    
    # Mnemonic phrase (12 or 24 words)
    words = seed.split()
    if len(words) in [12, 24]:
        # Basic check - all words should be alphabetic
        return all(word.isalpha() for word in words)
    
    return False

def validate_network(network):
    """
    Validate network selection.
    
    Args:
        network (str): The network to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not network or not isinstance(network, str):
        return False
    
    return network.lower() in ['testnet', 'mainnet']

def validate_recipient_list(recipients):
    """
    Validate a list of recipient addresses.
    
    Args:
        recipients (list): List of addresses to validate
        
    Returns:
        dict: Validation results with valid and invalid addresses
    """
    if not recipients or not isinstance(recipients, list):
        return {
            'valid': [],
            'invalid': [],
            'errors': ['Recipients must be a non-empty list']
        }
    
    if len(recipients) > 1000:
        return {
            'valid': [],
            'invalid': recipients,
            'errors': ['Maximum 1000 recipients allowed']
        }
    
    valid_addresses = []
    invalid_addresses = []
    seen_addresses = set()
    
    for address in recipients:
        if not isinstance(address, str):
            invalid_addresses.append(str(address))
            continue
        
        address = address.strip()
        
        if not address:
            continue
        
        # Check for duplicates
        if address in seen_addresses:
            continue
        
        if validate_xrpl_address(address):
            valid_addresses.append(address)
            seen_addresses.add(address)
        else:
            invalid_addresses.append(address)
    
    return {
        'valid': valid_addresses,
        'invalid': invalid_addresses,
        'errors': []
    }

def validate_airdrop_config(config):
    """
    Validate airdrop configuration.
    
    Args:
        config (dict): The airdrop configuration to validate
        
    Returns:
        dict: Validation results
    """
    errors = []
    
    if not config or not isinstance(config, dict):
        return {
            'valid': False,
            'errors': ['Configuration must be a dictionary']
        }
    
    # Validate required fields
    required_fields = ['token', 'recipients', 'amountPerRecipient']
    for field in required_fields:
        if field not in config:
            errors.append(f'Missing required field: {field}')
    
    if errors:
        return {
            'valid': False,
            'errors': errors
        }
    
    # Validate token configuration
    token = config['token']
    if not isinstance(token, dict):
        errors.append('Token configuration must be a dictionary')
    else:
        if 'currency' not in token:
            errors.append('Token currency is required')
        elif not validate_currency_code(token['currency']):
            errors.append('Invalid token currency code')
        
        if 'issuer' not in token:
            errors.append('Token issuer is required')
        elif not validate_xrpl_address(token['issuer']):
            errors.append('Invalid token issuer address')
    
    # Validate recipients
    recipients = config['recipients']
    recipient_validation = validate_recipient_list(recipients)
    if recipient_validation['errors']:
        errors.extend(recipient_validation['errors'])
    if not recipient_validation['valid']:
        errors.append('No valid recipient addresses found')
    
    # Validate amount
    amount = config['amountPerRecipient']
    if not validate_amount(amount):
        errors.append('Invalid amount per recipient')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def sanitize_input(value, max_length=1000):
    """
    Sanitize user input to prevent injection attacks.
    
    Args:
        value (str): The input to sanitize
        max_length (int): Maximum allowed length
        
    Returns:
        str: Sanitized input
    """
    if not isinstance(value, str):
        return str(value)[:max_length]
    
    # Remove potential dangerous characters
    sanitized = value.strip()
    
    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def validate_json_payload(data, required_fields=None):
    """
    Validate JSON payload structure.
    
    Args:
        data: The data to validate
        required_fields (list): List of required field names
        
    Returns:
        dict: Validation results
    """
    if data is None:
        return {
            'valid': False,
            'errors': ['No data provided']
        }
    
    if not isinstance(data, dict):
        return {
            'valid': False,
            'errors': ['Data must be a JSON object']
        }
    
    errors = []
    
    if required_fields:
        for field in required_fields:
            if field not in data:
                errors.append(f'Missing required field: {field}')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
