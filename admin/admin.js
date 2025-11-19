// Admin Dashboard JavaScript
const API_BASE_URL = '../api'; // Adjust based on your setup
let authToken = null;
let currentSeriesData = [];
let currentFilesData = [];

// Custom Notification System
function showNotification(message, type = 'success') {
    const popup = document.getElementById('notificationPopup');
    if (!popup) {
        // Fallback: no notification container on this page (e.g., login page). Use alert as fallback.
        try { console.warn('Notification:', message); } catch (e) {}
        return;
    }

    const messageEl = popup.querySelector('.notification-message');
    if (messageEl) messageEl.textContent = message;
    popup.className = 'notification-popup ' + type;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// Custom Confirmation Dialog
function showConfirmation(message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirmationDialog');
        if (!dialog) {
            // No custom dialog on this page; fallback to a simple confirm
            resolve(window.confirm(message));
            return;
        }

        const messageEl = dialog.querySelector('.confirmation-message');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        messageEl.textContent = message;
        dialog.classList.add('show');
        
        const handleOk = () => {
            dialog.classList.remove('show');
            if (okBtn) okBtn.removeEventListener('click', handleOk);
            if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        
        const handleCancel = () => {
            dialog.classList.remove('show');
            if (okBtn) okBtn.removeEventListener('click', handleOk);
            if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };
        
        if (okBtn) okBtn.addEventListener('click', handleOk);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
    });
}

// Theme Management
const THEME_KEY = "admin-theme";

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const defaultTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = savedTheme || defaultTheme;
    applyTheme(theme);
}

function applyTheme(theme) {
    document.body.classList.toggle("dark-theme", theme === "dark");
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.innerHTML = theme === "dark" ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    }
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark-theme");
    applyTheme(isDark ? "light" : "dark");
}

// Initialize theme on page load
initTheme();

// Theme toggle button
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
});

// Helper to detect whether we're on the dashboard or login page
function isDashboardPage() {
    return !!document.getElementById('dashboard');
}

function isLoginPage() {
    return !!document.getElementById('loginPage');
}

// Fullscreen toggle for modals
function toggleFullscreen() {
    const modal = document.getElementById('fileModal');
    const icon = document.getElementById('fullscreenIcon');
    if (!modal) return;
    if (!icon) return;

    if (modal.classList.contains('fullscreen')) {
        modal.classList.remove('fullscreen');
        icon.className = 'ri-fullscreen-line';
    } else {
        modal.classList.add('fullscreen');
        icon.className = 'ri-fullscreen-exit-line';
    }
}

// Auto-setup: Create default admin if not exists
async function autoSetup() {
    try {
        const response = await fetch(`${API_BASE_URL}/init/setup.php`);
        const result = await response.json();
        
        if (result.success && result.created) {
            console.log('Default admin created:', result.credentials);
        }
    } catch (error) {
        console.error('Auto-setup error:', error);
    }
}

// Check if user is logged in
function checkAuth() {
    authToken = localStorage.getItem('admin_token');
    if (authToken) {
        // If on the login page and already authenticated, navigate to the dashboard page
        if (isLoginPage() && !isDashboardPage()) {
            window.location.href = 'dashboard.html';
            return;
        }

        // If on the dashboard, initialize dashboard UI
        if (isDashboardPage()) {
            showDashboard();
            // Load initial dashboard data, then restore the section from URL/localStorage
            // so that the "Files" tab (and others) have the series list available.
            loadDashboardData().then(() => {
                restoreSectionFromURL();
            }).catch(() => {
                // If data load failed, still attempt to restore the section
                restoreSectionFromURL();
            });
        }
    } else {
        // If not authenticated and on a dashboard page, redirect to login
        if (isDashboardPage()) {
            window.location.href = 'index.html';
            return;
        }

        // If on login page, show the login block
        if (isLoginPage()) {
            showLogin();
        }
    }
}

function showLogin() {
    const loginPage = document.getElementById('loginPage');
    if (loginPage) loginPage.style.display = 'flex';
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.remove('show');
}

function showDashboard() {
    const loginPage = document.getElementById('loginPage');
    if (loginPage) loginPage.style.display = 'none';
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.classList.add('show');
        const username = localStorage.getItem('admin_username');
        if (username) {
            const adminUsernameEl = document.getElementById('adminUsername');
            if (adminUsernameEl) adminUsernameEl.textContent = username;
        }
    }
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            authToken = result.data.token;
            localStorage.setItem('admin_token', authToken);
            localStorage.setItem('admin_username', result.data.username);
            // Redirect authenticated user to the dashboard page
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = result.message || 'Login failed';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        errorMsg.textContent = 'Connection error. Please try again.';
        errorMsg.classList.add('show');
    }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmation('Are you sure you want to logout?');
    if (!confirmed) return;
    
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    authToken = null;
    clearModalState();
    // After logout, go back to login page
    showLogin();
    window.location.href = 'index.html';
    showNotification('Logged out successfully', 'success');
});

}

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
if (navLinks) {
    navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        
        // Update active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Update URL with current section so it persists across reloads
        updateURLSection(section);
        // Also store in localStorage as a fallback so the dashboard restores to the same
        // active tab even when URL params are stripped by some proxies or internal navigation.
        try {
            localStorage.setItem('admin_active_section', section);
        } catch (e) {}

        // Load data for section
        if (section === 'series') {
            loadSeriesData();
        } else if (section === 'files') {
            loadFilesData();
        }
    });
    });
}

// Persist active tab to URL using ?section=... and restore on page load
function updateURLSection(section) {
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('section', section);
        history.replaceState(null, '', url.toString());
    } catch (e) {
        // Fallback for older browsers: set hash
        window.location.hash = section;
    }
}

function restoreSectionFromURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        // Prefer explicit URL param first, then hash, then saved value in localStorage.
        let section = params.get('section') || window.location.hash.replace('#','') || localStorage.getItem('admin_active_section') || 'overview';

        // If invalid section, fallback to overview
        const targetLink = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (!targetLink) {
            section = 'overview';
        }

        // Activate the section programmatically (if not already active)
        const link = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (link && !link.classList.contains('active')) link.click();
        // Restore any open modal/editor after section is active
        setTimeout(() => {
            restoreModalFromStorage();
        }, 50);
    } catch (e) {
        // No-op; keep default active
    }
}

// Modal state persistence helpers (used to restore editor/modal after reload)
function saveModalState(obj) {
    try {
        localStorage.setItem('admin_modal', JSON.stringify(obj));
    } catch (e) {}
}

function clearModalState() {
    try {
        localStorage.removeItem('admin_modal');
    } catch (e) {}
}

async function restoreModalFromStorage() {
    try {
        const raw = localStorage.getItem('admin_modal');
        if (!raw) return;

        const modal = JSON.parse(raw);
        if (!modal || !modal.type) return;

        // Make sure series data is loaded so editSeries and other flows can find the resource
        await loadSeriesData();
        // If the saved modal type belongs to a different section, ensure the section is active
        if (modal.type === 'series') {
            const link = document.querySelector('.nav-link[data-section="series"]');
            if (link && !link.classList.contains('active')) link.click();
            // open series modal
            editSeries(modal.code);
        } else if (modal.type === 'file') {
            const link = document.querySelector('.nav-link[data-section="files"]');
            if (link && !link.classList.contains('active')) link.click();
            // open file modal (edit)
            editFile(modal.series, modal.number);
        } else if (modal.type === 'editor') {
            const link = document.querySelector('.nav-link[data-section="files"]');
            if (link && !link.classList.contains('active')) link.click();
            // open editor panel
            openEditorPanel(modal.series, modal.number);
        }
    } catch (e) {
        console.error('Failed to restore modal from storage', e);
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load series count
        const seriesResponse = await fetch(`${API_BASE_URL}/series/get_all.php`);
        const seriesResult = await seriesResponse.json();
        if (seriesResult.success) {
            document.getElementById('totalSeries').textContent = seriesResult.data.length;
            currentSeriesData = seriesResult.data;
            populateSeriesFilters();
        }
        
        // Load total files count (you'd need to create an API for this, or count manually)
        let totalFiles = 0;
        for (const series of currentSeriesData) {
            const filesResponse = await fetch(`${API_BASE_URL}/files/get_by_series.php?series=${series.code}`);
            const filesResult = await filesResponse.json();
            if (filesResult.success) {
                totalFiles += filesResult.data.files.length;
            }
        }
        document.getElementById('totalFiles').textContent = totalFiles;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Populate series filters
function populateSeriesFilters() {
    const filterSelect = document.getElementById('fileSeriesFilter');
    const formSelect = document.getElementById('fileSeriesCode');
    const editorSelect = document.getElementById('editorSeriesCode');
    
    filterSelect.innerHTML = '<option value="">All Series</option>';
    formSelect.innerHTML = '<option value="">Select Series</option>';
    editorSelect.innerHTML = '<option value="">Select Series</option>';
    
    currentSeriesData.forEach(series => {
        const option1 = document.createElement('option');
        option1.value = series.code;
        option1.textContent = series.name;
        filterSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = series.code;
        option2.textContent = series.name;
        formSelect.appendChild(option2);

        const option3 = document.createElement('option');
        option3.value = series.code;
        option3.textContent = series.name;
        editorSelect.appendChild(option3);
    });
}

// Load Series Data
async function loadSeriesData() {
    try {
        const response = await fetch(`${API_BASE_URL}/series/get_all.php`);
        const result = await response.json();
        
        if (result.success) {
            currentSeriesData = result.data;
            renderSeriesTable(result.data);
        }
    } catch (error) {
        console.error('Error loading series:', error);
    }
}

function renderSeriesTable(series) {
    const tbody = document.querySelector('#seriesTable tbody');
    tbody.innerHTML = '';
    
    series.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.code}</td>
            <td>${s.name}</td>
            <td><i class="${s.icon}"></i> ${s.icon}</td>
            <td>${s.order}</td>
            <td><span style="color: green;">Active</span></td>
            <td>
                <button class="btn-small btn-edit" onclick="editSeries('${s.code}')">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteSeries('${s.code}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Series Modal Functions
function showAddSeriesModal() {
    document.getElementById('seriesModalTitle').textContent = 'Add Series';
    document.getElementById('seriesForm').reset();
    document.getElementById('seriesId').value = '';
    document.getElementById('seriesModal').classList.add('show');
}

function closeSeriesModal() {
    document.getElementById('seriesModal').classList.remove('show');
    clearModalState();
}

function editSeries(code) {
    const series = currentSeriesData.find(s => s.code === code);
    if (!series) return;
    
    document.getElementById('seriesModalTitle').textContent = 'Edit Series';
    document.getElementById('seriesCode').value = series.code;
    document.getElementById('seriesName').value = series.name;
    document.getElementById('seriesIcon').value = series.icon;
    document.getElementById('seriesOrder').value = series.order;
    // Save series id to hidden field so submit handler can detect update
    document.getElementById('seriesId').value = series.id || '';
    document.getElementById('seriesModal').classList.add('show');
    // Save modal state so we can restore the open modal after a reload
    saveModalState({ type: 'series', code });
}

async function deleteSeries(code) {
    const confirmed = await showConfirmation('Are you sure you want to delete this series? This will also delete all associated files.');
    if (!confirmed) return;
    
    const series = currentSeriesData.find(s => s.code === code);
    if (!series) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/series/delete.php?id=${series.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Series deleted successfully', 'success');
            loadSeriesData();
            loadDashboardData();
        } else {
            showNotification('Error deleting series: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection error while deleting series.', 'error');
    }
}

// Series Form Submit
const seriesForm = document.getElementById('seriesForm');
if (seriesForm) {
    seriesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        code: document.getElementById('seriesCode').value,
        name: document.getElementById('seriesName').value,
        icon: document.getElementById('seriesIcon').value || 'ri-code-line',
        display_order: parseInt(document.getElementById('seriesOrder').value) || 0,
        is_active: true
    };
    
    try {
        const isEdit = document.getElementById('seriesId').value;
        let response;

        if (isEdit) {
            // Update existing series
            const payload = {
                id: parseInt(isEdit),
                code: data.code,
                name: data.name,
                icon: data.icon,
                display_order: data.display_order,
                is_active: data.is_active
            };

            response = await fetch(`${API_BASE_URL}/series/update.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new series
            response = await fetch(`${API_BASE_URL}/series/create.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Series saved successfully!', 'success');
            closeSeriesModal();
            // Clear hidden id after save
            document.getElementById('seriesId').value = '';
            loadSeriesData();
            loadDashboardData();
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
    });
}

// Load Files Data
async function loadFilesData(filterSeries = '') {
    try {
        // Ensure we have series data before loading files. This prevents empty results
        // when the admin reloads the page while on the "Files" tab.
        if (!currentSeriesData || currentSeriesData.length === 0) {
            await loadSeriesData();
        }
        currentFilesData = [];
        
        const seriesToLoad = filterSeries ? [filterSeries] : currentSeriesData.map(s => s.code);
        
        for (const seriesCode of seriesToLoad) {
            const response = await fetch(`${API_BASE_URL}/files/get_by_series.php?series=${seriesCode}`);
            const result = await response.json();
            
            if (result.success && result.data.files) {
                result.data.files.forEach(file => {
                    currentFilesData.push({
                        ...file,
                        series: seriesCode
                    });
                });
            }
        }
        
        renderFilesTable(currentFilesData);
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

function renderFilesTable(files) {
    const tbody = document.querySelector('#filesTable tbody');
    tbody.innerHTML = '';
    
    files.forEach(f => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${f.series}</td>
            <td>${f.number}</td>
            <td>${f.title}</td>
            <td><span style="color: green;">Active</span></td>
            <td>
                <button class="btn-small btn-edit" onclick="openEditorPanel('${f.series}', ${f.number})">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteFile(${f.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// File series filter
const fileSeriesFilter = document.getElementById('fileSeriesFilter');
if (fileSeriesFilter) {
    fileSeriesFilter.addEventListener('change', (e) => {
        loadFilesData(e.target.value);
    });
}
// End file series filter binding

// File Modal Functions
function showAddFileModal() {
    document.getElementById('fileModalTitle').textContent = 'Add File';
    document.getElementById('fileForm').reset();
    document.getElementById('fileId').value = '';
    document.getElementById('fileModal').classList.add('show');
}

function closeFileModal() {
    document.getElementById('fileModal').classList.remove('show');
    clearModalState();
}

async function editFile(series, number) {
    try {
        const response = await fetch(`${API_BASE_URL}/files/get_single.php?series=${series}&number=${number}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            document.getElementById('fileModalTitle').textContent = 'Edit File';
            document.getElementById('fileId').value = result.data.id;
            document.getElementById('fileSeriesCode').value = series;
            document.getElementById('fileNumber').value = result.data.number;
            document.getElementById('fileTitle').value = result.data.title;
            document.getElementById('fileContent').value = result.data.content;
            document.getElementById('fileModal').classList.add('show');
            saveModalState({ type: 'file', series, number });
        }
    } catch (error) {
        showNotification('Error loading file content', 'error');
    }
}

// Editor Panel Functions
async function openEditorPanel(series, number) {
    try {
        const response = await fetch(`${API_BASE_URL}/files/get_single.php?series=${series}&number=${number}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            document.getElementById('editorPanelTitle').textContent = `Edit: ${result.data.title}`;
            document.getElementById('editorFileId').value = result.data.id;
            document.getElementById('editorSeriesCode').value = series;
            document.getElementById('editorFileNumber').value = result.data.number;
            document.getElementById('editorFileTitle').value = result.data.title;
            document.getElementById('editorFileContent').value = result.data.content;
            document.getElementById('editorPanel').classList.add('show');
                    // Save modal/editor state to restore after reload
                    saveModalState({ type: 'editor', series, number });
        }
    } catch (error) {
        showNotification('Error loading file content', 'error');
    }
}

function closeEditorPanel() {
    document.getElementById('editorPanel').classList.remove('show');
    clearModalState();
}

async function deleteFile(fileId) {
    const confirmed = await showConfirmation('Are you sure you want to delete this file? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/files/delete.php?id=${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File deleted successfully!', 'success');
            loadFilesData();
            loadDashboardData();
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
}

// File Form Submit
const fileForm = document.getElementById('fileForm');
if (fileForm) {
    fileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileId = document.getElementById('fileId').value;
    const isEdit = fileId !== '';
    
    const data = {
        series_code: document.getElementById('fileSeriesCode').value,
        file_number: parseInt(document.getElementById('fileNumber').value),
        title: document.getElementById('fileTitle').value,
        content: document.getElementById('fileContent').value,
        is_active: true
    };
    
    if (isEdit) {
        data.id = parseInt(fileId);
    }
    
    try {
        const url = isEdit ? `${API_BASE_URL}/files/update.php` : `${API_BASE_URL}/files/create.php`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File saved successfully!', 'success');
            closeFileModal();
            loadFilesData();
            loadDashboardData();
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
    });
}

// Editor Form Submit
const editorForm = document.getElementById('editorForm');
if (editorForm) {
    editorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileId = document.getElementById('editorFileId').value;
    
    const data = {
        id: parseInt(fileId),
        series_code: document.getElementById('editorSeriesCode').value,
        file_number: parseInt(document.getElementById('editorFileNumber').value),
        title: document.getElementById('editorFileTitle').value,
        content: document.getElementById('editorFileContent').value,
        is_active: true
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/files/update.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File updated successfully!', 'success');
            closeEditorPanel();
            loadFilesData();
            loadDashboardData();
        } else {
            showNotification('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection error. Please try again.', 'error');
    }
    });
}

// Initialize
if (isLoginPage()) {
    // Only run auto-setup from the login page, not on the dashboard
    autoSetup(); // Run auto-setup first
}
checkAuth();
