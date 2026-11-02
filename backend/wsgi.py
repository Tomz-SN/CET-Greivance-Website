"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.
Also exposes ``app`` for Vercel serverless functions.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
app = application
