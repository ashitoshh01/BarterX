import os
from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'
    path = os.path.dirname(os.path.abspath(__file__))
