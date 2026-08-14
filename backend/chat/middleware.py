"""
WebSocket JWT authentication middleware for Django Channels 4.x.

Strategy: the JWT is NOT accepted from the query string (which leaks into
server access logs). Instead, the consumer accepts an unauthenticated
connection and expects the first WebSocket message from the client to be:

    {"type": "authenticate", "token": "<JWT>"}

The consumer then resolves the user and either proceeds or closes with 4001.

This file only provides the JWTAuthMiddleware that PASSES the scope through
without reading any query params — authentication is fully delegated to the
consumer via the initial message handshake. The middleware sets scope["user"]
to AnonymousUser; the consumer upgrades it after auth.
"""

from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Channels middleware that sets scope['user'] = AnonymousUser.

    Auth is completed by the consumer via the first 'authenticate' message
    sent from the client right after connect(), avoiding token-in-query-string
    log leakage.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Deliberately do NOT read token from query string.
        scope['user'] = AnonymousUser()
        return await self.inner(scope, receive, send)
