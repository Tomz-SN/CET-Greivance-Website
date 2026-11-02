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

# Auto-initialize database on Vercel serverless cold-start
if os.environ.get('VERCEL') == '1':
    try:
        from django.core.management import call_command
        call_command('migrate', interactive=False)
        from django.contrib.auth.models import User
        if not User.objects.filter(username='admin').exists():
            import seed_demo_data
            seed_demo_data.seed()
    except Exception as e:
        print("Vercel DB init warning:", e)
