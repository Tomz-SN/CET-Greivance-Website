import secrets
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


def generate_tracking_token():
    """Generates a random unique tracking token like GRV-A83F19."""
    return f"GRV-{secrets.token_hex(4).upper()}"


def generate_secret_pin():
    """Generates a 4-digit numeric PIN for anonymous tracking security."""
    return str(secrets.randbelow(9000) + 1000)


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Grievance Committee / Admin'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    department = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    roll_number = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Grievance(models.Model):
    CATEGORY_CHOICES = (
        ('anti_ragging', 'Anti-Ragging & Safety'),
        ('harassment', 'Harassment / Discrimination'),
        ('academic', 'Academics & Examination'),
        ('hostel_mess', 'Hostel, Mess & Living'),
        ('infrastructure', 'Campus Infrastructure & Labs'),
        ('finance', 'Fees, Scholarship & Accounts'),
        ('discipline', 'Disciplinary & Code of Conduct'),
        ('general', 'General / Other'),
    )

    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('investigating', 'Investigating'),
        ('action_taken', 'Action Taken'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected / Closed'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent / Critical'),
    )

    tracking_token = models.CharField(
        max_length=30,
        unique=True,
        default=generate_tracking_token,
        db_index=True
    )
    secret_pin = models.CharField(max_length=10, default=generate_secret_pin)
    
    # Anonymity flag
    is_anonymous = models.BooleanField(default=True)

    # If identified, link to registered student user
    student = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='grievances'
    )
    student_name = models.CharField(max_length=120, blank=True, default='')
    student_email = models.EmailField(blank=True, default='')
    student_roll_number = models.CharField(max_length=50, blank=True, default='')
    student_department = models.CharField(max_length=100, blank=True, default='')

    # Grievance Details
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    title = models.CharField(max_length=200)
    description = models.TextField()
    incident_date = models.DateField(null=True, blank=True)
    incident_location = models.CharField(max_length=200, blank=True, default='')

    # Status & Management
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='submitted')
    assigned_officer = models.CharField(max_length=150, blank=True, default='')
    assigned_department = models.CharField(max_length=150, blank=True, default='')
    official_remarks = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='grievance_attachments/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        anon_str = "Anonymous" if self.is_anonymous else (self.student_name or "Identified")
        return f"[{self.tracking_token}] {self.title} - {anon_str} ({self.get_status_display()})"

    def to_dict(self, is_admin=False):
        """Serialize grievance into dictionary safely without leaking student identity."""
        data = {
            'id': self.id,
            'tracking_token': self.tracking_token,
            'is_anonymous': self.is_anonymous,
            'category': self.category,
            'category_display': self.get_category_display(),
            'title': self.title,
            'description': self.description,
            'incident_date': self.incident_date.isoformat() if self.incident_date else None,
            'incident_location': self.incident_location,
            'priority': self.priority,
            'priority_display': self.get_priority_display(),
            'status': self.status,
            'status_display': self.get_status_display(),
            'assigned_officer': self.assigned_officer,
            'assigned_department': self.assigned_department,
            'official_remarks': self.official_remarks,
            'has_attachment': bool(self.attachment),
            'attachment_url': self.attachment.url if self.attachment else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }

        # Confidentiality rule:
        # If grievance is anonymous, student information is NEVER sent to admin or anyone
        if not self.is_anonymous:
            data['student_name'] = self.student_name
            data['student_email'] = self.student_email
            data['student_roll_number'] = self.student_roll_number
            data['student_department'] = self.student_department
        else:
            data['student_name'] = "Protected (Anonymous)"
            data['student_email'] = None
            data['student_roll_number'] = None
            data['student_department'] = None

        return data


class GrievanceMessage(models.Model):
    SENDER_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Grievance Redressal Committee'),
    )

    grievance = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_CHOICES)
    sender_name = models.CharField(max_length=100, default='Anonymous Student')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def to_dict(self):
        return {
            'id': self.id,
            'sender_type': self.sender_type,
            'sender_name': self.sender_name if self.sender_type == 'admin' else ('Anonymous Student' if self.grievance.is_anonymous else self.sender_name),
            'message': self.message,
            'created_at': self.created_at.isoformat(),
        }
