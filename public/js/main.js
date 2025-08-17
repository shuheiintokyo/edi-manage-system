// Global JavaScript for EDI Management System

document.addEventListener('DOMContentLoaded', function() {
    console.log('EDI Management System loaded');
    
    // Check authentication status periodically
    setInterval(checkAuthStatus, 5 * 60 * 1000); // Check every 5 minutes
    
    // Add activity tracking
    trackPageActivity();
});

// Check if user is still authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            // Redirect to login if session expired
            window.location.href = '/auth/login?message=session_expired';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Track page activity and user interactions
function trackPageActivity() {
    // Track page load time
    const loadTime = performance.now();
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    
    // Track clicks on navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log(`Navigation clicked: ${this.href}`);
        });
    });
    
    // Track form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            console.log(`Form submitted: ${this.action}`);
        });
    });
    
    // Track button clicks
    const buttons = document.querySelectorAll('button[type="button"], .primary-btn, .secondary-btn, .action-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log(`Button clicked: ${this.textContent}`);
        });
    });
}

// Utility function to format timestamps
function formatTimestamp(date) {
    return new Date(date).toLocaleString();
}

// Show loading indicator
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

// Hide loading indicator
function hideLoading(elementId) {
    const loadingElement = document.querySelector(`#${elementId} .loading`);
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Generic error handler
function handleError(error, context = 'Operation') {
    console.error(`${context} error:`, error);
    alert(`${context} failed. Please try again.`);
}

// Session management functions
const SessionManager = {
    // Extend session on user activity
    extendSession: function() {
        fetch('/auth/status', { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                if (!data.authenticated) {
                    window.location.href = '/auth/login?message=session_expired';
                }
            })
            .catch(error => console.error('Session extension error:', error));
    },
    
    // Logout function
    logout: function() {
        if (confirm('Are you sure you want to logout?')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/auth/logout';
            document.body.appendChild(form);
            form.submit();
        }
    },
    
    // Auto-logout warning
    showLogoutWarning: function(minutes = 5) {
        const warning = document.createElement('div');
        warning.className = 'logout-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <p>Your session will expire in ${minutes} minutes due to inactivity.</p>
                <button onclick="SessionManager.extendSession(); this.parentElement.parentElement.remove();">Stay Logged In</button>
                <button onclick="SessionManager.logout();">Logout Now</button>
            </div>
        `;
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f39c12;
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(warning);
        
        // Auto-remove after 1 minute if no action
        setTimeout(() => {
            if (document.body.contains(warning)) {
                warning.remove();
            }
        }, 60000);
    }
};

// Data management utilities
const DataManager = {
    // Fetch protected data
    fetchData: async function(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            handleError(error, 'Data fetch');
            return null;
        }
    },
    
    // Submit data
    submitData: async function(endpoint, data, method = 'POST') {
        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Data submission');
            return null;
        }
    }
};

// UI Utilities
const UIUtils = {
    // Show notification
    showNotification: function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    },
    
    // Confirm dialog
    confirm: function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SessionManager, DataManager, UIUtils };
}