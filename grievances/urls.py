from django.urls import path
from . import views

urlpatterns = [
    # SPA HTML entry point
    path('', views.index_view, name='index'),

    # Auth
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/me/', views.api_me, name='api_me'),
    path('api/auth/register/', views.api_register, name='api_register'),

    # Student & Anonymous Grievances
    path('api/grievances/', views.api_submit_grievance, name='api_submit_grievance'),
    path('api/grievances/track/<str:token>/', views.api_track_grievance, name='api_track_grievance'),
    path('api/grievances/track/<str:token>/message/', views.api_add_tracking_message, name='api_add_tracking_message'),
    path('api/student/my-grievances/', views.api_student_my_grievances, name='api_student_my_grievances'),

    # Admin Management
    path('api/admin/grievances/', views.api_admin_list_grievances, name='api_admin_list_grievances'),
    path('api/admin/grievances/<int:grievance_id>/', views.api_admin_get_grievance, name='api_admin_get_grievance'),
    path('api/admin/grievances/<int:grievance_id>/update/', views.api_admin_update_grievance, name='api_admin_update_grievance'),
    path('api/admin/grievances/<int:grievance_id>/message/', views.api_admin_add_message, name='api_admin_add_message'),
    path('api/admin/analytics/', views.api_admin_analytics, name='api_admin_analytics'),
    path('api/admin/admins/', views.api_admin_list_admins, name='api_admin_list_admins'),
    path('api/admin/create-admin/', views.api_admin_create_admin, name='api_admin_create_admin'),
]

