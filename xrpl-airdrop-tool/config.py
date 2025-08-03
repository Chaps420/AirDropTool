import os
from typing import Dict, Any

class Config:
    """Application configuration."""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Xaman API configuration
    XAMAN_API_KEY = os.environ.get('XAMAN_API_KEY', '335efd5b-f1c8-450e-b844-bd26b8c223f0')
    XAMAN_API_SECRET = os.environ.get('XAMAN_API_SECRET', '5715a322-ff36-4c80-bc42-e7ccf0c0225d')
    
    # XRPL Network configuration
    XRPL_NETWORKS = {
        'testnet': {
            'name': 'Testnet',
            'server_url': 'https://s.altnet.rippletest.net:51234',
            'websocket_url': 'wss://s.altnet.rippletest.net:51233',
            'explorer_url': 'https://testnet.xrpl.org'
        },
        'mainnet': {
            'name': 'Mainnet',
            'server_url': 'https://xrplcluster.com',
            'websocket_url': 'wss://xrplcluster.com',
            'explorer_url': 'https://xrpl.org'
        }
    }
    
    # Default network
    DEFAULT_NETWORK = os.environ.get('DEFAULT_NETWORK', 'testnet')
    
    # API configuration
    API_VERSION = '1.0.0'
    MAX_RECIPIENTS_PER_AIRDROP = int(os.environ.get('MAX_RECIPIENTS_PER_AIRDROP', '1000'))
    MAX_REQUEST_SIZE = int(os.environ.get('MAX_REQUEST_SIZE', '16777216'))  # 16MB
    
    # Rate limiting
    RATE_LIMIT_PER_SECOND = int(os.environ.get('RATE_LIMIT_PER_SECOND', '1'))
    TRANSACTION_DELAY_SECONDS = float(os.environ.get('TRANSACTION_DELAY_SECONDS', '1.0'))
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Security configuration
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,file://').split(',')
    
    # Server configuration
    HOST = os.environ.get('HOST', '127.0.0.1')
    PORT = int(os.environ.get('PORT', '5000'))
    
    # Feature flags
    ENABLE_TRANSACTION_HISTORY = os.environ.get('ENABLE_TRANSACTION_HISTORY', 'False').lower() == 'true'
    ENABLE_BATCH_VALIDATION = os.environ.get('ENABLE_BATCH_VALIDATION', 'True').lower() == 'true'
    ENABLE_DETAILED_LOGGING = os.environ.get('ENABLE_DETAILED_LOGGING', 'True').lower() == 'true'
    
    # Wallet validation
    MIN_XRP_RESERVE = float(os.environ.get('MIN_XRP_RESERVE', '10.0'))
    MIN_TOKEN_AMOUNT = float(os.environ.get('MIN_TOKEN_AMOUNT', '0.000001'))
    MAX_TOKEN_AMOUNT = float(os.environ.get('MAX_TOKEN_AMOUNT', '100000000000'))
    
    # Task management
    TASK_CLEANUP_AFTER_HOURS = int(os.environ.get('TASK_CLEANUP_AFTER_HOURS', '24'))
    MAX_CONCURRENT_TASKS = int(os.environ.get('MAX_CONCURRENT_TASKS', '5'))
    
    @classmethod
    def get_network_config(cls, network: str) -> Dict[str, Any]:
        """Get configuration for a specific network."""
        if network not in cls.XRPL_NETWORKS:
            raise ValueError(f"Unsupported network: {network}")
        return cls.XRPL_NETWORKS[network]
    
    @classmethod
    def validate_network(cls, network: str) -> bool:
        """Validate if network is supported."""
        return network in cls.XRPL_NETWORKS
    
    @classmethod
    def get_all_networks(cls) -> list:
        """Get list of all supported networks."""
        return list(cls.XRPL_NETWORKS.keys())

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    ENABLE_DETAILED_LOGGING = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    ENABLE_DETAILED_LOGGING = False
    MIN_XRP_RESERVE = 20.0  # Higher reserve for production

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    DEFAULT_NETWORK = 'testnet'
    MAX_RECIPIENTS_PER_AIRDROP = 10  # Smaller limit for testing

# Configuration mapping
config_mapping = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name: str = None) -> Config:
    """Get configuration based on environment."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    return config_mapping.get(config_name, DevelopmentConfig)

# Export commonly used values for direct import
_config = get_config()
XAMAN_API_KEY = _config.XAMAN_API_KEY
XAMAN_API_SECRET = _config.XAMAN_API_SECRET
