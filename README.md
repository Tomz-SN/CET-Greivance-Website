# CET Student Grievance Cell

**College of Engineering Trivandrum (CET)** — Institutional Student Grievance & Dispute Redressal Portal.

This application allows students to report complaints, harassment, safety concerns, academic queries, and facility issues with **guaranteed anonymity** or via an authenticated student profile. Administrators and Grievance Committee officers can review reports, take official action, and provision additional administrator accounts.

---

## 🔒 Confidentiality & Credentials Notice

> **Important:** As requested, **login credentials are not displayed on the website**. 
> All system credentials (admin accounts, student demo accounts, and sample tracking tokens) are saved locally in:
> 
> 📄 [`credentials.txt`](file:///c:/Users/Tom%20Sanson/Downloads/project/credentials.txt)

---

## 🌟 Key Capabilities

### 1. 🛡️ 100% Anonymous Grievance Reporting
- Students can submit grievances without logging in or providing their identity.
- No roll numbers, names, emails, or IP addresses are linked to anonymous reports.
- Each submission generates a unique **Tracking Token** (e.g. `GRV-XXXXXX`) and a **4-digit PIN**.
- Anonymous two-way chat channel allows the CET Redressal Committee and the student to communicate confidentially.

### 2. 🔐 Dedicated Login Window
- Dedicated modal login window with separate tabs:
  - **Admin Login:** For Grievance Redressal Committee members and faculty proctors.
  - **Student Login:** For enrolled students to file and track identified grievances.
  - **Student Registration:** For new students to create a profile.

### 3. 👥 Admin Management & Provisioning
- The primary administrator can add new administrators directly from the **Admin Portal** (*Add / Manage Admins*).
- New admins are immediately activated with administrative privileges and their credentials are recorded into `credentials.txt`.

### 4. 📊 Committee Dashboard & Workflow
- Real-time KPI analytics (Total, In Review, Urgent Safety Cases, Resolved Rate, Anonymity Ratio).
- Multi-criteria filter (*Category, Priority, Status, Anonymity*) and search.
- Complete case lifecycle management (*Submitted → Under Review → Investigating → Action Taken → Resolved → Rejected*).
- Officer assignment and official resolution remarks.

---

## 🚀 How to Run the Website

In the project folder, run:

```powershell
python manage.py runserver
```

Or double-click:
👉 [`run.bat`](file:///c:/Users/Tom%20Sanson/Downloads/project/run.bat)

Open in your browser:
👉 **`http://127.0.0.1:8000/`**

---

## 🔑 Login Credentials

Check [`credentials.txt`](file:///c:/Users/Tom%20Sanson/Downloads/project/credentials.txt) for username and password details.

- **Admin Account:** See `credentials.txt`
- **Student Account:** See `credentials.txt`
- **Anonymous Reporting:** No login required. Click **"Report Grievance"** → **"Anonymous Mode"**.
