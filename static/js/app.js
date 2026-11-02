const { useState, useEffect, useRef } = React;

// Category metadata for CET
const CATEGORIES = [
  { id: 'anti_ragging', name: 'Anti-Ragging & Campus Safety', icon: 'fa-shield-heart', urgent: true },
  { id: 'harassment', name: 'Harassment & Equal Opportunity', icon: 'fa-hand', urgent: true },
  { id: 'academic', name: 'Academics & Examination Cell', icon: 'fa-graduation-cap', urgent: false },
  { id: 'hostel_mess', name: 'Hostel, Mess & Living Facilities', icon: 'fa-utensils', urgent: false },
  { id: 'infrastructure', name: 'Campus Infrastructure & Labs', icon: 'fa-building-columns', urgent: false },
  { id: 'finance', name: 'Scholarships, Fees & Accounts', icon: 'fa-wallet', urgent: false },
  { id: 'discipline', name: 'Disciplinary & Code of Conduct', icon: 'fa-scale-balanced', urgent: false },
  { id: 'general', name: 'General / Other Enquiries', icon: 'fa-clipboard-question', urgent: false },
];

const STATUSES = [
  { id: 'submitted', label: 'Submitted', step: 1, icon: 'fa-file-lines' },
  { id: 'under_review', label: 'Under Review', step: 2, icon: 'fa-magnifying-glass' },
  { id: 'investigating', label: 'Investigating', step: 3, icon: 'fa-user-nurse' },
  { id: 'action_taken', label: 'Action Taken', step: 4, icon: 'fa-wrench' },
  { id: 'resolved', label: 'Resolved', step: 5, icon: 'fa-circle-check' },
  { id: 'rejected', label: 'Rejected / Closed', step: 0, icon: 'fa-circle-xmark' },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('submit');
  const [activeTrackingToken, setActiveTrackingToken] = useState('');
  const [activeTrackingPin, setActiveTrackingPin] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalInitialTab, setLoginModalInitialTab] = useState('admin');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check login state on load
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me/');
      const data = await res.json();
      if (data.authenticated) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout/', { method: 'POST' });
    setCurrentUser(null);
    showToast('Signed out successfully', 'info');
    setCurrentTab('submit');
  };

  const openTrackerWithToken = (token, pin = '') => {
    setActiveTrackingToken(token);
    setActiveTrackingPin(pin);
    setCurrentTab('track');
  };

  const openLoginWindow = (tab = 'admin') => {
    setLoginModalInitialTab(tab);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#1e3a8a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <i className={toast.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
          {toast.message}
        </div>
      )}

      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-container">
          <div className="brand" onClick={() => setCurrentTab('submit')}>
            <div className="brand-icon">
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div className="brand-text">
              <h1>CET Student Grievance Cell</h1>
              <p>College of Engineering Trivandrum</p>
            </div>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-btn ${currentTab === 'submit' ? 'active' : ''}`}
              onClick={() => setCurrentTab('submit')}
            >
              <i className="fa-solid fa-pen-to-square"></i> Report Grievance
            </button>
            <button 
              className={`nav-btn ${currentTab === 'track' ? 'active' : ''}`}
              onClick={() => setCurrentTab('track')}
            >
              <i className="fa-solid fa-magnifying-glass"></i> Track Ticket
            </button>
            
            {currentUser?.role === 'student' && (
              <button 
                className={`nav-btn ${currentTab === 'my-grievances' ? 'active' : ''}`}
                onClick={() => setCurrentTab('my-grievances')}
              >
                <i className="fa-solid fa-folder-open"></i> My Submissions
              </button>
            )}

            <button 
              className={`nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                if (currentUser?.role === 'admin') {
                  setCurrentTab('admin');
                } else {
                  openLoginWindow('admin');
                }
              }}
            >
              <i className="fa-solid fa-shield-halved"></i> Admin Portal
            </button>

            <button 
              className={`nav-btn ${currentTab === 'faq' ? 'active' : ''}`}
              onClick={() => setCurrentTab('faq')}
            >
              <i className="fa-solid fa-circle-question"></i> Policy & FAQ
            </button>

            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                <span className="user-badge">
                  <i className={currentUser.role === 'admin' ? "fa-solid fa-user-shield" : "fa-solid fa-user-graduate"} style={{ color: 'var(--accent)' }}></i>
                  {currentUser.first_name || currentUser.username}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({currentUser.role === 'admin' ? 'CET Admin' : 'Student'})</span>
                </span>
                <button className="nav-btn" onClick={handleLogout} title="Sign Out">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-sm" 
                style={{ marginLeft: '12px' }}
                onClick={() => openLoginWindow('student')}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Login Window
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN BODY CONTENT */}
      <main className="main-wrapper">
        {currentTab === 'submit' && (
          <SubmitGrievanceView 
            currentUser={currentUser} 
            showToast={showToast} 
            onSuccess={openTrackerWithToken}
          />
        )}

        {currentTab === 'track' && (
          <TrackGrievanceView 
            initialToken={activeTrackingToken}
            initialPin={activeTrackingPin}
            showToast={showToast}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView 
            currentUser={currentUser} 
            showToast={showToast}
            onOpenLogin={() => openLoginWindow('admin')}
          />
        )}

        {currentTab === 'my-grievances' && (
          <StudentSubmissionsView 
            currentUser={currentUser}
            onTrack={openTrackerWithToken}
          />
        )}

        {currentTab === 'faq' && (
          <PolicyFaqView />
        )}
      </main>

      {/* LOGIN WINDOW MODAL */}
      {isLoginModalOpen && (
        <AuthModal 
          initialTab={loginModalInitialTab}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            showToast(`Welcome, ${user.first_name || user.username}!`, 'success');
            if (user.role === 'admin') {
              setCurrentTab('admin');
            }
          }}
          showToast={showToast}
        />
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '6px' }}>
              CET Student Grievance Cell
            </h3>
            <p>College of Engineering Trivandrum (CET) — Zero-retaliation, confidential and anonymous student reporting.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p>CET Grievance Committee Helpline: <strong>+91 471 259 8370</strong></p>
            <p style={{ marginTop: '4px' }}>Administrative Block, College of Engineering Trivandrum, Kerala 695016</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------
// 1. SUBMIT GRIEVANCE VIEW (WITH ANONYMOUS GUARANTEE)
// ---------------------------------------------------------------------
function SubmitGrievanceView({ currentUser, showToast, onSuccess }) {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState('anti_ragging');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [studentName, setStudentName] = useState(currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentRoll, setStudentRoll] = useState(currentUser?.roll_number || '');
  const [studentDept, setStudentDept] = useState(currentUser?.department || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    if (catId === 'anti_ragging' || catId === 'harassment') {
      setPriority('urgent');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please provide both a title and detailed description.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category,
        priority,
        incident_date: incidentDate || null,
        incident_location: incidentLocation,
        is_anonymous: isAnonymous,
        student_name: isAnonymous ? '' : studentName,
        student_email: isAnonymous ? '' : studentEmail,
        student_roll_number: isAnonymous ? '' : studentRoll,
        student_department: isAnonymous ? '' : studentDept,
      };

      const res = await fetch('/api/grievances/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSubmissionResult(data);
        showToast('Grievance lodged successfully at CET Grievance Cell!', 'success');
      } else {
        showToast(data.error || 'Failed to submit grievance', 'error');
      }
    } catch (err) {
      showToast('Network error while submitting grievance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade">
      {/* Hero Welcome */}
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-tag">
            <i className="fa-solid fa-lock"></i> Protected & Anonymous Channel
          </div>
          <h2 className="hero-title">CET Student Grievance Cell</h2>
          <p className="hero-subtitle">
            Report any concern regarding academics, ragging, safety, campus facilities, or hostel life. You have the absolute right to report anonymously with zero fear of retaliation.
          </p>
        </div>
      </div>

      {submissionResult ? (
        /* SUCCESS RECEIPT MODAL / CARD */
        <div className="card receipt-box animate-fade">
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
            <i className="fa-solid fa-check"></i>
          </div>
          <h3 style={{ fontSize: '1.6rem', color: '#065f46', fontWeight: 800 }}>Grievance Registered Successfully</h3>
          <p style={{ color: '#047857', marginTop: '6px', maxWidth: '580px', margin: '6px auto 0' }}>
            {submissionResult.is_anonymous 
              ? 'Your complaint is logged with 100% Anonymity. No name, roll number, or IP address was recorded.'
              : 'Your complaint has been linked to your student credentials.'}
          </p>

          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Confidential Tracking Token
            </div>
            <div className="token-display">
              {submissionResult.tracking_token}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.9rem', color: '#475569', marginRight: '8px' }}>Secret Security PIN:</span>
            <span className="pin-display">{submissionResult.secret_pin}</span>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #a7f3d0', maxWidth: '560px', margin: '0 auto 24px', textAlign: 'left', fontSize: '0.86rem', color: '#065f46' }}>
            <p><strong><i className="fa-solid fa-triangle-exclamation"></i> Save Your Ticket Details:</strong></p>
            <p style={{ marginTop: '4px' }}>
              Keep your <strong>Tracking Token</strong> and <strong>PIN</strong> safe. You will need them to track committee actions and communicate anonymously with the CET Redressal Committee.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => onSuccess(submissionResult.tracking_token, submissionResult.secret_pin)}
            >
              <i className="fa-solid fa-magnifying-glass"></i> Track Status & Live Discussion
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(`Tracking Token: ${submissionResult.tracking_token} | PIN: ${submissionResult.secret_pin}`);
                showToast('Token and PIN copied to clipboard!', 'success');
              }}
            >
              <i className="fa-solid fa-copy"></i> Copy Token & PIN
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSubmissionResult(null);
                setTitle('');
                setDescription('');
              }}
            >
              <i className="fa-solid fa-plus"></i> Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* GRIEVANCE LODGING FORM */
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* ANONYMITY SWITCHER */}
            <div className={`anonymity-toggle-box ${isAnonymous ? 'active' : ''}`}>
              <div className="toggle-info">
                <h4>
                  {isAnonymous ? (
                    <>
                      <i className="fa-solid fa-user-shield" style={{ color: '#10b981' }}></i>
                      Anonymous Reporting Mode (Enabled)
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-id-card" style={{ color: '#2563eb' }}></i>
                      Identified Student Reporting Mode
                    </>
                  )}
                </h4>
                <p>
                  {isAnonymous 
                    ? 'Guaranteed Anonymity: Your identity, email, roll number, and IP address are never disclosed to the committee or college administration.' 
                    : 'Your name, roll number, and department will be attached so officers can reach out directly.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isAnonymous ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setIsAnonymous(true)}
                >
                  <i className="fa-solid fa-lock"></i> Anonymous
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${!isAnonymous ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIsAnonymous(false)}
                >
                  <i className="fa-solid fa-user"></i> Identified
                </button>
              </div>
            </div>

            {/* PRIVACY ASSURANCE CALLOUT */}
            {isAnonymous && (
              <div className="privacy-banner">
                <div className="privacy-icon">
                  <i className="fa-solid fa-user-secret"></i>
                </div>
                <div className="privacy-info">
                  <h4>Zero-Identity Exposure Protocol</h4>
                  <p>
                    CET Grievance Cell enforces statutory confidentiality. You will be given a secure tracking token and PIN to check committee updates and communicate without ever revealing who you are.
                  </p>
                </div>
              </div>
            )}

            {/* IDENTIFIED STUDENT FIELDS */}
            {!isAnonymous && (
              <div className="grid-2 card" style={{ background: '#f8fafc', padding: '20px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Student Full Name <span className="req">*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Maya Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required={!isAnonymous}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Student College Email <span className="req">*</span></label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. maya@student.cet.ac.in"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required={!isAnonymous}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Roll / KTU Registration Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. TVE24CS042"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Department / Branch</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Mechanical Engineering"
                    value={studentDept}
                    onChange={(e) => setStudentDept(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* CATEGORY SELECTOR */}
            <div className="form-group">
              <label className="form-label">Grievance Category <span className="req">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {CATEGORIES.map(cat => (
                  <div 
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    style={{
                      border: category === cat.id ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                      background: category === cat.id ? 'var(--accent-light)' : '#ffffff',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: category === cat.id ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: category === cat.id ? 'var(--accent)' : '#f1f5f9',
                      color: category === cat.id ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}>
                      <i className={`fa-solid ${cat.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: category === cat.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {cat.name}
                      </div>
                      {cat.urgent && (
                        <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                          <i className="fa-solid fa-bolt"></i> High Priority Safety Category
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIORITY & INCIDENT DETAILS */}
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Urgency / Priority Level <span className="req">*</span></label>
                <select 
                  className="form-select" 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low - Routine inquiry / minor maintenance</option>
                  <option value="medium">Medium - Academic, library or lab query</option>
                  <option value="high">High - Impacting living, health or safety</option>
                  <option value="urgent">Urgent / Critical - Immediate committee action needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Incident (Optional)</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Location / Landmark</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. PG Hostel Block, Main Academic Complex"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                />
              </div>
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="form-group">
              <label className="form-label">Grievance Subject / Title <span className="req">*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Brief summary of your grievance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description of the Grievance <span className="req">*</span></label>
              <textarea 
                className="form-textarea" 
                placeholder="Provide complete facts, dates, context, and impact. If reporting anonymously, do not include details that might inadvertently reveal who you are."
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
              <p className="form-hint">
                <i className="fa-solid fa-circle-info"></i> All submissions are processed strictly per the CET Grievance Redressal and Student Welfare Guidelines.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ padding: '14px 32px', fontSize: '1.05rem' }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting Securely...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> {isAnonymous ? 'Submit Anonymously' : 'Submit Grievance'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// 2. TRACK GRIEVANCE VIEW (STATUS & ANONYMOUS 2-WAY MESSAGING)
// ---------------------------------------------------------------------
function TrackGrievanceView({ initialToken, initialPin, showToast }) {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [pinInput, setPinInput] = useState(initialPin || '');
  const [isLoading, setIsLoading] = useState(false);
  const [grievanceData, setGrievanceData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchGrievance = async (tok, pinVal) => {
    if (!tok.trim()) {
      showToast('Please enter a tracking token', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const url = `/api/grievances/track/${encodeURIComponent(tok.trim())}/?pin=${encodeURIComponent(pinVal || '')}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setGrievanceData(data.grievance);
        setMessages(data.messages);
      } else {
        setGrievanceData(null);
        showToast(data.error || 'Ticket not found or PIN incorrect', 'error');
      }
    } catch (err) {
      showToast('Network error while looking up ticket', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchGrievance(initialToken, initialPin);
    }
  }, [initialToken]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !grievanceData) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/grievances/track/${grievanceData.tracking_token}/message/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          pin: pinInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        showToast('Confidential clarification sent to CET committee!', 'success');
      } else {
        showToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      showToast('Error sending message', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStepIndex = (status) => {
    const stepObj = STATUSES.find(s => s.id === status);
    return stepObj ? stepObj.step : 1;
  };

  const currentStep = grievanceData ? getStepIndex(grievanceData.status) : 1;

  return (
    <div className="animate-fade">
      {/* Search Header Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
          Track CET Grievance Ticket
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px' }}>
          Enter your Tracking Token and 4-digit PIN to check inquiry progress, view committee remarks, or communicate with the committee.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); fetchGrievance(tokenInput, pinInput); }} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label">Tracking Token</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. GRV-SAFE882"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
              required
            />
          </div>

          <div style={{ flex: '0 1 140px' }}>
            <label className="form-label">Secret PIN</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="4-digit PIN"
              maxLength="6"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ height: '46px' }}>
              {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>} Lookup Ticket
            </button>
          </div>
        </form>
      </div>

      {/* TICKET DETAILS CARD */}
      {grievanceData && (
        <div className="card animate-fade">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {grievanceData.tracking_token}
                </span>
                <span className={`badge badge-${grievanceData.status}`}>
                  {grievanceData.status_display}
                </span>
                <span className={`badge badge-${grievanceData.priority}`}>
                  {grievanceData.priority_display} Priority
                </span>
                {grievanceData.is_anonymous ? (
                  <span className="badge badge-anonymous">
                    <i className="fa-solid fa-user-secret"></i> Protected Anonymous
                  </span>
                ) : (
                  <span className="badge badge-identified">
                    <i className="fa-solid fa-user"></i> {grievanceData.student_name}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {grievanceData.title}
              </h3>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>Logged: {new Date(grievanceData.created_at).toLocaleDateString()}</div>
              <div>Category: <strong>{grievanceData.category_display}</strong></div>
            </div>
          </div>

          {/* PROGRESS STEPPER */}
          {grievanceData.status !== 'rejected' ? (
            <div className="stepper">
              {STATUSES.filter(s => s.step > 0).map((s) => (
                <div 
                  key={s.id} 
                  className={`step-item ${currentStep === s.step ? 'active' : ''} ${currentStep > s.step ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    {currentStep > s.step ? (
                      <i className="fa-solid fa-check"></i>
                    ) : (
                      <i className={`fa-solid ${s.icon}`}></i>
                    )}
                  </div>
                  <div className="step-label">{s.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '16px', borderRadius: '10px', margin: '20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fa-solid fa-circle-xmark" style={{ fontSize: '1.4rem' }}></i>
              <div>
                <strong>This grievance has been reviewed and closed / rejected.</strong>
                <p style={{ fontSize: '0.86rem', marginTop: '2px' }}>Please review the official committee remarks below for rationale.</p>
              </div>
            </div>
          )}

          {/* COMPLAINT BODY & REMARKS */}
          <div className="grid-2" style={{ marginTop: '24px' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <i className="fa-solid fa-align-left"></i> Submitted Description
              </h4>
              <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', fontSize: '0.92rem', lineHeight: 1.5 }}>
                {grievanceData.description}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {grievanceData.incident_location && (
                  <div><i className="fa-solid fa-location-dot"></i> Location: <strong>{grievanceData.incident_location}</strong></div>
                )}
                {grievanceData.incident_date && (
                  <div><i className="fa-solid fa-calendar"></i> Date: <strong>{grievanceData.incident_date}</strong></div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <i className="fa-solid fa-stamp"></i> Redressal Committee Action & Remarks
              </h4>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '10px', fontSize: '0.92rem' }}>
                {grievanceData.official_remarks ? (
                  <p style={{ color: '#065f46', lineHeight: 1.5 }}>{grievanceData.official_remarks}</p>
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>No official notes recorded yet. The grievance is currently queued for evaluation.</p>
                )}

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #a7f3d0', fontSize: '0.82rem', color: '#047857' }}>
                  <div>Assigned Officer: <strong>{grievanceData.assigned_officer || 'Committee Pending Assignment'}</strong></div>
                  <div>Assigned Department: <strong>{grievanceData.assigned_department || 'CET Redressal Committee'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* TWO-WAY ANONYMOUS CHAT / CLARIFICATION THREAD */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-comments" style={{ color: 'var(--accent)' }}></i>
              Confidential Two-Way Communication Channel
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Communicate directly with the CET Redressal Cell. All messages from you in this thread are completely anonymous.
            </p>

            <div className="chat-thread-container">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No messages exchanged yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`chat-bubble ${msg.sender_type}`}
                  >
                    <div className="chat-meta">
                      <span style={{ fontWeight: 700 }}>
                        {msg.sender_type === 'admin' ? (
                          <><i className="fa-solid fa-shield-halved"></i> {msg.sender_name}</>
                        ) : (
                          <><i className="fa-solid fa-user-secret"></i> {msg.sender_name}</>
                        )}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            {/* SEND MESSAGE INPUT */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type an anonymous message or response to the committee..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isSendingMessage}>
                {isSendingMessage ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>} Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. ADMIN DASHBOARD VIEW (MANAGEMENT, ANALYTICS & ADD ADMINS)
// ---------------------------------------------------------------------
function AdminDashboardView({ currentUser, showToast, onOpenLogin }) {
  const [grievances, setGrievances] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAnon, setFilterAnon] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active modal for editing grievance
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [modalMessages, setModalMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit fields
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editOfficer, setEditOfficer] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  // Admin Management Modal & State
  const [isAdminMgmtOpen, setIsAdminMgmtOpen] = useState(false);
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminDept, setNewAdminDept] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Analytics
      const statsRes = await fetch('/api/admin/analytics/');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setAnalytics(statsData);
      }

      // 2. Fetch Grievances with filters
      let queryParams = new URLSearchParams();
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);
      if (filterCategory !== 'all') queryParams.append('category', filterCategory);
      if (filterPriority !== 'all') queryParams.append('priority', filterPriority);
      if (filterAnon !== 'all') queryParams.append('is_anonymous', filterAnon);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/grievances/?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setGrievances(data.grievances);
      } else {
        showToast(data.error || 'Failed to fetch grievances', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminsList = async () => {
    try {
      const res = await fetch('/api/admin/admins/');
      const data = await res.json();
      if (data.success) {
        setAdminsList(data.admins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser, filterStatus, filterCategory, filterPriority, filterAnon]);

  const openAdminManagement = () => {
    loadAdminsList();
    setIsAdminMgmtOpen(true);
  };

  const handleCreateNewAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      showToast('Username and password are required', 'error');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/create-admin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          password: newAdminPassword.trim(),
          full_name: newAdminFullName.trim(),
          email: newAdminEmail.trim(),
          department: newAdminDept.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Administrator '${newAdminUsername}' added! Saved to credentials.txt`, 'success');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminFullName('');
        setNewAdminEmail('');
        setNewAdminDept('');
        loadAdminsList();
      } else {
        showToast(data.error || 'Failed to create admin', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const openGrievanceModal = async (g) => {
    setSelectedGrievance(g);
    setEditStatus(g.status);
    setEditPriority(g.priority);
    setEditOfficer(g.assigned_officer || '');
    setEditDepartment(g.assigned_department || '');
    setEditRemarks(g.official_remarks || '');

    try {
      const res = await fetch(`/api/admin/grievances/${g.id}/`);
      const data = await res.json();
      if (data.success) {
        setModalMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGrievance = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/grievances/${selectedGrievance.id}/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          assigned_officer: editOfficer,
          assigned_department: editDepartment,
          official_remarks: editRemarks
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Grievance updated successfully!', 'success');
        setSelectedGrievance(null);
        loadData();
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Network error during update', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedGrievance) return;

    try {
      const res = await fetch(`/api/admin/grievances/${selectedGrievance.id}/message/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminReplyText })
      });
      const data = await res.json();
      if (data.success) {
        setModalMessages([...modalMessages, data.data]);
        setAdminReplyText('');
        showToast('Official response sent to student thread', 'success');
      }
    } catch (err) {
      showToast('Error sending message', 'error');
    }
  };

  // If not admin, prompt login
  if (currentUser?.role !== 'admin') {
    return (
      <div className="card text-center" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px' }}>
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>CET Grievance Redressal Committee Portal</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 24px' }}>
          Access to committee investigation records and grievance resolution actions requires administrative authentication.
        </p>
        <button className="btn btn-primary" onClick={onOpenLogin}>
          <i className="fa-solid fa-lock"></i> Open Admin Login Window
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* KPI METRIC CARDS */}
      {analytics && (
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#1e3a8a' }}>
              <i className="fa-solid fa-inbox"></i>
            </div>
            <div>
              <div className="stat-val">{analytics.metrics.total}</div>
              <div className="stat-lbl">Total Grievances</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div className="stat-val">{analytics.metrics.under_review + analytics.metrics.submitted}</div>
              <div className="stat-lbl">Pending & In Review</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div className="stat-val">{analytics.metrics.urgent_cases}</div>
              <div className="stat-lbl">Urgent Safety Cases</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div className="stat-val">{analytics.metrics.resolved}</div>
              <div className="stat-lbl">Resolved Cases ({analytics.metrics.resolution_rate}%)</div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR & ADD ADMIN BUTTON */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="investigating">Investigating</option>
              <option value="action_taken">Action Taken</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={filterAnon}
              onChange={(e) => setFilterAnon(e.target.value)}
            >
              <option value="all">All Anonymity Types</option>
              <option value="true">Anonymous Only 🔒</option>
              <option value="false">Identified Students Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search token, keyword..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              style={{ width: '200px' }}
            />
            <button className="btn btn-primary" onClick={loadData} title="Search">
              <i className="fa-solid fa-search"></i>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={openAdminManagement}
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="fa-solid fa-user-plus"></i> Add / Manage Admins
            </button>
          </div>
        </div>
      </div>

      {/* GRIEVANCES TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
            CET Grievances Dossier ({grievances.length})
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <i className="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticket Token</th>
                <th>Category & Subject</th>
                <th>Complainant Identity</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No grievances matched the current filters.
                  </td>
                </tr>
              ) : (
                grievances.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                        {g.tracking_token}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{g.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{g.category_display}</div>
                    </td>
                    <td>
                      {g.is_anonymous ? (
                        <span className="badge badge-anonymous" title="Identity protected by CET anonymity protocol">
                          <i className="fa-solid fa-user-secret"></i> Anonymous
                        </span>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{g.student_name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{g.student_roll_number || 'Student'}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${g.priority}`}>
                        {g.priority_display}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${g.status}`}>
                        {g.status_display}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {g.assigned_officer || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(g.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => openGrievanceModal(g)}
                      >
                        <i className="fa-solid fa-file-pen"></i> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & ACTION MODAL */}
      {selectedGrievance && (
        <div className="modal-overlay" onClick={() => setSelectedGrievance(null)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedGrievance(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                {selectedGrievance.tracking_token}
              </span>
              {selectedGrievance.is_anonymous ? (
                <span className="badge badge-anonymous">
                  <i className="fa-solid fa-user-secret"></i> Protected Anonymous Complainant
                </span>
              ) : (
                <span className="badge badge-identified">
                  <i className="fa-solid fa-user"></i> {selectedGrievance.student_name} ({selectedGrievance.student_department})
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>
              {selectedGrievance.title}
            </h3>

            {/* Description Box */}
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Incident Report:</div>
              {selectedGrievance.description}
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {selectedGrievance.incident_location && <div>Location: <strong>{selectedGrievance.incident_location}</strong></div>}
                {selectedGrievance.incident_date && <div>Date: <strong>{selectedGrievance.incident_date}</strong></div>}
                <div>Category: <strong>{selectedGrievance.category_display}</strong></div>
              </div>
            </div>

            {/* Committee Action Form */}
            <form onSubmit={handleUpdateGrievance} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                <i className="fa-solid fa-gavel" style={{ color: 'var(--accent)', marginRight: '6px' }}></i>
                CET Committee Action & Redressal Remarks
              </h4>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Update Case Status</label>
                  <select 
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="investigating">Investigating</option>
                    <option value="action_taken">Action Taken</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected / Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select 
                    className="form-select"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assigned Investigating Officer</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Prof. Radhakrishnan (Proctor)"
                    value={editOfficer}
                    onChange={(e) => setEditOfficer(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Cell / Department</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Anti-Ragging Committee"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Redressal Remarks / Action Taken</label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  placeholder="Record formal inquiry findings, corrective steps taken, or final resolution notes..."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedGrievance(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>} Save Case Updates
                </button>
              </div>
            </form>

            {/* Direct Thread with Student */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>
                <i className="fa-solid fa-comments"></i> Direct Confidential Message Thread
              </h4>

              <div className="chat-thread-container" style={{ maxHeight: '240px' }}>
                {modalMessages.map(m => (
                  <div key={m.id} className={`chat-bubble ${m.sender_type}`}>
                    <div className="chat-meta">
                      <strong>{m.sender_name}</strong>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>{m.message}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendAdminMessage} style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Post an official response or query to the complainant..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <i className="fa-solid fa-reply"></i> Reply
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MANAGEMENT & ADD ADMIN MODAL */}
      {isAdminMgmtOpen && (
        <div className="modal-overlay" onClick={() => setIsAdminMgmtOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAdminMgmtOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
              <i className="fa-solid fa-users-gear" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
              CET Administrator & Officer Management
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
              As a logged-in administrator, you can provision new admin accounts for committee members, deans, and proctors.
            </p>

            {/* ADD ADMIN FORM */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#1e3a8a' }}>
                <i className="fa-solid fa-user-plus"></i> Provision New Administrator Account
              </h4>

              <form onSubmit={handleCreateNewAdmin}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Admin Username <span className="req">*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. proctor_john"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password <span className="req">*</span></label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Create a strong password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name & Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Dr. K. Radhakrishnan"
                      value={newAdminFullName}
                      onChange={(e) => setNewAdminFullName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department / Designation</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Dean Student Affairs / Anti-Ragging Cell"
                      value={newAdminDept}
                      onChange={(e) => setNewAdminDept(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. dean.students@cet.ac.in"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={isCreatingAdmin}>
                    {isCreatingAdmin ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus"></i>} Create Administrator Account
                  </button>
                </div>
              </form>
            </div>

            {/* LIST OF EXISTING ADMINS */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                <i className="fa-solid fa-user-shield"></i> Active CET Grievance Committee Members ({adminsList.length})
              </h4>
              <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Officer Name</th>
                      <th>Department / Role</th>
                      <th>Provisioned On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsList.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.username}</strong></td>
                        <td>{a.full_name}</td>
                        <td><span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{a.department}</span></td>
                        <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.date_joined}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// 4. STUDENT DASHBOARD (LOGGED IN SUBMISSIONS)
// ---------------------------------------------------------------------
function StudentSubmissionsView({ currentUser, onTrack }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/my-grievances/')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGrievances(data.grievances);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade">
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          <i className="fa-solid fa-folder-open" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
          My Registered Grievance Records
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px' }}>
          Grievances submitted while signed into your student account (<strong>{currentUser?.first_name} {currentUser?.last_name}</strong>).
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
          </div>
        ) : grievances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>You have not filed any identified grievances with this account yet.</p>
            <p style={{ fontSize: '0.84rem', marginTop: '6px' }}>Note: Any grievances submitted in <strong>Anonymous Mode</strong> do not link to your student account to protect your anonymity. Use the Track Ticket page with your token for anonymous submissions.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                      {g.tracking_token}
                    </td>
                    <td style={{ fontWeight: 600 }}>{g.title}</td>
                    <td>{g.category_display}</td>
                    <td><span className={`badge badge-${g.priority}`}>{g.priority_display}</span></td>
                    <td><span className={`badge badge-${g.status}`}>{g.status_display}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onTrack(g.tracking_token)}>
                        <i className="fa-solid fa-eye"></i> Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 5. POLICY & FAQ VIEW
// ---------------------------------------------------------------------
function PolicyFaqView() {
  return (
    <div className="animate-fade">
      <div className="card">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
          <i className="fa-solid fa-scale-balanced" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
          CET Grievance Redressal Policy & Privacy Standards
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
          College of Engineering Trivandrum (CET) adheres strictly to UGC, AICTE, and State Government Student Welfare and Anti-Ragging Mandates.
        </p>

        <div className="grid-2">
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
              How Does Anonymous Reporting Protect Me?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              When you submit a report with <strong>Anonymous Mode</strong> enabled, our system completely strips away user authentication headers, student IDs, and IP addresses. Only the randomized tracking ticket token (e.g. <code>GRV-A79B2K</code>) is stored in association with your complaint. No staff member or IT administrator can ascertain who submitted the complaint.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-clock" style={{ marginRight: '8px' }}></i>
              What is the Escalation & Resolution SLA?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              <strong>Urgent / Anti-Ragging:</strong> Initial assessment within 4 hours. Committee squad mobilized within 12 hours.<br/>
              <strong>High Priority:</strong> Response within 24 to 48 hours.<br/>
              <strong>Routine / Academic:</strong> Resolution within 5 business days.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-comments" style={{ marginRight: '8px' }}></i>
              Can the Committee Ask for Additional Proof?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              Yes! Through the <strong>Confidential Two-Way Channel</strong> on the Track Ticket page, the committee can send clarification queries. You can reply and provide details from your device without forfeiting your anonymity.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: '8px' }}></i>
              Strict Anti-Retaliation Policy
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              College disciplinary bylaws impose severe penalties—including academic debarment and expulsion—on any individual attempting to retaliate against or intimidate a student for reporting an issue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 6. LOGIN WINDOW MODAL (ADMIN & STUDENT LOGINS)
// ---------------------------------------------------------------------
function AuthModal({ initialTab, onClose, onSuccess, showToast }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'admin'); // 'admin', 'student', 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isRegister = activeTab === 'register';
    const url = isRegister ? '/api/auth/register/' : '/api/auth/login/';
    const payload = isRegister 
      ? { username, password, full_name: fullName, email, roll_number: rollNumber, department }
      : { username, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.user);
      } else {
        showToast(data.error || 'Authentication error', 'error');
      }
    } catch (err) {
      showToast('Network error during authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 10px' }}>
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>CET Portal Login</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            College of Engineering Trivandrum
          </p>
        </div>

        {/* ROLE TABS */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); setUsername(''); setPassword(''); }}
          >
            <i className="fa-solid fa-user-shield"></i> Admin Login
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => { setActiveTab('student'); setUsername(''); setPassword(''); }}
          >
            <i className="fa-solid fa-user-graduate"></i> Student Login
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setUsername(''); setPassword(''); }}
          >
            <i className="fa-solid fa-user-plus"></i> Register
          </button>
        </div>

        {/* SECURITY & CREDENTIALS INFO NOTICE */}
        <div className="auth-notice-box">
          <i className="fa-solid fa-file-lines" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}></i>
          <div>
            System login credentials are saved in <strong>credentials.txt</strong> in your project folder.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Maya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="maya@student.cet.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">KTU Roll Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. TVE24CS042"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Electrical Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              {activeTab === 'admin' ? 'Admin Username' : 'Student Username'} <span className="req">*</span>
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={activeTab === 'admin' ? 'Enter admin username' : 'Enter student username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="req">*</span></label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : activeTab === 'register' ? (
                'Create Student Account'
              ) : activeTab === 'admin' ? (
                <><i className="fa-solid fa-shield-halved"></i> Sign In as Admin</>
              ) : (
                <><i className="fa-solid fa-right-to-bracket"></i> Sign In as Student</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Render React App
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
