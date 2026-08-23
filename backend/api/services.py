from .models import UserItemInteraction

TYPE_WEIGHTS = {'view': 0.5, 'save': 2.0, 'offer_sent': 3.0, 'traded': 5.0, 'hidden': -3.0}

def log_interaction(user, item, interaction_type):
    if not user.is_authenticated:
        return
    weight = TYPE_WEIGHTS.get(interaction_type, 1.0)
    UserItemInteraction.objects.create(user=user, item=item, interaction_type=interaction_type, weight=weight)
