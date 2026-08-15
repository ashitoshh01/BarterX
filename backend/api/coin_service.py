import logging
from django.db import transaction
from django.utils import timezone
from .models import UserProfile, WalletTransaction, TradeCoinReservation
from chat.services import broadcast_to_group

logger = logging.getLogger(__name__)

def broadcast_wallet_update(user):
    """Sends a WebSocket wallet update event to the user's personal channel."""
    try:
        profile = user.profile
        broadcast_to_group(f"user_{user.id}", "wallet_updated", {
            "available_balance": profile.coin_balance,
            "reserved_balance": profile.coin_reserved,
            "total_earned": profile.total_coins_earned,
            "total_spent": profile.total_coins_spent,
            "total_purchased": profile.total_coins_purchased,
            "timestamp": timezone.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to broadcast wallet update: {e}")

def reserve_coins_for_proposal(proposal):
    """
    Reserves coins for an accepted proposal.
    If coins_offered > 0: requester pays receiver. Reserve from requester.
    If coins_offered < 0: receiver pays requester. Reserve from receiver.
    """
    coins = proposal.coins_offered
    if coins == 0:
        return True

    with transaction.atomic():
        if coins > 0:
            payer = proposal.requester
            amount = coins
        else:
            payer = proposal.receiver
            amount = abs(coins)

        profile = payer.profile
        if profile.coin_balance < amount:
            raise ValueError(f"User {payer.username} has insufficient balance to reserve {amount} coins.")

        # Update profile balances
        profile.coin_balance -= amount
        profile.coin_reserved += amount
        profile.save(update_fields=['coin_balance', 'coin_reserved'])

        # Create reservation record
        res = TradeCoinReservation.objects.create(
            proposal=proposal,
            user=payer,
            amount=amount,
            status='RESERVED'
        )

        # Create ledger transaction
        WalletTransaction.objects.create(
            user=payer,
            amount=-amount,
            transaction_type='TRADE_PAYMENT',
            status='PENDING',
            reference_id=str(proposal.id),
            description=f"Coins reserved for swap #{proposal.id} (Item: {proposal.requested_item.title})"
        )

        broadcast_wallet_update(payer)
        logger.info(f"Reserved {amount} coins from {payer.username} for proposal {proposal.id}")
        return True

def release_coins_for_proposal(proposal):
    """
    Releases reserved coins back to the payer because proposal/trade was cancelled/declined.
    """
    reservations = TradeCoinReservation.objects.filter(proposal=proposal, status='RESERVED')
    if not reservations.exists():
        return True

    with transaction.atomic():
        for res in reservations:
            payer = res.user
            amount = res.amount
            profile = payer.profile

            # Restore balances
            profile.coin_balance += amount
            profile.coin_reserved = max(0, profile.coin_reserved - amount)
            profile.save(update_fields=['coin_balance', 'coin_reserved'])

            # Update reservation status
            res.status = 'RELEASED'
            res.save(update_fields=['status'])

            # Create Refund ledger entry
            WalletTransaction.objects.create(
                user=payer,
                amount=amount,
                transaction_type='REFUND',
                status='SUCCESS',
                reference_id=str(proposal.id),
                description=f"Released reserved coins from swap #{proposal.id}"
            )

            broadcast_wallet_update(payer)
            logger.info(f"Released {amount} coins back to {payer.username} for proposal {proposal.id}")
        return True

def transfer_coins_for_trade(trade):
    """
    Finalizes the trade coin transfer when trade is completed.
    """
    proposal = trade.proposal
    if not proposal:
        return True

    reservations = TradeCoinReservation.objects.filter(proposal=proposal, status='RESERVED')
    if not reservations.exists():
        # Fallback if coins were not reserved but offered (legacy compatibility)
        coins = proposal.coins_offered
        if coins == 0:
            return True
        # Direct transfer fallback
        with transaction.atomic():
            if coins > 0:
                payer = proposal.requester
                payee = proposal.receiver
                amount = coins
            else:
                payer = proposal.receiver
                payee = proposal.requester
                amount = abs(coins)
            
            payer_prof = payer.profile
            payee_prof = payee.profile

            payer_prof.coin_balance = max(0, payer_prof.coin_balance - amount)
            payer_prof.total_coins_spent += amount
            payer_prof.save(update_fields=['coin_balance', 'total_coins_spent'])

            payee_prof.coin_balance += amount
            payee_prof.total_coins_earned += amount
            payee_prof.save(update_fields=['coin_balance', 'total_coins_earned'])

            # Ledger entry for payer
            WalletTransaction.objects.create(
                user=payer,
                amount=-amount,
                transaction_type='TRADE_PAYMENT',
                status='SUCCESS',
                reference_id=str(trade.id),
                description=f"Coins transferred for completed swap #{proposal.id}"
            )

            # Ledger entry for payee
            WalletTransaction.objects.create(
                user=payee,
                amount=amount,
                transaction_type='TRADE_RECEIPT',
                status='SUCCESS',
                reference_id=str(trade.id),
                description=f"Coins received for completed swap #{proposal.id}"
            )

            broadcast_wallet_update(payer)
            broadcast_wallet_update(payee)
            return True

    with transaction.atomic():
        for res in reservations:
            payer = res.user
            amount = res.amount
            payee = proposal.receiver if payer == proposal.requester else proposal.requester

            payer_prof = payer.profile
            payee_prof = payee.profile

            # Update profiles
            payer_prof.coin_reserved = max(0, payer_prof.coin_reserved - amount)
            payer_prof.total_coins_spent += amount
            payer_prof.save(update_fields=['coin_reserved', 'total_coins_spent'])

            payee_prof.coin_balance += amount
            payee_prof.total_coins_earned += amount
            payee_prof.save(update_fields=['coin_balance', 'total_coins_earned'])

            # Update reservation
            res.trade = trade
            res.status = 'TRANSFERRED'
            res.save(update_fields=['trade', 'status'])

            # Update existing pending transaction status
            pending_tx = WalletTransaction.objects.filter(
                user=payer,
                reference_id=str(proposal.id),
                transaction_type='TRADE_PAYMENT',
                status='PENDING'
            ).first()
            if pending_tx:
                pending_tx.status = 'SUCCESS'
                pending_tx.save(update_fields=['status'])
            else:
                WalletTransaction.objects.create(
                    user=payer,
                    amount=-amount,
                    transaction_type='TRADE_PAYMENT',
                    status='SUCCESS',
                    reference_id=str(trade.id),
                    description=f"Coins transferred for completed swap #{proposal.id}"
                )

            # Create receiver transaction
            WalletTransaction.objects.create(
                user=payee,
                amount=amount,
                transaction_type='TRADE_RECEIPT',
                status='SUCCESS',
                reference_id=str(trade.id),
                description=f"Coins received for completed swap #{proposal.id}"
            )

            broadcast_wallet_update(payer)
            broadcast_wallet_update(payee)
            logger.info(f"Transferred {amount} coins from {payer.username} to {payee.username} for trade {trade.id}")
        return True
