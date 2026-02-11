// Application Data - Updated with new workflow
const appData = {
  student: {
    "id": "STU001",
    "userId": "bhargav_teja",
    "personalInfo": {
      "fullName": "Bhargav Teja",
      "rollNumber": "22071a67b7",
      "email": "bhargav.teja@college.edu",
      "phone": "+91-9876543210",
      "dateOfBirth": "2003-05-15",
      "bloodGroup": "O+",
      "profileImage": "https://via.placeholder.com/150x150/4F46E5/white?text=RS"
    },
    "academicInfo": {
      "branch": "Computer Science Engineering",
      "semester": 8,
      "batch": "2022-2026",
      "section": "B",
      "academicYear": "2025-26"
    },
    "hostelInfo": {
      "hostelName": "Hostel A",
      "roomNumber": "A-101",
      "hostelAddress": "Hostel A, College Campus, Electronic City, Bangalore - 560100",
      "hostelPhone": "+91-80-12345678"
    },
    "parentDetails": {
      "fatherName": "Mr. Ravi",
      "fatherPhone": "+91-9876543200",
      "fatherEmail": "ravi@gmail.com",
      "emergencyContactPhone": "+91-9876543202"
    },
    "addressInfo": {
      "permanentAddress": "Pratap Nagar, Hyderabad, Telangana - 500090",
      "city": "Hyderabad",
      "state": "Telangana",
      "pinCode": "500090",
      "localGuardianPhone": "+91-9876543203"
    },
    "violations": [
      {
        "id": "VIO001",
        "date": "2025-08-15T22:30:00",
        "type": "Late Return",
        "description": "Returned 2 hours late from City Mall visit",
        "severity": "medium",
        "penaltyPoints": 25
      }
    ],
    "totalViolations": 1,
    "riskScore": 35,
    "status": "active",
    "profileCompletion": 100,
    "totalRequests": 3,
    "joinedDate": "2023-07-15",
    "lastActive": "2025-09-10T20:30:00"
  },
  
  parent: {
    "id": "PAR001",
    "userId": "parent_ravi",
    "name": "Mr. Ravi",
    "email": "ravi@gmail.com",
    "phone": "+91-9876543200",
    "studentId": "STU001",
    "relationship": "Father",
    "approvalStyle": "careful_reviewer",
    "responseTimeAvg": "25 minutes"
  },
  
  admin: {
    "id": "ADM001",
    "userId": "admin_venkat",
    "name": "Mr. Venkat Rao",
    "email": "venkat.rao@college.edu",
    "phone": "+91-9876543300",
    "role": "Chief Warden",
    "managementStyle": "verification_focused",
    "experienceYears": 10
  },
  
  requests: [
    {
      "id": "REQ001",
      "studentId": "STU001",
      "type": "outpass",
      "destination": "Nexus Mall, Hyderabad",
      "reason": "Shopping for semester break essentials",
      "departureTime": "2025-09-11T14:00:00",
      "returnTime": "2025-09-11T20:00:00",
      "status": "approved",
      "parentApproval": true,
      "adminApproval": true,
      "parentApprovedAt": "2025-09-10T11:15:00",
      "adminApprovedAt": "2025-09-10T12:30:00",
      "parentComments": "Approved, please return on time.",
      "adminComments": "Approved after verification.",
      "riskScore": 35,
      "qrCode": "QR789ABCD123456",
      "qrGeneratedAt": "2025-09-10T12:31:00",
      "qrExpiresAt": "2025-09-11T21:00:00",
      "createdAt": "2025-09-10T10:30:00"
    },
    {
      "id": "REQ002",
      "studentId": "STU001",
      "type": "homepass",
      "destination": "Home - Guntur",
      "reason": "Family function - cousin's wedding",
      "departureTime": "2025-09-13T10:00:00",
      "returnTime": "2025-09-15T18:00:00",
      "status": "parent_approved",
      "parentApproval": true,
      "adminApproval": false,
      "parentApprovedAt": "2025-09-10T16:45:00",
      "parentComments": "Family function is important. Approved for 2 days.",
      "riskScore": 35,
      "createdAt": "2025-09-10T16:30:00"
    },
    {
      "id": "REQ003",
      "studentId": "STU001",
      "type": "outpass",
      "destination": "City Library",
      "reason": "Research work for project",
      "departureTime": "2025-09-12T09:00:00",
      "returnTime": "2025-09-12T17:00:00",
      "status": "parent_rejected",
      "parentApproval": false,
      "adminApproval": null,
      "parentRejectedAt": "2025-09-11T10:30:00",
      "parentComments": "Too many outings this week. Please focus on studies.",
      "riskScore": 35,
      "createdAt": "2025-09-11T09:00:00"
    }
  ],
  
  systemStats: {
    "totalRequests": 47,
    "totalRequestsGrowth": "+12%",
    "approvalRate": 87.3,
    "approvalRateChange": "-2%",
    "activeOutpasses": 23,
    "lateReturns": 5,
    "weeklyStats": {
      "totalRequests": 47,
      "approved": 41,
      "approvalRate": 87,
      "pending": 3,
      "rejected": 3
    },
    "riskDistribution": {
      "low": 65,
      "medium": 28,
      "high": 7,
      "highRiskIncrease": 15
    },
    "violationTrends": {
      "lateReturns": 12,
      "unauthorizedExtensions": 3,
      "falseInformation": 1,
      "overallChange": -20
    }
  },
  
  violationAlerts: [
    {
      "id": "ALERT001",
      "studentId": "STU001",
      "studentName": "Rahul Sharma",
      "violationType": "Late Return",
      "violationDate": "2025-08-15T22:30:00",
      "severity": "medium",
      "status": "unresolved",
      "hostel": "Hostel A",
      "room": "A-101",
      "riskScore": 35,
      "actionTaken": false,
      "alertDate": "2025-08-16T09:00:00"
    },
    {
      "id": "ALERT002",
      "studentId": "STU004",
      "studentName": "Ananya Gupta",
      "violationType": "Unauthorized Extension",
      "violationDate": "2025-09-08T19:00:00",
      "severity": "high",
      "status": "under_review",
      "hostel": "Hostel B",
      "room": "B-234",
      "riskScore": 75,
      "actionTaken": true,
      "alertDate": "2025-09-09T08:00:00"
    }
  ],
  
  outpassTypes: [
    {
      "type": "outpass",
      "title": "Regular Outpass",
      "description": "Day outing within city limits",
      "maxDuration": "12 hours",
      "icon": "🚶‍♂️",
      "color": "blue",
      "requiresParentApproval": true,
      "requiresAdminApproval": true
    },
    {
      "type": "homepass",
      "title": "Home Pass",
      "description": "Visit home or family for multiple days",
      "maxDuration": "7 days",
      "icon": "🏠",
      "color": "green",
      "requiresParentApproval": true,
      "requiresAdminApproval": true
    },
    {
      "type": "emergency",
      "title": "Emergency Pass",
      "description": "Urgent situations requiring immediate departure",
      "maxDuration": "24 hours",
      "icon": "🚨",
      "color": "red",
      "requiresParentApproval": true,
      "requiresAdminApproval": true,
      "expedited": true
    }
  ]
};

// Application state
let currentRole = null;
let currentUser = null;
let currentStep = 1;
let maxSteps = 3;
let selectedRequestType = null;
let countdownInterval = null;
const ENABLE_AUTO_LOGIN = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Smart Hostel Access Control System - Full Stack Version - Initializing...');
  initializeApp();
});

async function initializeApp() {
  console.log('App initialized successfully');
  
  // Check if user is already logged in
  const token = window.API?.getAuthToken();
  if (ENABLE_AUTO_LOGIN && token) {
    try {
      const response = await window.API.auth.getCurrentUser();
      currentUser = response.user;
      currentRole = response.user.role;
      proceedToApp();
      return;
    } catch (error) {
      console.error('Auth check failed:', error);
      window.API.auth.logout();
    }
  } else if (token) {
    // Clear tokens from previous sessions when auto-login is disabled
    window.API.auth.logout();
  }
  
  setupEventListeners();
  setupMinDateTime();
  showLoginPage();
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  const landingPage = document.getElementById('landingPage');
  const mainApp = document.getElementById('mainApp');
  
  if (loginPage) loginPage.classList.remove('hidden');
  if (landingPage) landingPage.classList.add('hidden');
  if (mainApp) mainApp.classList.add('hidden');
  
  // Setup login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorDiv = document.getElementById('loginError');
      
      try {
        const response = await window.API.auth.login(email, password);
        currentUser = response.user;
        currentRole = response.user.role;
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        showSuccessModal('Login Successful', 'Welcome back!');
        setTimeout(() => {
          proceedToApp();
        }, 500);
      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
          errorDiv.classList.remove('hidden');
        }
      }
    };
  }
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Role selection - using more specific delegation
  const roleCards = document.querySelectorAll('.role-card');
  roleCards.forEach(card => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const role = this.getAttribute('data-role');
      console.log('Role selected:', role);
      selectRole(role);
    });
  });
  
  // Outpass type selection
  setupRequestTypeSelection();
  
  // Navigation
  const backBtn = document.getElementById('backToRoles');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      backToRoles();
    });
  }
  
  // Emergency button - only show for students
  const emergencyBtn = document.getElementById('emergencyBtn');  
  if (emergencyBtn) {
    emergencyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createEmergencyRequest();
    });
  }
  
  // Modal close buttons
  setupModalCloseHandlers();
  
  // Form navigation
  setupFormNavigation();
  
  // Profile form
  setupProfileForm();

  // Logout button (inject if missing)
  let logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'btn btn--outline';
      logoutBtn.textContent = 'Logout';
      headerActions.appendChild(logoutBtn);
    }
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        window.API.auth.logout();
      } catch (err) {
        console.error('Logout error:', err);
      }
      showLoginPage();
    });
  }
  
  console.log('Event listeners setup completed');
}

function setupRequestTypeSelection() {
  const container = document.querySelector('.outpass-type-cards');
  if (!container) return;

  // Ensure we don't attach duplicate handlers
  if (container.dataset.listenerAttached === 'true') {
    return;
  }

  container.addEventListener('click', (event) => {
    const card = event.target.closest('.outpass-type-card');
    if (!card) return;

    event.preventDefault();
    event.stopPropagation();

    selectRequestType(card);
  });

  container.dataset.listenerAttached = 'true';
}

function selectRequestType(typeCard) {
  document.querySelectorAll('.outpass-type-card').forEach(c => c.classList.remove('selected'));
  typeCard.classList.add('selected');
  selectedRequestType = typeCard.getAttribute('data-type');
  console.log('Request type selected:', selectedRequestType);

  updateFormNavigation();
}

function setupModalCloseHandlers() {
  const modals = ['requestModal', 'approvalModal', 'errorModal', 'successModal'];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          closeModal(modalId);
        });
      }
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modalId);
        }
      });
    }
  });
}

function setupFormNavigation() {
  const nextBtn = document.getElementById('nextStep');
  const prevBtn = document.getElementById('prevStep');
  const submitBtn = document.getElementById('submitRequest');
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextFormStep();
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevFormStep();
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitRequest();
    });
  }

  updateFormNavigation();
}

function setupProfileForm() {
  const profileForm = document.getElementById('studentProfileForm');
  
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfile();
    });
  }
}

function setupMinDateTime() {
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);
  
  const departureInput = document.getElementById('departureTime');
  const returnInput = document.getElementById('returnTime');
  
  if (departureInput) {
    departureInput.min = minDateTimeString;
  }
  if (returnInput) {
    returnInput.min = minDateTimeString;
  }
}

function selectRole(role) {
  // This function is now used only for demo/landing page
  // In production, users should login instead
  console.log('Role selection clicked - please use login instead');
  showLoginPage();
}

function proceedToApp() {
  console.log('Proceeding to app with role:', currentRole);
  
  // Hide landing/login pages and show main app
  const landingPage = document.getElementById('landingPage');
  const loginPage = document.getElementById('loginPage');
  const mainApp = document.getElementById('mainApp');
  
  if (landingPage) landingPage.classList.add('hidden');
  if (loginPage) loginPage.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');

  // Ensure logout button exists and is wired inside app context
  let logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'btn btn--outline';
      logoutBtn.textContent = 'Logout';
      headerActions.appendChild(logoutBtn);
    }
  }
  if (logoutBtn) {
    logoutBtn.classList.remove('hidden');
    // Avoid duplicate listeners by resetting onclick
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      try { window.API.auth.logout(); } catch (err) { console.error('Logout error:', err); }
      showLoginPage();
    };
  }
  
  setupRoleInterface();
  loadRoleContent();
}

function setupRoleInterface() {
  const headerTitle = document.getElementById('headerTitle');
  const headerSubtitle = document.getElementById('headerSubtitle');
  const emergencyBtn = document.getElementById('emergencyBtn');
  
  if (headerTitle) {
    headerTitle.textContent = getRoleTitle();
  }
  
  if (headerSubtitle && currentUser) {
    if (currentRole === 'student') {
      headerSubtitle.textContent = currentUser.personalInfo?.fullName || currentUser.email;
    } else if (currentRole === 'parent') {
      headerSubtitle.textContent = currentUser.name || currentUser.email;
    } else if (currentRole === 'admin') {
      headerSubtitle.textContent = currentUser.name || currentUser.email;
    }
  }
  
  // Show emergency button only for students
  if (emergencyBtn) {
    if (currentRole === 'student') {
      emergencyBtn.classList.remove('hidden');
    } else {
      emergencyBtn.classList.add('hidden');
    }
  }
  
  setupNavigation();
  setupDashboard();
}

function getRoleTitle() {
  const titles = {
    student: 'Student Portal',
    parent: 'Parent Dashboard', 
    admin: 'Admin Dashboard'
  };
  return titles[currentRole] || 'Dashboard';
}

function setupNavigation() {
  const navConfigs = {
    student: [
      { id: 'studentOverview', label: 'Dashboard', target: 'studentOverview' },
      { id: 'studentRequests', label: 'My Requests', target: 'studentRequests' },
      { id: 'createRequest', label: 'New Request', target: 'createRequest' },
      { id: 'qrCode', label: 'QR Code', target: 'qrCode' },
      { id: 'studentProfile', label: 'Profile', target: 'studentProfile' }
    ],
    parent: [
      { id: 'parentOverview', label: 'Dashboard', target: 'parentOverview' },
      { id: 'parentApprovals', label: 'Pending Approvals', target: 'parentApprovals' },
      { id: 'parentActivity', label: 'Student Activity', target: 'parentActivity' }
    ],
    admin: [
      { id: 'adminOverview', label: 'Overview', target: 'adminOverview' },
      { id: 'adminQueue', label: 'Queue', target: 'adminQueue' },
      { id: 'adminStudents', label: 'Students', target: 'adminStudents' },
      { id: 'adminReports', label: 'Reports', target: 'adminReports' }
    ]
  };
  
  const config = navConfigs[currentRole] || [];
  const navigationTabs = document.getElementById('navigationTabs');
  
  if (navigationTabs) {
    const tabsList = document.createElement('ul');
    tabsList.className = 'nav-tabs-list';
    
    config.forEach((tab, index) => {
      const li = document.createElement('li');
      li.className = `nav-tab ${index === 0 ? 'active' : ''}`;
      li.textContent = tab.label;
      li.dataset.target = tab.target;
      
      li.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(tab.target, li);
      });
      
      tabsList.appendChild(li);
    });
    
    navigationTabs.innerHTML = '';
    navigationTabs.appendChild(tabsList);
    console.log('Navigation setup completed for role:', currentRole);
  }
}

function setupDashboard() {
  // Hide all dashboards
  document.querySelectorAll('.dashboard').forEach(dash => dash.classList.add('hidden'));
  
  // Show appropriate dashboard
  const dashboard = document.getElementById(`${currentRole}Dashboard`);
  if (dashboard) {
    dashboard.classList.remove('hidden');
    console.log('Dashboard shown for role:', currentRole);
  }
}

function loadRoleContent() {
  console.log('Loading content for role:', currentRole);
  
  switch (currentRole) {
    case 'student':
      loadStudentContent();
      break;
    case 'parent':
      loadParentContent();
      break;
    case 'admin':
      loadAdminContent();
      break;
  }
}

function switchTab(targetId, tabElement) {
  console.log('Switching to tab:', targetId);
  
  // Remove active class from all tabs and panes
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  
  // Add active class to clicked tab and target pane
  if (tabElement) {
    tabElement.classList.add('active');
  }
  
  const targetPane = document.getElementById(targetId);
  if (targetPane) {
    targetPane.classList.add('active');
    console.log('Tab activated:', targetId);
  } else {
    console.error('Tab pane not found:', targetId);
  }
}

// Student Functions
async function loadStudentContent() {
  await loadStudentOverview();
  await loadStudentRequests();
  await loadStudentQRCode();
  await loadStudentProfile();
  setupStudentEventListeners();
}

async function loadStudentOverview() {
  if (!currentUser) return;
  
  try {
    const profileResponse = await window.API.student.getProfile();
    const statsResponse = await window.API.student.getStats();
    const requestsResponse = await window.API.request.getAll();
    
    const student = profileResponse.student;
    const stats = statsResponse;
    const requests = requestsResponse.requests || [];
    
  const welcomeEl = document.getElementById('studentWelcome');
  const infoEl = document.getElementById('studentInfo');
  const totalRequestsEl = document.getElementById('studentTotalRequests');
  const activeRequestsEl = document.getElementById('studentActiveRequests');
  const violationsEl = document.getElementById('studentViolations');
  const riskScoreEl = document.getElementById('studentRiskScore');
  const recentListEl = document.getElementById('recentRequestsList');
  
  if (welcomeEl) welcomeEl.textContent = `Welcome back, ${student.personalInfo?.fullName || currentUser.email}!`;
  if (infoEl) infoEl.textContent = `${student.hostelInfo?.hostelName || ''}, Room ${student.hostelInfo?.roomNumber || ''} • ${student.academicInfo?.branch || ''}`;
  
  const activeRequests = requests.filter(isRequestActive);
  
  if (totalRequestsEl) totalRequestsEl.textContent = stats.totalRequests || 0;
  if (activeRequestsEl) activeRequestsEl.textContent = activeRequests.length;
  if (violationsEl) violationsEl.textContent = stats.violations || 0;
  if (riskScoreEl) {
    riskScoreEl.textContent = stats.riskScore || 0;
    const parent = riskScoreEl.parentElement;
    if (parent) {
      parent.className = `stat-card risk-score-card risk-${getRiskLevel(stats.riskScore || 0)}`;
    }
  }
  
  // Recent requests
  if (recentListEl) {
    const recentRequests = requests.slice(-2);
    if (recentRequests.length > 0) {
      recentListEl.innerHTML = recentRequests.map(request => `
        <div class="request-card" onclick="openRequestDetails('${request._id}')">
          ${createRequestCard(request)}
        </div>
      `).join('');
    } else {
      recentListEl.innerHTML = '<p class="empty-state">No recent requests</p>';
    }
  }
  } catch (error) {
    console.error('Error loading student overview:', error);
    showErrorModal('Error', 'Failed to load dashboard data');
  }
}

async function loadStudentRequests() {
  const container = document.getElementById('studentRequestList');
  if (!container || !currentUser) return;
  
  try {
    const response = await window.API.request.getAll();
    const requests = response.requests || [];
    
    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state">No requests found. Create your first request!</p>';
      return;
    }
    
    container.innerHTML = requests.map(request => `
      <div class="request-card" onclick="openRequestDetails('${request._id}')">
        ${createRequestCard(request)}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading requests:', error);
    container.innerHTML = '<p class="empty-state">Error loading requests</p>';
  }
}

async function loadStudentQRCode() {
  const activePassDisplay = document.getElementById('activePassDisplay');
  const noActivePass = document.getElementById('noActivePass');
  
  if (!currentUser) return;
  
  try {
    const response = await window.API.request.getAll();
    const requests = response.requests || [];
    const activeRequest = requests
      .filter(isRequestActive)
      .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))[0];
    
    if (activeRequest && activePassDisplay && noActivePass) {
      // Get QR code details
      const qrResponse = await window.API.request.getQR(activeRequest._id);
      
      noActivePass.classList.add('hidden');
      activePassDisplay.classList.remove('hidden');
      
      activePassDisplay.innerHTML = `
        <div class="qr-code" id="qrCodeCanvas">
          <div style="font-family: monospace; font-size: 12px; text-align: center; padding: 20px; background: white; color: black; border-radius: 8px;">
            ${qrResponse.qrCode}
          </div>
        </div>
        <div class="qr-details">
          <p><strong>Destination:</strong> <span>${activeRequest.destination}</span></p>
          <p><strong>Type:</strong> <span class="request-type ${activeRequest.type}">${activeRequest.type.toUpperCase()}</span></p>
          <p><strong>Departure:</strong> <span>${formatDateTime(activeRequest.departureTime)}</span></p>
          <p><strong>Return:</strong> <span>${formatDateTime(activeRequest.returnTime)}</span></p>
          <p><strong>Valid Until:</strong> <span>${formatDateTime(qrResponse.qrExpiresAt)}</span></p>
        </div>
        <div class="countdown-timer">
          <span>Expires in: </span>
          <span class="timer-value" id="qrTimer">--:--:--</span>
        </div>
        <div class="qr-actions">
          <button class="btn btn--outline" onclick="downloadQR('${qrResponse.qrCode}')">Download</button>
          <button class="btn btn--secondary" onclick="shareQR('${qrResponse.qrCode}')">Share</button>
        </div>
      `;
      
      startCountdown(qrResponse.qrExpiresAt);
    } else if (noActivePass && activePassDisplay) {
      activePassDisplay.classList.add('hidden');
      noActivePass.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading QR code:', error);
    if (noActivePass && activePassDisplay) {
      activePassDisplay.classList.add('hidden');
      noActivePass.classList.remove('hidden');
    }
  }
}

function loadStudentProfile() {
  if (!currentUser) return;
  
  // Pre-populate form with enhanced profile data
  const formFields = {
    'fullName': currentUser.personalInfo.fullName,
    'rollNumber': currentUser.personalInfo.rollNumber,
    'email': currentUser.personalInfo.email,
    'phoneNumber': currentUser.personalInfo.phone,
    'dateOfBirth': currentUser.personalInfo.dateOfBirth,
    'bloodGroup': currentUser.personalInfo.bloodGroup,
    'branch': currentUser.academicInfo.branch,
    'semester': currentUser.academicInfo.semester,
    'batch': currentUser.academicInfo.batch,
    'section': currentUser.academicInfo.section,
    'hostelName': currentUser.hostelInfo.hostelName,
    'roomNumber': currentUser.hostelInfo.roomNumber,
    'floor': currentUser.hostelInfo.floor,
    'wing': currentUser.hostelInfo.wing,
    'fatherName': currentUser.parentDetails.fatherName,
    'fatherPhone': currentUser.parentDetails.fatherPhone,
    'fatherEmail': currentUser.parentDetails.fatherEmail,
    'motherName': currentUser.parentDetails.motherName,
    'motherPhone': currentUser.parentDetails.motherPhone,
    'motherEmail': currentUser.parentDetails.motherEmail,
    'emergencyContactName': currentUser.parentDetails.emergencyContactName,
    'emergencyContactPhone': currentUser.parentDetails.emergencyContactPhone,
    'permanentAddress': currentUser.addressInfo.permanentAddress,
    'city': currentUser.addressInfo.city,
    'state': currentUser.addressInfo.state,
    'pinCode': currentUser.addressInfo.pinCode,
    'localGuardianName': currentUser.addressInfo.localGuardianName,
    'localGuardianPhone': currentUser.addressInfo.localGuardianPhone,
    'localGuardianAddress': currentUser.addressInfo.localGuardianAddress
  };
  
  Object.entries(formFields).forEach(([fieldId, value]) => {
    const field = document.getElementById(fieldId);
    if (field && value) {
      field.value = value;
    }
  });
}

function setupStudentEventListeners() {
  const quickCreateBtn = document.getElementById('quickCreateBtn');
  const viewQRBtn = document.getElementById('viewQRBtn');
  const createRequestBtn = document.getElementById('createRequestBtn');
  
  if (quickCreateBtn) {
    quickCreateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchToTab('createRequest');
    });
  }
  
  if (viewQRBtn) {
    viewQRBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchToTab('qrCode');
    });
  }
  
  if (createRequestBtn) {
    createRequestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchToTab('createRequest');
    });
  }
}

// Parent Functions
async function loadParentContent() {
  await loadParentOverview();
  await loadParentApprovals();
  await loadParentActivity();
}

async function loadParentOverview() {
  if (!currentUser) return;
  
  try {
    const dashboardResponse = await window.API.parent.getDashboard();
    const dashboard = dashboardResponse;
    
    const welcomeEl = document.getElementById('parentWelcome');
    const infoEl = document.getElementById('parentInfo');
    const pendingCountEl = document.getElementById('parentPendingCount');
    const approvedCountEl = document.getElementById('parentApprovedCount');
    const childRiskEl = document.getElementById('parentChildRisk');
    const childViolationsEl = document.getElementById('parentChildViolations');
    
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${currentUser.name || currentUser.email}`;
    if (infoEl && dashboard.student) {
      const studentName = dashboard.student.personalInfo?.fullName || 'your child';
      infoEl.textContent = `Monitoring ${studentName}'s outpass requests`;
    }
    if (pendingCountEl) pendingCountEl.textContent = dashboard.pendingCount || 0;
    if (approvedCountEl) approvedCountEl.textContent = dashboard.approvedCount || 0;
    if (childRiskEl) {
      childRiskEl.textContent = dashboard.childRisk || 0;
      const parent = childRiskEl.parentElement;
      if (parent) {
        parent.className = `stat-card risk-${getRiskLevel(dashboard.childRisk || 0)}`;
      }
    }
    if (childViolationsEl) {
      childViolationsEl.textContent = dashboard.childViolations || 0;
    }
  } catch (error) {
    console.error('Error loading parent overview:', error);
    showErrorModal('Error', 'Failed to load dashboard data');
  }
}

async function loadParentApprovals() {
  const container = document.getElementById('parentApprovalList');
  if (!container || !currentUser) return;
  
  try {
    const response = await window.API.parent.getPendingApprovals();
    const requests = response.requests || [];
    
    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state">No pending approvals.</p>';
      return;
    }
    
    container.innerHTML = requests.map(request => `
      <div class="request-card">
        ${createRequestCard(request, true)}
        <div class="approval-actions">
          <button class="btn btn--primary" onclick="showApprovalModal('${request._id}', true)">Approve</button>
          <button class="btn btn--outline" onclick="showApprovalModal('${request._id}', false)">Reject</button>
          <button class="btn btn--secondary" onclick="openRequestDetails('${request._id}')">View Details</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading approvals:', error);
    container.innerHTML = '<p class="empty-state">Error loading approvals</p>';
  }
}

async function loadParentActivity() {
  const container = document.getElementById('parentActivityList');
  if (!container || !currentUser) return;
  
  try {
    const response = await window.API.parent.getActivity();
    const requests = response.requests || [];
    
    container.innerHTML = requests.map(request => `
      <div class="request-card">
        <div class="request-header">
          <span class="request-type ${request.type}">${request.type.toUpperCase()}</span>
          <span class="status status--${getStatusClass(request.status)}">${getStatusLabel(request.status)}</span>
        </div>
        <p><strong>Destination:</strong> ${request.destination}</p>
        <p><strong>Date:</strong> ${formatDate(request.createdAt)}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <div class="risk-score-badge risk-${getRiskLevel(request.riskScore || 0)}">Risk Score: ${request.riskScore || 0}</div>
        ${request.parentComments ? `<p><strong>Your Comments:</strong> ${request.parentComments}</p>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading activity:', error);
    container.innerHTML = '<p class="empty-state">Error loading activity</p>';
  }
}

// Admin Functions  
async function loadAdminContent() {
  await loadAdminOverview();
  await loadAdminQueue();
  await loadAdminStudents();
  await loadAdminReports();
}

async function loadAdminOverview() {
  try {
    const overviewResponse = await window.API.admin.getOverview();
    const overview = overviewResponse;
    
    // Update stats in the HTML (if they exist)
    // Load violation alerts
    await loadViolationAlerts(overview.violationAlerts || []);
  } catch (error) {
    console.error('Error loading admin overview:', error);
    showErrorModal('Error', 'Failed to load overview data');
  }
}

async function loadViolationAlerts(alerts = null) {
  const container = document.getElementById('violationAlertsList');
  if (!container) return;
  
  try {
    if (!alerts) {
      const overviewResponse = await window.API.admin.getOverview();
      alerts = overviewResponse.violationAlerts || [];
    }
    
    if (alerts.length === 0) {
      container.innerHTML = '<p class="empty-state">No violation alerts at this time.</p>';
      return;
    }
    
    container.innerHTML = alerts.map(alert => `
      <div class="violation-alert-item">
        <div class="violation-alert-info">
          <h5>${alert.studentName}</h5>
          <p><strong>Violation:</strong> ${alert.violationType}</p>
          <p><strong>Date:</strong> ${formatDateTime(alert.violationDate)}</p>
          <p><strong>Location:</strong> ${alert.hostel}, Room ${alert.room}</p>
          <p><strong>Risk Score:</strong> <span class="risk-score-badge risk-${getRiskLevel(alert.riskScore || 0)}">${alert.riskScore || 0}</span></p>
          <span class="severity-badge ${alert.severity}">${alert.severity}</span>
        </div>
        <div class="violation-alert-actions">
          <button class="btn btn--sm btn--primary" onclick="viewViolationDetails('${alert.id}')">View Details</button>
          <button class="btn btn--sm btn--outline" onclick="addRestriction('${alert.studentId}')">Add Restriction</button>
          <button class="btn btn--sm btn--secondary" onclick="contactParent('${alert.studentId}')">Contact Parent</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading violation alerts:', error);
    container.innerHTML = '<p class="empty-state">Error loading violation alerts</p>';
  }
}

async function loadAdminQueue() {
  const container = document.getElementById('adminQueueList');
  if (!container) return;
  
  try {
    const response = await window.API.admin.getQueue();
    const requests = response.requests || [];
    
    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state">No parent-approved requests in queue.</p>';
      return;
    }
    
    container.innerHTML = requests.map(request => {
      const student = request.studentId || {};
      
      return `
        <div class="request-card">
          ${createRequestCard(request, true)}
          <div class="student-context" style="margin: 16px 0; padding: 12px; background: var(--color-bg-1); border-radius: var(--radius-base);">
            <strong>Student Context:</strong><br>
            ${student.personalInfo?.fullName || 'N/A'} • ${student.hostelInfo?.hostelName || 'N/A'}, Room ${student.hostelInfo?.roomNumber || 'N/A'}<br>
            <div class="student-risk-summary">
              ${renderRiskScoreSection(request, {
                requestLabel: 'Request Risk',
                overallLabel: 'Student Risk',
                singleLabel: 'Student Risk'
              })}
              <span class="violations-text">(${request.studentViolations || 0} violations)</span>
            </div>
            <strong>Parent Approved:</strong> ${formatDateTime(request.parentApprovedAt)}<br>
            <strong>Parent Comments:</strong> ${request.parentComments || 'None'}
          </div>
          <div class="approval-actions">
            <button class="btn btn--primary" onclick="adminApproveRequest('${request._id}', true)">Final Approve</button>
            <button class="btn btn--outline" onclick="adminApproveRequest('${request._id}', false)">Reject</button>
            <button class="btn btn--secondary" onclick="openRequestDetails('${request._id}')">Detailed Review</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading queue:', error);
    container.innerHTML = '<p class="empty-state">Error loading queue</p>';
  }
}

async function loadAdminStudents() {
  try {
    const response = await window.API.admin.getStudents();
    const students = response.students || [];
    
    const riskScoreEl = document.getElementById('adminStudentRisk');
    if (riskScoreEl && students.length > 0) {
      const student = students[0];
      riskScoreEl.textContent = student.riskScore || 0;
      riskScoreEl.className = `stat-value risk-${getRiskLevel(student.riskScore || 0)}`;
    }
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

async function loadAdminReports() {
  // Reports data is loaded from API but displayed in static HTML
  // This function can be used to update dynamic report data if needed
}

// Form Functions
function nextFormStep() {
  const nextBtn = document.getElementById('nextStep');
  if (nextBtn && nextBtn.disabled) {
    return;
  }

  if (validateCurrentStep()) {
    if (currentStep < maxSteps) {
      document.getElementById(`step${currentStep}`).classList.remove('active');
      currentStep++;
      document.getElementById(`step${currentStep}`).classList.add('active');
      updateFormNavigation();
      
      if (currentStep === 3) {
        updateRequestReview();
      }
    }
  }
}

function prevFormStep() {
  if (currentStep > 1) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');
    updateFormNavigation();
  }
}

function updateFormNavigation() {
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  const submitBtn = document.getElementById('submitRequest');
  
  if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
  if (nextBtn) {
    nextBtn.style.display = currentStep < maxSteps ? 'block' : 'none';
    nextBtn.disabled = currentStep === 1 && !selectedRequestType;
  }
  if (submitBtn) submitBtn.style.display = currentStep === maxSteps ? 'block' : 'none';
}

function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      if (!selectedRequestType) {
        showErrorModal('Selection Required', 'Please select a request type to continue.');
        return false;
      }
      return true;
    case 2:
      const destination = document.getElementById('destination')?.value;
      const reason = document.getElementById('reason')?.value;
      const departureTime = document.getElementById('departureTime')?.value;
      const returnTime = document.getElementById('returnTime')?.value;
      const emergencyContact = document.getElementById('emergencyContact')?.value;
      
      if (!destination || !reason || !departureTime || !returnTime || !emergencyContact) {
        showErrorModal('Required Fields', 'Please fill in all required fields.');
        return false;
      }
      
      // Validate timing
      const depTime = new Date(departureTime);
      const retTime = new Date(returnTime);
      const now = new Date();
      
      if (depTime <= new Date(now.getTime() + 30 * 60000)) {
        showErrorModal('Invalid Timing', 'Departure time must be at least 30 minutes from now.');
        return false;
      }
      
      if (retTime <= depTime) {
        showErrorModal('Invalid Timing', 'Return time must be after departure time.');
        return false;
      }
      
      return true;
    default:
      return true;
  }
}

async function updateRequestReview() {
  const reviewSummary = document.getElementById('reviewSummary');
  const currentRiskScore = document.getElementById('currentRiskScore');
  
  if (reviewSummary) {
    reviewSummary.innerHTML = `
      <p><strong>Type:</strong> <span class="request-type ${selectedRequestType}">${selectedRequestType.toUpperCase()}</span></p>
      <p><strong>Destination:</strong> ${document.getElementById('destination')?.value}</p>
      <p><strong>Reason:</strong> ${document.getElementById('reason')?.value}</p>
      <p><strong>Departure:</strong> ${formatDateTime(document.getElementById('departureTime')?.value)}</p>
      <p><strong>Return:</strong> ${formatDateTime(document.getElementById('returnTime')?.value)}</p>
      <p><strong>Emergency Contact:</strong> ${document.getElementById('emergencyContact')?.value}</p>
    `;
  }
  
  if (currentRiskScore && currentUser) {
    try {
      const statsResponse = await window.API.student.getStats();
      const riskScore = statsResponse.riskScore || 0;
      currentRiskScore.textContent = riskScore;
      currentRiskScore.className = `risk-score-badge risk-${getRiskLevel(riskScore)}`;
    } catch (error) {
      console.error('Error getting risk score:', error);
      if (currentRiskScore) {
        currentRiskScore.textContent = 'N/A';
      }
    }
  }
}

async function submitRequest() {
  if (!validateCurrentStep()) return;
  
  try {
    const formData = {
      type: selectedRequestType,
      destination: document.getElementById('destination').value,
      reason: document.getElementById('reason').value,
      departureTime: document.getElementById('departureTime').value,
      returnTime: document.getElementById('returnTime').value,
      emergencyContact: document.getElementById('emergencyContact').value
    };
    
    await window.API.request.create(formData);
    
    showSuccessModal('Request Submitted', 'Request submitted successfully! Notification sent to parent for approval.');
    
    // Reset form
    resetRequestForm();
    
    // Refresh content
    await loadStudentRequests();
    await loadStudentOverview();
    
    // Switch to requests tab
    switchToTab('studentRequests');
  } catch (error) {
    console.error('Error submitting request:', error);
    showErrorModal('Error', error.message || 'Failed to submit request');
  }
}

function getRiskCategory(riskScore) {
  if (riskScore <= 30) return 'low';
  if (riskScore <= 60) return 'medium';  
  return 'high';
}

function resetRequestForm() {
  currentStep = 1;
  selectedRequestType = null;
  
  // Reset form steps
  document.querySelectorAll('.form-step').forEach((step, index) => {
    step.classList.toggle('active', index === 0);
  });
  
  // Reset type selection
  document.querySelectorAll('.outpass-type-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Reset form fields
  const form = document.getElementById('newRequestForm');
  if (form) {
    form.reset();
    // Restore default emergency contact
    const emergencyContactField = document.getElementById('emergencyContact');
    if (emergencyContactField) {
      emergencyContactField.value = '+91-9876543200';
    }
  }
  
  updateFormNavigation();
}

// Profile Management
async function saveProfile() {
  try {
    const profileData = {
      personalInfo: {
        fullName: document.getElementById('fullName').value,
        rollNumber: document.getElementById('rollNumber').value,
        phone: document.getElementById('phoneNumber').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        bloodGroup: document.getElementById('bloodGroup').value
      },
      academicInfo: {
        branch: document.getElementById('branch').value,
        semester: parseInt(document.getElementById('semester').value),
        batch: document.getElementById('batch').value,
        section: document.getElementById('section').value
      },
      hostelInfo: {
        hostelName: document.getElementById('hostelName').value,
        roomNumber: document.getElementById('roomNumber').value
      },
      parentDetails: {
        fatherName: document.getElementById('fatherName').value,
        fatherPhone: document.getElementById('fatherPhone').value,
        fatherEmail: document.getElementById('fatherEmail').value,
        emergencyContactPhone: document.getElementById('emergencyContactPhone').value
      },
      addressInfo: {
        permanentAddress: document.getElementById('permanentAddress').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pinCode: document.getElementById('pinCode').value,
        localGuardianPhone: document.getElementById('localGuardianPhone').value
      }
    };
    
    await window.API.student.updateProfile(profileData);
    showSuccessModal('Profile Saved', 'Your profile has been updated successfully!');
    
    // Refresh overview if needed
    if (currentRole === 'student') {
      await loadStudentOverview();
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showErrorModal('Error', error.message || 'Failed to save profile');
  }
}

// Global function declarations for onclick handlers
window.showApprovalModal = async function(requestId, isApproval) {
  try {
    const response = await window.API.request.getById(requestId);
    const request = response.request;
    if (!request) return;
    
    const modal = document.getElementById('approvalModal');
    const title = document.getElementById('approvalModalTitle');
    const content = document.getElementById('approvalContent');
    const approveBtn = document.getElementById('approveRequest');
    const rejectBtn = document.getElementById('rejectRequest');
    
    if (title) {
      title.textContent = isApproval ? 'Approve Request' : 'Reject Request';
    }
    
    if (content) {
      const student = request.studentId || {};
      content.innerHTML = `
        <div class="approval-summary">
          <h4>Request Summary</h4>
          <p><strong>Student:</strong> ${student.personalInfo?.fullName || 'N/A'}</p>
          <p><strong>Type:</strong> <span class="request-type ${request.type}">${request.type.toUpperCase()}</span></p>
          <p><strong>Destination:</strong> ${request.destination}</p>
          <p><strong>Reason:</strong> ${request.reason}</p>
          <p><strong>Time:</strong> ${formatDateTime(request.departureTime)} - ${formatDateTime(request.returnTime)}</p>
          <p><strong>Risk Score:</strong> <span class="risk-score-badge risk-${getRiskLevel(request.riskScore || 0)}">${request.riskScore || 0}</span></p>
          <div class="workflow-note" style="margin-top: 16px; padding: 12px; background: var(--color-bg-1); border-radius: 6px;">
            ${isApproval ? 
              'If approved, this request will be forwarded to admin for final approval.' : 
              'If rejected, this request will be closed and will not be sent to admin.'}
          </div>
        </div>
      `;
    }
    
    // Update button handlers
    if (approveBtn && rejectBtn) {
      approveBtn.onclick = () => processApproval(requestId, true);
      rejectBtn.onclick = () => processApproval(requestId, false);
    }
    
    if (modal) modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading request for approval:', error);
    showErrorModal('Error', 'Failed to load request details');
  }
};

window.processApproval = async function(requestId, approved) {
  try {
    const comments = document.getElementById('approvalComments')?.value || '';
    
    await window.API.request.parentApprove(requestId, approved, comments);
    
    if (approved) {
      showSuccessModal('Request Approved', 'Request has been approved and forwarded to admin for final approval.');
    } else {
      showSuccessModal('Request Rejected', 'Request has been rejected and closed.');
    }
    
    closeModal('approvalModal');
    
    // Refresh content
    if (currentRole === 'parent') {
      await loadParentApprovals();
      await loadParentActivity();
      await loadParentOverview();
    }
  } catch (error) {
    console.error('Error processing approval:', error);
    showErrorModal('Error', error.message || 'Failed to process approval');
  }
};

window.adminApproveRequest = async function(requestId, approved) {
  try {
    const comments = approved 
      ? 'Approved. Please follow curfew timings and return on time.'
      : 'Request rejected by admin after review.';
    
    await window.API.request.adminApprove(requestId, approved, comments);
    
    if (approved) {
      showSuccessModal('Request Approved', 'Request approved! QR code generated and student notified.');
    } else {
      showSuccessModal('Request Rejected', 'Request has been rejected.');
    }
    
    // Refresh admin content
    await loadAdminQueue();
    await loadAdminOverview();
  } catch (error) {
    console.error('Error processing admin approval:', error);
    showErrorModal('Error', error.message || 'Failed to process approval');
  }
};

window.openRequestDetails = async function(requestId) {
  try {
    const response = await window.API.request.getById(requestId);
    const request = response.request;
    
    if (!request) return;
    
    const student = request.studentId || {};
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    if (title) title.textContent = 'Request Details';
    
    if (body) {
      body.innerHTML = `
        <div class="request-details-full">
          <div class="detail-section">
            <h4>Student Information</h4>
            <p><strong>Name:</strong> ${student.personalInfo?.fullName || 'N/A'}</p>
            <p><strong>ID:</strong> ${student.personalInfo?.rollNumber || 'N/A'}</p>
            <p><strong>Hostel:</strong> ${student.hostelInfo?.hostelName || 'N/A'}, Room ${student.hostelInfo?.roomNumber || 'N/A'}</p>
            <p><strong>Branch:</strong> ${student.academicInfo?.branch || 'N/A'} • Semester ${student.academicInfo?.semester || 'N/A'}</p>
            <p><strong>Risk Score:</strong> <span class="risk-score-badge risk-${getRiskLevel(request.riskScore || 0)}">${request.riskScore || 0}</span></p>
            <p><strong>Parent:</strong> ${student.parentDetails?.fatherName || 'N/A'} (${student.parentDetails?.fatherPhone || 'N/A'})</p>
          </div>
          
          <div class="detail-section">
            <h4>Request Details</h4>
            <p><strong>Type:</strong> <span class="request-type ${request.type}">${request.type.toUpperCase()}</span></p>
            <p><strong>Destination:</strong> ${request.destination}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Departure:</strong> ${formatDateTime(request.departureTime)}</p>
            <p><strong>Return:</strong> ${formatDateTime(request.returnTime)}</p>
            <p><strong>Created:</strong> ${formatDateTime(request.createdAt)}</p>
          </div>
          
          <div class="detail-section">
            <h4>Approval Workflow</h4>
            <p><strong>Current Status:</strong> <span class="status status--${getStatusClass(request.status)}">${getStatusLabel(request.status)}</span></p>
            
            <div style="margin: 16px 0; padding: 12px; background: var(--color-bg-1); border-radius: 6px;">
              <strong>Workflow:</strong> Student → Parent → Admin<br>
              <small>Parent rejection ends the request (admin never sees it)</small>
            </div>
            
            <p><strong>Parent Status:</strong> ${request.parentApproval ? '✅ Approved' : (request.status === 'parent_rejected' ? '❌ Rejected' : (request.status === 'pending_parent' ? '⏳ Pending' : '❌ Not Started'))}</p>
            <p><strong>Admin Status:</strong> ${request.adminApproval ? '✅ Approved' : (request.status === 'parent_approved' ? '⏳ Pending' : '❌ Not Started')}</p>
            
            ${request.parentApprovedAt ? `<p><strong>Parent Approved:</strong> ${formatDateTime(request.parentApprovedAt)}</p>` : ''}
            ${request.parentRejectedAt ? `<p><strong>Parent Rejected:</strong> ${formatDateTime(request.parentRejectedAt)}</p>` : ''}
            ${request.adminApprovedAt ? `<p><strong>Admin Approved:</strong> ${formatDateTime(request.adminApprovedAt)}</p>` : ''}
            
            ${request.parentComments ? `<p><strong>Parent Comments:</strong> ${request.parentComments}</p>` : ''}
            ${request.adminComments ? `<p><strong>Admin Comments:</strong> ${request.adminComments}</p>` : ''}
          </div>
          
          ${request.qrCode ? `
            <div class="detail-section">
              <h4>QR Code Information</h4>
              <div class="qr-info">
                <div class="qr-code-small" style="padding: 12px; background: white; color: black; font-family: monospace; border-radius: 4px; display: inline-block;">${request.qrCode}</div>
                <div>
                  <p><strong>Generated:</strong> ${formatDateTime(request.qrGeneratedAt)}</p>
                  <p><strong>Expires:</strong> ${formatDateTime(request.qrExpiresAt)}</p>
                  <p><strong>Status:</strong> ${new Date(request.qrExpiresAt) > new Date() ? 'Valid' : 'Expired'}</p>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    if (modal) modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading request details:', error);
    showErrorModal('Error', 'Failed to load request details');
  }
};

// Admin violation alert handlers
window.viewViolationDetails = function(alertId) {
  const alert = appData.violationAlerts.find(a => a.id === alertId);
  if (!alert) return;
  
  showSuccessModal('Violation Details', `${alert.studentName} - ${alert.violationType} on ${formatDate(alert.violationDate)}`);
};

window.addRestriction = function(studentId) {
  showSuccessModal('Restriction Added', 'Restriction has been added to the student account.');
};

window.contactParent = function(studentId) {
  const student = appData.student;
  showSuccessModal('Contact Parent', `Calling ${student.parentDetails.fatherName} at ${student.parentDetails.fatherPhone}`);
};

window.downloadQR = function(qrCode) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 300;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 300, 300);
  ctx.fillStyle = 'black';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(qrCode, 150, 150);
  
  const link = document.createElement('a');
  link.download = `outpass-qr-${qrCode}.png`;
  link.href = canvas.toDataURL();
  link.click();
};

window.shareQR = function(qrCode) {
  if (navigator.share) {
    navigator.share({
      title: 'Outpass QR Code',
      text: `My outpass QR code: ${qrCode}`,
    });
  } else {
    navigator.clipboard.writeText(qrCode).then(() => {
      showSuccessModal('QR Code Copied', 'QR code has been copied to clipboard.');
    });
  }
};

window.switchToTab = function(tabId, opts) {
  const options = typeof opts === 'object' && opts !== null ? opts : {};

  if (tabId === 'createRequest' && options.resetForm !== false) {
    resetRequestForm();
  }

  const tab = document.querySelector(`[data-target="${tabId}"]`);
  if (tab) {
    switchTab(tabId, tab);
  }
};

function createEmergencyRequest() {
  if (currentRole !== 'student') {
    showErrorModal('Access Denied', 'Only students can create emergency requests.');
    return;
  }
  
  switchToTab('createRequest');
  
  // Auto-select emergency type
  setTimeout(() => {
    const emergencyCard = document.querySelector('[data-type="emergency"]');
    if (emergencyCard) {
      selectRequestType(emergencyCard);
      emergencyCard.style.borderColor = 'var(--color-error)';
      emergencyCard.style.boxShadow = '0 0 0 2px rgba(var(--color-error-rgb), 0.2)';
    }
  }, 100);
}

function startCountdown(endTime) {
  if (countdownInterval) clearInterval(countdownInterval);
  
  const timerElement = document.getElementById('qrTimer');
  if (!timerElement) return;
  
  countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = end - now;
    
    if (remaining > 0) {
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      if (remaining < 60 * 60 * 1000) { 
        timerElement.style.color = 'var(--color-error)';
      } else if (remaining < 2 * 60 * 60 * 1000) { 
        timerElement.style.color = 'var(--color-warning)';
      }
    } else {
      timerElement.textContent = 'EXPIRED';
      timerElement.style.color = 'var(--color-error)';
      clearInterval(countdownInterval);
    }
  }, 1000);
}

// Modal Functions
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function showSuccessModal(title, message) {
  const modal = document.getElementById('successModal');
  const titleEl = document.getElementById('successTitle');
  const messageEl = document.getElementById('successMessage');
  const okBtn = document.getElementById('successOkBtn');
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (okBtn) {
    okBtn.onclick = () => closeModal('successModal');
  }
  if (modal) modal.classList.remove('hidden');
}

function showErrorModal(title, message) {
  const modal = document.getElementById('errorModal');
  const titleEl = document.getElementById('errorTitle');
  const messageEl = document.getElementById('errorMessage');
  const okBtn = document.getElementById('errorOkBtn');
  
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (okBtn) {
    okBtn.onclick = () => closeModal('errorModal');
  }
  if (modal) modal.classList.remove('hidden');
}

function backToRoles() {
  // Clean up
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  // Logout
  window.API.auth.logout();
  
  // Reset state
  currentRole = null;
  currentUser = null;
  currentStep = 1;
  selectedRequestType = null;
  
  // Show login page
  showLoginPage();
}

function showLandingPage() {
  const landingPage = document.getElementById('landingPage');
  const mainApp = document.getElementById('mainApp');
  
  if (landingPage) landingPage.classList.remove('hidden');
  if (mainApp) mainApp.classList.add('hidden');
}

// Utility Functions
function normalizeRiskScore(score) {
  if (score === null || score === undefined) return null;
  const value = typeof score === 'number' ? score : parseFloat(score);
  if (!Number.isFinite(value)) return null;

  if (Math.abs(value) <= 1) {
    return Math.round(value * 1000) / 10; // scale probabilities (0-1) to 0-100 with 1 decimal
  }

  const clamped = Math.min(Math.max(value, 0), 100);
  return Math.round(clamped * 10) / 10;
}

function formatRiskScore(score) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '--';
  }
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function renderRiskScoreSection(request, options = {}) {
  const requestRisk = normalizeRiskScore(request?.riskScore);
  const overallRisk = normalizeRiskScore(request?.studentRiskScore ?? request?.overallRiskScore);
  const threshold = options.threshold ?? 5;
  const hasRequestRisk = requestRisk !== null;
  const hasOverallRisk = overallRisk !== null;
  const primaryScore = hasOverallRisk ? overallRisk : (hasRequestRisk ? requestRisk : null);
  const primaryLabel = hasOverallRisk
    ? (options.overallLabel || 'Student Risk')
    : (hasRequestRisk ? (options.requestLabel || 'Request Risk') : (options.singleLabel || 'Risk Score'));
  const primaryLevel = getRiskLevel(primaryScore || 0);

  const showSecondary = hasRequestRisk && hasOverallRisk && Math.abs(requestRisk - overallRisk) > threshold;
  const secondaryLabel = options.requestLabel || 'Request Risk';

  return `
    <div class="risk-score-group">
      <div class="risk-score-badge risk-${primaryLevel}">
        ${primaryLabel}: ${formatRiskScore(primaryScore)}
      </div>
      ${showSecondary ? `
        <div class="risk-score-secondary risk-${getRiskLevel(requestRisk)}">
          ${secondaryLabel}: ${formatRiskScore(requestRisk)}
        </div>
      ` : ''}
    </div>
  `;
}

function isRequestActive(request) {
  if (!request || request.status !== 'approved' || !request.qrCode) {
    return false;
  }

  const now = new Date();
  const returnTime = request.returnTime ? new Date(request.returnTime) : null;
  const actualReturn = request.actualReturnTime ? new Date(request.actualReturnTime) : null;

  if (actualReturn && actualReturn <= now) {
    return false;
  }

  if (returnTime && returnTime <= now) {
    return false;
  }

  return true;
}

function createRequestCard(request, detailed = false) {
  const student = request.studentId || {};
  const requestId = request._id || request.id;
  
  return `
    <div class="request-header">
      <div class="request-type ${request.type}">${request.type.toUpperCase()}</div>
      <div class="status status--${getStatusClass(request.status)}">${getStatusLabel(request.status)}</div>
    </div>
    <div class="request-details">
      ${detailed && student.personalInfo ? `<h4>${student.personalInfo.fullName}</h4>` : ''}
      <h4>${request.destination}</h4>
      <p>${request.reason}</p>
    </div>
    <div class="request-meta">
      <div>
        <strong>Departure:</strong><br>
        ${formatDateTime(request.departureTime)}
      </div>
      <div>
        <strong>Return:</strong><br>
        ${formatDateTime(request.returnTime)}
      </div>
    </div>
    <div class="risk-score-section">
      ${renderRiskScoreSection(request, {
        requestLabel: 'Request Risk',
        overallLabel: 'Student Risk',
        singleLabel: 'Risk Score'
      })}
    </div>
  `;
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'Not specified';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not specified';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getStatusClass(status) {
  const statusMap = {
    'approved': 'success',
    'rejected': 'error',
    'parent_rejected': 'error',
    'pending_parent': 'warning',
    'parent_approved': 'info',
    'expired': 'error',
    'draft': 'info'
  };
  return statusMap[status] || 'info';
}

function getStatusLabel(status) {
  const labelMap = {
    'approved': 'Final Approved',
    'rejected': 'Admin Rejected',
    'parent_rejected': 'Parent Rejected',
    'pending_parent': 'Pending Parent',
    'parent_approved': 'Parent Approved',
    'expired': 'Expired',
    'draft': 'Draft'
  };
  return labelMap[status] || status;
}

function getRiskLevel(score) {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

console.log('Smart Hostel Access Control System - Light Mode Version - Loaded successfully!');