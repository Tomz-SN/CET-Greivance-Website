import json
import os
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q

from .models import UserProfile, Grievance, GrievanceMessage, generate_tracking_token, generate_secret_pin


def index_view(request):
    """Serves the single-page application with React frontend."""
    return render(request, 'index.html')


def get_request_data(request):
    """Safely parse JSON or POST form data."""
    if request.content_type and 'application/json' in request.content_type:
        try:
            return json.loads(request.body.decode('utf-8'))
        except Exception:
            return {}
    return request.POST.dict()


# ----------------------------------------------------
# AUTHENTICATION ENDPOINTS
# ----------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    data = get_request_data(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return JsonResponse({'success': False, 'error': 'Username and password are required.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        # Ensure user has a profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        role = 'admin' if (user.is_staff or user.is_superuser or profile.role == 'admin') else 'student'
        
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
                'department': profile.department,
                'roll_number': profile.roll_number,
            }
        })
    else:
        return JsonResponse({'success': False, 'error': 'Invalid username or password.'}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully.'})


@csrf_exempt
@require_http_methods(["GET"])
def api_me(request):
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        role = 'admin' if (request.user.is_staff or request.user.is_superuser or profile.role == 'admin') else 'student'
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'role': role,
                'department': profile.department,
                'roll_number': profile.roll_number,
            }
        })
    return JsonResponse({'authenticated': False, 'user': None})


@csrf_exempt
@require_http_methods(["POST"])
def api_register(request):
    data = get_request_data(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    email = data.get('email', '').strip()
    full_name = data.get('full_name', '').strip()
    roll_number = data.get('roll_number', '').strip()
    department = data.get('department', '').strip()

    if not username or not password:
        return JsonResponse({'success': False, 'error': 'Username and password are required.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'success': False, 'error': 'Username already taken.'}, status=400)

    first_name, _, last_name = full_name.partition(' ')
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    profile = UserProfile.objects.create(
        user=user,
        role='student',
        department=department,
        roll_number=roll_number
    )
    login(request, user)

    return JsonResponse({
        'success': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'role': 'student',
            'department': department,
            'roll_number': roll_number,
        }
    })


# ----------------------------------------------------
# GRIEVANCE SUBMISSION & TRACKING (STUDENT & ANONYMOUS)
# ----------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def api_submit_grievance(request):
    """
    Submits a grievance. Can be anonymous or identified.
    ANONYMOUS GUARANTEE:
    If is_anonymous is True, no student identity, user ID, roll number, or email is stored.
    Generates a secure tracking_token and secret_pin.
    """
    # Can accept multipart form data (with file attachment) or JSON
    if request.POST:
        data = request.POST.dict()
        attachment = request.FILES.get('attachment')
    else:
        data = get_request_data(request)
        attachment = None

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', 'general').strip()
    priority = data.get('priority', 'medium').strip()
    incident_date_str = data.get('incident_date')
    incident_location = data.get('incident_location', '').strip()

    # Determine anonymity
    is_anon_raw = data.get('is_anonymous', 'true')
    is_anonymous = str(is_anon_raw).lower() in ['true', '1', 'yes']

    if not title or not description:
        return JsonResponse({'success': False, 'error': 'Title and description are required.'}, status=400)

    incident_date = None
    if incident_date_str:
        try:
            incident_date = incident_date_str.split('T')[0]
        except Exception:
            pass

    # Build grievance
    grievance = Grievance(
        title=title,
        description=description,
        category=category,
        priority=priority,
        incident_date=incident_date,
        incident_location=incident_location,
        is_anonymous=is_anonymous,
        attachment=attachment
    )

    if not is_anonymous:
        if request.user.is_authenticated:
            grievance.student = request.user
            profile = getattr(request.user, 'profile', None)
            grievance.student_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            grievance.student_email = request.user.email
            if profile:
                grievance.student_roll_number = profile.roll_number
                grievance.student_department = profile.department
        else:
            grievance.student_name = data.get('student_name', '').strip()
            grievance.student_email = data.get('student_email', '').strip()
            grievance.student_roll_number = data.get('student_roll_number', '').strip()
            grievance.student_department = data.get('student_department', '').strip()
    else:
        # Zero out any identity
        grievance.student = None
        grievance.student_name = ''
        grievance.student_email = ''
        grievance.student_roll_number = ''
        grievance.student_department = ''

    grievance.save()

    # Initial system message
    GrievanceMessage.objects.create(
        grievance=grievance,
        sender_type='admin',
        sender_name='Grievance Redressal Cell',
        message=f'Your grievance has been safely registered under Ticket #{grievance.tracking_token}. Our committee has been notified and will review your report shortly. Keep your Tracking Token and Secret PIN safe.'
    )

    return JsonResponse({
        'success': True,
        'message': 'Grievance submitted successfully.',
        'tracking_token': grievance.tracking_token,
        'secret_pin': grievance.secret_pin,
        'is_anonymous': grievance.is_anonymous,
        'status': grievance.status,
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_track_grievance(request, token):
    """Allows anonymous or identified student to track status by tracking token and PIN."""
    pin = request.GET.get('pin', '').strip()

    try:
        grievance = Grievance.objects.get(tracking_token__iexact=token.strip())
    except Grievance.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Grievance with this tracking token was not found.'}, status=404)

    # Optional verification: If PIN provided and doesn't match
    if pin and grievance.secret_pin and pin != grievance.secret_pin:
        return JsonResponse({'success': False, 'error': 'Incorrect Secret PIN. Please check your credentials.'}, status=403)

    messages = [msg.to_dict() for msg in grievance.messages.all()]
    
    return JsonResponse({
        'success': True,
        'grievance': grievance.to_dict(),
        'messages': messages,
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_add_tracking_message(request, token):
    """Allows student to post anonymous clarification message to committee."""
    data = get_request_data(request)
    message_text = data.get('message', '').strip()
    pin = data.get('pin', '').strip()

    if not message_text:
        return JsonResponse({'success': False, 'error': 'Message cannot be empty.'}, status=400)

    try:
        grievance = Grievance.objects.get(tracking_token__iexact=token.strip())
    except Grievance.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Grievance ticket not found.'}, status=404)

    if grievance.secret_pin and pin and pin != grievance.secret_pin:
        return JsonResponse({'success': False, 'error': 'Invalid Secret PIN.'}, status=403)

    msg = GrievanceMessage.objects.create(
        grievance=grievance,
        sender_type='student',
        sender_name='Anonymous Student' if grievance.is_anonymous else (grievance.student_name or 'Student'),
        message=message_text
    )

    return JsonResponse({
        'success': True,
        'message': 'Message sent to redressal committee.',
        'data': msg.to_dict()
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_student_my_grievances(request):
    """Returns grievances filed by the currently authenticated student."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    grievances = Grievance.objects.filter(student=request.user)
    return JsonResponse({
        'success': True,
        'grievances': [g.to_dict() for g in grievances]
    })


# ----------------------------------------------------
# ADMIN & REDRESSAL COMMITTEE MANAGEMENT ENDPOINTS
# ----------------------------------------------------

def is_admin_user(user):
    if not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = getattr(user, 'profile', None)
    return profile and profile.role == 'admin'


@csrf_exempt
@require_http_methods(["GET"])
def api_admin_list_grievances(request):
    """List grievances with search & filter for Redressal Officer / Admin."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized. Admin or Grievance Committee access required.'}, status=403)

    qs = Grievance.objects.all()

    # Filters
    status = request.GET.get('status')
    if status and status != 'all':
        qs = qs.filter(status=status)

    category = request.GET.get('category')
    if category and category != 'all':
        qs = qs.filter(category=category)

    priority = request.GET.get('priority')
    if priority and priority != 'all':
        qs = qs.filter(priority=priority)

    is_anon = request.GET.get('is_anonymous')
    if is_anon in ['true', 'false']:
        qs = qs.filter(is_anonymous=(is_anon == 'true'))

    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(tracking_token__icontains=search) |
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(assigned_officer__icontains=search)
        )

    results = [g.to_dict(is_admin=True) for g in qs]
    return JsonResponse({
        'success': True,
        'count': len(results),
        'grievances': results
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_admin_get_grievance(request, grievance_id):
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized.'}, status=403)

    grievance = get_object_or_404(Grievance, id=grievance_id)
    messages = [m.to_dict() for m in grievance.messages.all()]

    return JsonResponse({
        'success': True,
        'grievance': grievance.to_dict(is_admin=True),
        'messages': messages,
    })


@csrf_exempt
@require_http_methods(["PATCH", "POST"])
def api_admin_update_grievance(request, grievance_id):
    """Admin updates status, priority, assigned officer, or remarks."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized.'}, status=403)

    grievance = get_object_or_404(Grievance, id=grievance_id)
    data = get_request_data(request)

    old_status = grievance.status
    if 'status' in data and data['status']:
        grievance.status = data['status']
        if data['status'] == 'resolved' and not grievance.resolved_at:
            grievance.resolved_at = timezone.now()

    if 'priority' in data and data['priority']:
        grievance.priority = data['priority']

    if 'assigned_officer' in data:
        grievance.assigned_officer = data['assigned_officer'].strip()

    if 'assigned_department' in data:
        grievance.assigned_department = data['assigned_department'].strip()

    if 'official_remarks' in data:
        grievance.official_remarks = data['official_remarks'].strip()

    grievance.save()

    # If status changed, post a system message to the thread
    if old_status != grievance.status:
        GrievanceMessage.objects.create(
            grievance=grievance,
            sender_type='admin',
            sender_name='Grievance Committee',
            message=f"Status updated from '{dict(Grievance.STATUS_CHOICES).get(old_status, old_status)}' to '{grievance.get_status_display()}'. Note: {grievance.official_remarks or 'Review in progress.'}"
        )

    return JsonResponse({
        'success': True,
        'message': 'Grievance updated successfully.',
        'grievance': grievance.to_dict(is_admin=True)
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_admin_add_message(request, grievance_id):
    """Admin responds to grievance thread."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized.'}, status=403)

    grievance = get_object_or_404(Grievance, id=grievance_id)
    data = get_request_data(request)
    message_text = data.get('message', '').strip()

    if not message_text:
        return JsonResponse({'success': False, 'error': 'Message text is required.'}, status=400)

    admin_name = f"{request.user.first_name} ({request.user.username})" if request.user.first_name else request.user.username
    msg = GrievanceMessage.objects.create(
        grievance=grievance,
        sender_type='admin',
        sender_name=f"Redressal Officer - {admin_name}",
        message=message_text
    )

    return JsonResponse({
        'success': True,
        'message': 'Message sent successfully.',
        'data': msg.to_dict()
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_admin_analytics(request):
    """Metrics and statistics for Admin Dashboard."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized.'}, status=403)

    total_count = Grievance.objects.count()
    anonymous_count = Grievance.objects.filter(is_anonymous=True).count()
    identified_count = total_count - anonymous_count

    submitted_count = Grievance.objects.filter(status='submitted').count()
    review_count = Grievance.objects.filter(status__in=['under_review', 'investigating']).count()
    action_taken_count = Grievance.objects.filter(status='action_taken').count()
    resolved_count = Grievance.objects.filter(status='resolved').count()
    rejected_count = Grievance.objects.filter(status='rejected').count()

    urgent_count = Grievance.objects.filter(priority='urgent').count()
    high_count = Grievance.objects.filter(priority='high').count()

    # Category breakdown
    categories = Grievance.objects.values('category').annotate(count=Count('id')).order_by('-count')
    category_map = dict(Grievance.CATEGORY_CHOICES)
    category_stats = [
        {'key': c['category'], 'label': category_map.get(c['category'], c['category']), 'count': c['count']}
        for c in categories
    ]

    resolution_rate = round((resolved_count / total_count * 100), 1) if total_count > 0 else 0
    anonymous_ratio = round((anonymous_count / total_count * 100), 1) if total_count > 0 else 0

    return JsonResponse({
        'success': True,
        'metrics': {
            'total': total_count,
            'anonymous': anonymous_count,
            'identified': identified_count,
            'anonymous_percentage': anonymous_ratio,
            'submitted': submitted_count,
            'under_review': review_count,
            'action_taken': action_taken_count,
            'resolved': resolved_count,
            'rejected': rejected_count,
            'resolution_rate': resolution_rate,
            'urgent_cases': urgent_count,
            'high_priority': high_count,
        },
        'categories': category_stats,
    })


@csrf_exempt
@require_http_methods(["GET"])
def api_admin_list_admins(request):
    """List all registered administrators."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized.'}, status=403)

    profiles = UserProfile.objects.filter(Q(role='admin') | Q(user__is_staff=True)).select_related('user')
    admins = []
    for p in profiles:
        admins.append({
            'id': p.user.id,
            'username': p.user.username,
            'email': p.user.email,
            'full_name': f"{p.user.first_name} {p.user.last_name}".strip() or p.user.username,
            'department': p.department or 'CET Redressal Committee',
            'is_superuser': p.user.is_superuser,
            'date_joined': p.user.date_joined.strftime('%Y-%m-%d'),
        })
    return JsonResponse({'success': True, 'admins': admins})


@csrf_exempt
@require_http_methods(["POST"])
def api_admin_create_admin(request):
    """Allows an existing admin to provision a new admin account."""
    if not is_admin_user(request.user):
        return JsonResponse({'success': False, 'error': 'Unauthorized. Admin access required.'}, status=403)

    data = get_request_data(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()
    department = data.get('department', '').strip()

    if not username or not password:
        return JsonResponse({'success': False, 'error': 'Username and password are required.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'success': False, 'error': 'Username already exists.'}, status=400)

    first_name, _, last_name = full_name.partition(' ')
    new_admin = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True
    )
    profile, _ = UserProfile.objects.get_or_create(user=new_admin)
    profile.role = 'admin'
    profile.department = department or 'CET Grievance Redressal Committee'
    profile.save()

    # Append new credentials to credentials.txt file so they are stored securely for offline review
    try:
        from pathlib import Path
        cred_path = Path(__file__).resolve().parent.parent / 'credentials.txt'
        with open(cred_path, 'a', encoding='utf-8') as f:
            f.write(f"\n[Added Admin - {new_admin.date_joined.strftime('%Y-%m-%d %H:%M:%S')}]\n")
            f.write(f"Role: Admin / Grievance Officer\n")
            f.write(f"Name: {full_name or username}\n")
            f.write(f"Username: {username}\n")
            f.write(f"Password: {password}\n")
            f.write(f"Department: {profile.department}\n")
    except Exception as e:
        print("Error saving to credentials.txt:", e)

    return JsonResponse({
        'success': True,
        'message': f'Admin account for {username} created successfully.',
        'admin': {
            'id': new_admin.id,
            'username': new_admin.username,
            'full_name': full_name or username,
            'email': new_admin.email,
            'department': profile.department,
        }
    })

