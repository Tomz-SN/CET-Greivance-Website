from django.contrib import admin
from .models import UserProfile, Grievance, GrievanceMessage


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'phone', 'roll_number')
    list_filter = ('role', 'department')
    search_fields = ('user__username', 'user__email', 'roll_number', 'department')


class GrievanceMessageInline(admin.TabularInline):
    model = GrievanceMessage
    extra = 0
    readonly_fields = ('sender_type', 'sender_name', 'message', 'created_at')


@admin.register(Grievance)
class GrievanceAdmin(admin.ModelAdmin):
    list_display = (
        'tracking_token',
        'title',
        'category',
        'is_anonymous',
        'priority',
        'status',
        'created_at',
        'assigned_officer'
    )
    list_filter = ('status', 'priority', 'category', 'is_anonymous')
    search_fields = ('tracking_token', 'title', 'description', 'student_name')
    readonly_fields = ('tracking_token', 'secret_pin', 'created_at', 'updated_at')
    inlines = [GrievanceMessageInline]


@admin.register(GrievanceMessage)
class GrievanceMessageAdmin(admin.ModelAdmin):
    list_display = ('grievance', 'sender_type', 'sender_name', 'created_at')
    list_filter = ('sender_type',)
    search_fields = ('grievance__tracking_token', 'message')
