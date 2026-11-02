import os
import django
import datetime
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from grievances.models import UserProfile, Grievance, GrievanceMessage

def seed():
    print("Seeding CET Student Grievance Cell demo users and sample grievances...")

    # 1. Create Superuser / Admin
    admin_user, created = User.objects.get_or_create(username='admin', defaults={
        'email': 'grievance.cell@cet.ac.in',
        'first_name': 'Dr. K.',
        'last_name': 'Radhakrishnan',
        'is_staff': True,
        'is_superuser': True
    })
    admin_user.set_password('admin123')
    admin_user.first_name = 'Dr. K.'
    admin_user.last_name = 'Radhakrishnan'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    admin_profile, _ = UserProfile.objects.get_or_create(user=admin_user, defaults={
        'role': 'admin',
        'department': 'Dean Student Affairs & Grievance Cell Convener',
        'phone': '+91 471 259 8370'
    })
    admin_profile.role = 'admin'
    admin_profile.department = 'Dean Student Affairs & Grievance Cell Convener'
    admin_profile.save()

    # 2. Create Student User
    student_user, created = User.objects.get_or_create(username='student1', defaults={
        'email': 'alex.patel@student.cet.ac.in',
        'first_name': 'Alex',
        'last_name': 'Patel',
    })
    student_user.set_password('student123')
    student_user.save()

    student_profile, _ = UserProfile.objects.get_or_create(user=student_user, defaults={
        'role': 'student',
        'department': 'Computer Science & Engineering',
        'roll_number': 'TVE24CS042',
        'phone': '+91 98470 12345'
    })
    student_profile.role = 'student'
    student_profile.department = 'Computer Science & Engineering'
    student_profile.roll_number = 'TVE24CS042'
    student_profile.save()

    # 3. Create Sample Grievances if none exist
    if Grievance.objects.count() == 0:
        # Grievance 1: Anonymous Anti-Ragging / Safety (URGENT)
        g1 = Grievance.objects.create(
            tracking_token='GRV-SAFE882',
            secret_pin='1234',
            is_anonymous=True,
            category='anti_ragging',
            priority='urgent',
            status='investigating',
            title='Harassment & intimidation near Men Hostel Block C staircase after 9 PM',
            description='A group of senior students from the 4th year have been regularly cornering 1st year junior students in Hostel Block C stairs after dinner, demanding assignments and threatening intimidation. I am submitting this anonymously because I fear retaliation. Please increase security patrolling in this wing.',
            incident_location='CET Men Hostel Block C, 2nd Floor Staircase',
            incident_date=timezone.now().date() - datetime.timedelta(days=2),
            assigned_officer='Prof. Radhakrishnan (Anti-Ragging Squad Lead)',
            assigned_department='CET Proctorial Board & Hostel Security Office',
            official_remarks='CCTV footage of corridor C-2 has been preserved. Night security guard rotation has been doubled. Disciplinary committee has initiated discreet inquiry.',
        )
        GrievanceMessage.objects.create(
            grievance=g1,
            sender_type='admin',
            sender_name='CET Grievance Redressal Cell',
            message='Thank you for reporting this courageously. Your identity remains 100% anonymous. We have assigned our Anti-Ragging officer Prof. Radhakrishnan immediately.'
        )
        GrievanceMessage.objects.create(
            grievance=g1,
            sender_type='admin',
            sender_name='Prof. Radhakrishnan (Anti-Ragging Squad Lead)',
            message='Can you specify if this happens on specific weekdays or every night? Your response here is completely anonymous.'
        )
        GrievanceMessage.objects.create(
            grievance=g1,
            sender_type='student',
            sender_name='Anonymous Student',
            message='It happens mostly on Tuesday and Thursday nights between 9:30 PM and 11 PM.'
        )

        # Grievance 2: Anonymous Hostel & Mess Grievance (Action Taken)
        g2 = Grievance.objects.create(
            tracking_token='GRV-MESS419',
            secret_pin='4321',
            is_anonymous=True,
            category='hostel_mess',
            priority='high',
            status='action_taken',
            title='Substandard drinking water filter in LH Dining Hall',
            description='The main water dispenser in Ladies Hostel Dining Hall has foul odor and turbidity since Monday. Multiple students experienced stomach distress. The maintenance staff ignored verbal complaints.',
            incident_location='Ladies Hostel Dining Hall, Ground Floor Dispenser',
            incident_date=timezone.now().date() - datetime.timedelta(days=4),
            assigned_officer='Mr. David Miller',
            assigned_department='Estate & Sanitation Committee',
            official_remarks='Water samples tested. The RO membrane filter was replaced today. Tank chlorination completed. Health inspector signed off certificate.',
        )
        GrievanceMessage.objects.create(
            grievance=g2,
            sender_type='admin',
            sender_name='CET Grievance Redressal Cell',
            message='Received and dispatched to Estate Maintenance team with High priority.'
        )
        GrievanceMessage.objects.create(
            grievance=g2,
            sender_type='admin',
            sender_name='Mr. David Miller',
            message='RO filtration unit overhaul completed at 4 PM today. Safe drinking water is restored.'
        )

        # Grievance 3: Identified Academic & Examination (Resolved)
        g3 = Grievance.objects.create(
            tracking_token='GRV-EXAM711',
            secret_pin='9988',
            is_anonymous=False,
            student=student_user,
            student_name='Alex Patel',
            student_email='alex.patel@student.cet.ac.in',
            student_roll_number='TVE24CS042',
            student_department='Computer Science & Engineering',
            category='academic',
            priority='medium',
            status='resolved',
            title='Internal assessment grade discrepancy for CS302 Database Systems',
            description='My submitted project score of 28/30 in CS302 was incorrectly transcribed as 18/30 on the online portal. The evaluated grading sheet was signed by faculty on Oct 14.',
            incident_location='CSE Department Examination Cell',
            incident_date=timezone.now().date() - datetime.timedelta(days=7),
            assigned_officer='Dr. K. Radhakrishnan',
            assigned_department='Department Academic Committee',
            official_remarks='Score sheet verified with subject faculty. Internal marks corrected to 28/30 on university portal. Updated record published.',
            resolved_at=timezone.now() - datetime.timedelta(days=1)
        )
        GrievanceMessage.objects.create(
            grievance=g3,
            sender_type='admin',
            sender_name='Department Academic Committee',
            message='Verification completed. The clerical transcription error has been corrected on the portal.'
        )

        # Grievance 4: Anonymous Infrastructure (Submitted / New)
        g4 = Grievance.objects.create(
            tracking_token='GRV-WIFI209',
            secret_pin='5555',
            is_anonymous=True,
            category='infrastructure',
            priority='low',
            status='submitted',
            title='Persistent Wi-Fi disconnection in Central Library 3rd Floor',
            description='The wireless access points on the 3rd floor quiet study zone repeatedly disconnect during research hours. Please recalibrate coverage.',
            incident_location='CET Central Library, 3rd Floor East Reading Room',
            incident_date=timezone.now().date() - datetime.timedelta(days=1),
        )

        print(f"Created demo grievances successfully.")

    print("Demo setup completed. Credentials are stored in credentials.txt")

if __name__ == '__main__':
    seed()
