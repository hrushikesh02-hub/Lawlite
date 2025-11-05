var SessionManager = class {
    constructor() {
        this.currentUser = null;
        this.apiBase = 'http://127.0.0.1:5000';
        this.init();
    }

    init() {
        // Check if user is logged in from localStorage
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        // Check session with backend
        this.checkSession();
        
        // Initialize navbar
        this.updateNavbar();
    }

    async checkSession() {
        try {
            const response = await this.apiCall('/check-auth');
            if (response.authenticated) {
                // If we don't have user data but backend says we're authenticated
                if (!this.currentUser && response.user) {
                    this.currentUser = response.user;
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                    this.updateNavbar();
                }
            } else {
                // Clear if backend says we're not authenticated
                this.clearSession();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            // On error, maintain current state but don't update
        }
    }

    async login(userData) {
        this.currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.updateNavbar();
    }

    logout() {
        this.clearSession();
        
        // Call backend logout
        this.apiCall('/logout', 'POST').catch(console.error);
        
        // Redirect if on profile page
        if (window.location.pathname.includes('profile')) {
            window.location.href = '../home/index.html';
        }
    }

    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateNavbar();
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUser(updatedData) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...updatedData };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateNavbar();
        }
    }

    // Update navbar based on login status
    updateNavbar() {
        const profileIconContainer = document.getElementById('profileIconContainer');
        const loginNavItem = document.getElementById('loginNavItem');
        
        if (this.isLoggedIn()) {
            // Show profile icon, hide login link
            if (profileIconContainer) profileIconContainer.style.display = 'block';
            if (loginNavItem) loginNavItem.style.display = 'none';
        } else {
            // Hide profile icon, show login link
            if (profileIconContainer) profileIconContainer.style.display = 'none';
            if (loginNavItem) loginNavItem.style.display = 'block';
        }
    }

    // API call method
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
};

// Create global session manager
if (typeof sessionManager === 'undefined') {
    var sessionManager = new SessionManager();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof sessionManager !== 'undefined') {
        // Setup logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                sessionManager.logout();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('profileDropdown');
            const profileBtn = document.getElementById('profileIconBtn');
            
            if (dropdown && profileBtn && !profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Toggle dropdown on button click (for mobile)
        const profileBtn = document.getElementById('profileIconBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = document.getElementById('profileDropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
    }
});