from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime

@dataclass
class Token:
    """Represents a token holding in an XRPL wallet."""
    currency: str
    issuer: str
    value: float
    limit: float = 0.0
    quality_in: int = 0
    quality_out: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert token to dictionary."""
        return {
            'currency': self.currency,
            'issuer': self.issuer,
            'value': self.value,
            'limit': self.limit,
            'quality_in': self.quality_in,
            'quality_out': self.quality_out
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Token':
        """Create token from dictionary."""
        return cls(
            currency=data['currency'],
            issuer=data['issuer'],
            value=float(data['value']),
            limit=float(data.get('limit', 0)),
            quality_in=int(data.get('quality_in', 0)),
            quality_out=int(data.get('quality_out', 0))
        )

@dataclass
class WalletInfo:
    """Represents comprehensive wallet information."""
    address: str
    xrp_balance: float
    sequence: int
    network: str
    tokens: List[Token] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert wallet info to dictionary."""
        return {
            'address': self.address,
            'xrp_balance': self.xrp_balance,
            'sequence': self.sequence,
            'network': self.network,
            'tokens': [token.to_dict() for token in self.tokens],
            'last_updated': self.last_updated.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WalletInfo':
        """Create wallet info from dictionary."""
        tokens = [Token.from_dict(token_data) for token_data in data.get('tokens', [])]
        
        return cls(
            address=data['address'],
            xrp_balance=float(data['xrp_balance']),
            sequence=int(data['sequence']),
            network=data['network'],
            tokens=tokens,
            last_updated=datetime.fromisoformat(data.get('last_updated', datetime.utcnow().isoformat()))
        )
    
    def get_token(self, currency: str, issuer: str) -> Optional[Token]:
        """Get a specific token by currency and issuer."""
        for token in self.tokens:
            if token.currency == currency and token.issuer == issuer:
                return token
        return None
    
    def has_sufficient_token_balance(self, currency: str, issuer: str, required_amount: float) -> bool:
        """Check if wallet has sufficient balance for a specific token."""
        token = self.get_token(currency, issuer)
        if not token:
            return False
        return token.value >= required_amount
    
    def has_sufficient_xrp_for_fees(self, estimated_fees: float, reserve_amount: float = 10.0) -> bool:
        """Check if wallet has sufficient XRP for transaction fees."""
        return self.xrp_balance >= (estimated_fees + reserve_amount)

@dataclass
class AirdropRecipient:
    """Represents a recipient in an airdrop."""
    address: str
    amount: float
    currency: str
    issuer: str
    status: str = 'pending'  # pending, success, failed
    tx_hash: Optional[str] = None
    error_message: Optional[str] = None
    processed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert recipient to dictionary."""
        return {
            'address': self.address,
            'amount': self.amount,
            'currency': self.currency,
            'issuer': self.issuer,
            'status': self.status,
            'tx_hash': self.tx_hash,
            'error_message': self.error_message,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AirdropRecipient':
        """Create recipient from dictionary."""
        processed_at = None
        if data.get('processed_at'):
            processed_at = datetime.fromisoformat(data['processed_at'])
        
        return cls(
            address=data['address'],
            amount=float(data['amount']),
            currency=data['currency'],
            issuer=data['issuer'],
            status=data.get('status', 'pending'),
            tx_hash=data.get('tx_hash'),
            error_message=data.get('error_message'),
            processed_at=processed_at
        )
    
    def mark_success(self, tx_hash: str):
        """Mark recipient as successfully processed."""
        self.status = 'success'
        self.tx_hash = tx_hash
        self.processed_at = datetime.utcnow()
        self.error_message = None
    
    def mark_failed(self, error_message: str):
        """Mark recipient as failed."""
        self.status = 'failed'
        self.error_message = error_message
        self.processed_at = datetime.utcnow()
        self.tx_hash = None

@dataclass
class AirdropTask:
    """Represents an airdrop task."""
    task_id: str
    source_wallet: str
    network: str
    token_currency: str
    token_issuer: str
    recipients: List[AirdropRecipient] = field(default_factory=list)
    status: str = 'pending'  # pending, running, completed, failed
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_amount: float = 0.0
    estimated_fees: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary."""
        return {
            'task_id': self.task_id,
            'source_wallet': self.source_wallet,
            'network': self.network,
            'token_currency': self.token_currency,
            'token_issuer': self.token_issuer,
            'recipients': [recipient.to_dict() for recipient in self.recipients],
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'total_amount': self.total_amount,
            'estimated_fees': self.estimated_fees
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AirdropTask':
        """Create task from dictionary."""
        recipients = [AirdropRecipient.from_dict(r) for r in data.get('recipients', [])]
        
        started_at = None
        if data.get('started_at'):
            started_at = datetime.fromisoformat(data['started_at'])
        
        completed_at = None
        if data.get('completed_at'):
            completed_at = datetime.fromisoformat(data['completed_at'])
        
        return cls(
            task_id=data['task_id'],
            source_wallet=data['source_wallet'],
            network=data['network'],
            token_currency=data['token_currency'],
            token_issuer=data['token_issuer'],
            recipients=recipients,
            status=data.get('status', 'pending'),
            created_at=datetime.fromisoformat(data['created_at']),
            started_at=started_at,
            completed_at=completed_at,
            total_amount=float(data.get('total_amount', 0)),
            estimated_fees=float(data.get('estimated_fees', 0))
        )
    
    def start(self):
        """Mark task as started."""
        self.status = 'running'
        self.started_at = datetime.utcnow()
    
    def complete(self):
        """Mark task as completed."""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
    
    def fail(self):
        """Mark task as failed."""
        self.status = 'failed'
        self.completed_at = datetime.utcnow()
    
    def get_progress(self) -> Dict[str, Any]:
        """Get progress information."""
        total = len(self.recipients)
        completed = len([r for r in self.recipients if r.status in ['success', 'failed']])
        successful = len([r for r in self.recipients if r.status == 'success'])
        failed = len([r for r in self.recipients if r.status == 'failed'])
        
        return {
            'total': total,
            'completed': completed,
            'successful': successful,
            'failed': failed,
            'percentage': (completed / total * 100) if total > 0 else 0,
            'status': self.status
        }
    
    def add_recipient(self, address: str, amount: float):
        """Add a recipient to the airdrop."""
        recipient = AirdropRecipient(
            address=address,
            amount=amount,
            currency=self.token_currency,
            issuer=self.token_issuer
        )
        self.recipients.append(recipient)
        self.total_amount += amount
    
    def get_pending_recipients(self) -> List[AirdropRecipient]:
        """Get list of pending recipients."""
        return [r for r in self.recipients if r.status == 'pending']
    
    def get_successful_recipients(self) -> List[AirdropRecipient]:
        """Get list of successfully processed recipients."""
        return [r for r in self.recipients if r.status == 'success']
    
    def get_failed_recipients(self) -> List[AirdropRecipient]:
        """Get list of failed recipients."""
        return [r for r in self.recipients if r.status == 'failed']
