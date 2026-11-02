import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from grievances.models import UserProfile, Grievance, GrievanceMessage


class GrievanceSystemTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Admin user
        self.admin = User.objects.create_superuser(
            username='testadmin',
            email='admin@cet.ac.in',
            password='adminpassword'
        )
        UserProfile.objects.create(user=self.admin, role='admin', department='CET Grievance Committee')

        # Student user
        self.student = User.objects.create_user(
            username='teststudent',
            email='student@cet.ac.in',
            password='studentpassword',
            first_name='Maya',
            last_name='Lin'
        )
        UserProfile.objects.create(
            user=self.student,
            role='student',
            department='Civil Engineering',
            roll_number='TVE24CE007'
        )

    def test_anonymous_grievance_submission(self):
        """Test that anonymous reporting creates tracking token and strictly conceals identity."""
        payload = {
            'title': 'Broken lock on 3rd floor dormitory fire exit',
            'description': 'The emergency exit on the 3rd floor has a jammed door lock.',
            'category': 'infrastructure',
            'priority': 'high',
            'is_anonymous': True,
            'incident_location': 'Block D 3rd Floor'
        }

        response = self.client.post(
            '/api/grievances/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('tracking_token', data)
        self.assertIn('secret_pin', data)
        self.assertTrue(data['is_anonymous'])

        # Verify database record guarantees anonymity
        token = data['tracking_token']
        g = Grievance.objects.get(tracking_token=token)
        self.assertTrue(g.is_anonymous)
        self.assertIsNone(g.student)
        self.assertEqual(g.student_name, '')
        self.assertEqual(g.student_email, '')

        # Test tracking endpoint
        track_resp = self.client.get(f'/api/grievances/track/{token}/')
        self.assertEqual(track_resp.status_code, 200)
        track_data = track_resp.json()
        self.assertEqual(track_data['grievance']['student_name'], 'Protected (Anonymous)')
        self.assertIsNone(track_data['grievance']['student_email'])

        # Test anonymous student follow-up message
        msg_payload = {
            'message': 'Maintenance staff came by today but did not have the replacement parts.',
            'pin': data['secret_pin']
        }
        msg_resp = self.client.post(
            f'/api/grievances/track/{token}/message/',
            data=json.dumps(msg_payload),
            content_type='application/json'
        )
        self.assertEqual(msg_resp.status_code, 200)
        self.assertEqual(g.messages.count(), 2)

    def test_admin_review_and_status_update(self):
        """Test admin login, listing grievances, updating status and adding remarks."""
        login_resp = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'testadmin', 'password': 'adminpassword'}),
            content_type='application/json'
        )
        self.assertEqual(login_resp.status_code, 200)
        self.assertEqual(login_resp.json()['user']['role'], 'admin')

        g = Grievance.objects.create(
            title='Harassment in corridor',
            description='Verbal harassment incident.',
            category='harassment',
            priority='urgent',
            is_anonymous=True
        )

        list_resp = self.client.get('/api/admin/grievances/')
        self.assertEqual(list_resp.status_code, 200)

        update_payload = {
            'status': 'investigating',
            'assigned_officer': 'Prof. Radhakrishnan',
            'assigned_department': 'Proctorial Board',
            'official_remarks': 'Proctorial board inquiry convened.'
        }
        update_resp = self.client.post(
            f'/api/admin/grievances/{g.id}/update/',
            data=json.dumps(update_payload),
            content_type='application/json'
        )
        self.assertEqual(update_resp.status_code, 200)

        g.refresh_from_db()
        self.assertEqual(g.status, 'investigating')
        self.assertEqual(g.assigned_officer, 'Prof. Radhakrishnan')

    def test_admin_create_other_admin(self):
        """Test that an authenticated admin can provision another admin user."""
        # Log in as primary admin
        self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'testadmin', 'password': 'adminpassword'}),
            content_type='application/json'
        )

        create_payload = {
            'username': 'secondary_admin',
            'password': 'secpassword123',
            'full_name': 'Prof. Anitha Nair',
            'email': 'anitha@cet.ac.in',
            'department': 'Anti-Ragging Squad'
        }
        create_resp = self.client.post(
            '/api/admin/create-admin/',
            data=json.dumps(create_payload),
            content_type='application/json'
        )
        self.assertEqual(create_resp.status_code, 200)
        data = create_resp.json()
        self.assertTrue(data['success'])

        # Verify newly created admin exists and can log in
        new_client = Client()
        login_resp = new_client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'secondary_admin', 'password': 'secpassword123'}),
            content_type='application/json'
        )
        self.assertEqual(login_resp.status_code, 200)
        self.assertEqual(login_resp.json()['user']['role'], 'admin')

        # Verify newly created admin can access admin grievances
        admin_res = new_client.get('/api/admin/grievances/')
        self.assertEqual(admin_res.status_code, 200)
