document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    if (typeof NotificationService !== 'undefined') {
        NotificationService.init();
    }

    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('logout-btn')) {
            handleLogout(e);
        }
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    // Setup logout functionality
    if (window.location.pathname.includes('profile.html')) {
        initializeProfile();
    }
});

// Updates the UI based on the authentication state
function updateAuthUI() {
    const isLoggedIn = checkIfLoggedIn();
    const header = document.querySelector('.header__container');

    if (!header) return;

    const navElements = header.querySelectorAll('.header__nav');

    if (navElements.length < 2) return;

    const authNav = navElements[1];

    const isHomePage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname.split('/').pop() === '';

    const loginPath = isHomePage ? './pages/login.html' : './login.html';
    const registerPath = isHomePage ? './pages/register.html' : './register.html';
    const profilePath = isHomePage ? './pages/profile.html' : './profile.html';

    if (isLoggedIn) {
        // User is logged in
        authNav.innerHTML = '<a href="#" class="header__nav-item logout-btn">Log Out</a>';

        // Show "My Profile" in the first nav
        const firstNav = navElements[0];
        const profileLink = firstNav.querySelector(`a[href="${profilePath}"]`);

        if (profileLink) {
            profileLink.classList.remove('hidden');
        }
    } else {
        // User is not logged in
        authNav.innerHTML = `
            <a href="${loginPath}" class="header__nav-item">Login</a>
            <a href="${registerPath}" class="header__nav-item">Sign Up</a>
        `;

        // Hide "My Profile" in the first nav
        const firstNav = navElements[0];
        const profileLink = firstNav.querySelector(`a[href="${profilePath}"]`);

        if (profileLink) {
            profileLink.classList.add('hidden');
        }
    }
}

// Logout action
function handleLogout(e) {
    e.preventDefault();

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    updateAuthUI();

    // If on profile page, redirect to home
    if (window.location.pathname.includes('profile.html')) {
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const homePath = isInPagesDir ? '../index.html' : './index.html';
        window.location.href = homePath;
    }
}

/**
 * Checks if the user is logged in
 * @returns {boolean}
 */
function checkIfLoggedIn() {
    return !!localStorage.getItem('auth_token');
}

// Login submission
function handleLogin(email, password) {
    localStorage.setItem('auth_token', 'demo_token');
    localStorage.setItem('user_data', JSON.stringify({
        name: 'Demo User',
        email: email,
        role: 'Mentee',
        skills: ['HTML', 'CSS', 'JavaScript'],
        interests: ['Web Development', 'UI/UX Design']
    }));

    const isInPagesDir = window.location.pathname.includes('/pages/');
    const homePath = isInPagesDir ? '../index.html' : './index.html';
    window.location.href = homePath;
}

async function handleLoginSubmit(e) {
    e.preventDefault();

    document.querySelectorAll('.form__error').forEach(el => {
        el.classList.remove('form__error--show');
    });

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Validate email
    if (!isValidEmail(email)) {
        document.getElementById('login-email-error').classList.add('form__error--show');
        return;
    }

    // Validate password
    if (!password || password.length < 6) {
        document.getElementById('login-password-error').classList.add('form__error--show');
        return;
    }

    try {
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        const users = JSON.parse(localStorage.getItem('registered_users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('auth_token', 'demo_token_' + Date.now());
            localStorage.setItem('user_data', JSON.stringify(user));

            window.location.href = 'profile.html';
        } else {
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);

        let errorMessage = document.getElementById('login-general-error');

        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'login-general-error';
            errorMessage.classList.add('form__error');

            const form = document.getElementById('login-form');
            form.insertBefore(errorMessage, form.querySelector('button[type="submit"]').parentElement);
        }

        errorMessage.classList.add('form__error--show');
        errorMessage.textContent = error.message || 'Login failed. Please check your credentials.';

        // Reset button
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        submitButton.textContent = 'Login';
        submitButton.disabled = false;
    }
}

// Registration form submission
async function handleRegisterSubmit(e) {
    e.preventDefault();

    document.querySelectorAll('.form__error').forEach(el => {
        el.classList.remove('form__error--show');
    });

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    let role = 'Mentee';
    const roleInputs = document.querySelectorAll('input[name="role"]');

    if (roleInputs.length > 0) {
        for (const input of roleInputs) {
            if (input.checked) {
                role = input.value;
                break;
            }
        }
    }

    // Validate name
    if (!isValidName(name)) {
        document.getElementById('register-name-error').classList.add('form__error--show');
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        document.getElementById('register-email-error').classList.add('form__error--show');
        return;
    }

    // Validate password
    if (!isValidPassword(password)) {
        document.getElementById('register-password-error').classList.add('form__error--show');
        return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
        document.getElementById('register-confirm-password-error').classList.add('form__error--show');
        return;
    }

    try {
        const submitButton = document.querySelector('#register-form button[type="submit"]');
        submitButton.textContent = 'Creating account...';
        submitButton.disabled = true;

        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);

        const users = JSON.parse(localStorage.getItem('registered_users')) || [];
        if (users.some(u => u.email === sanitizedEmail)) {
            throw new Error('A user with this email already exists');
        }

        // Create new user
        const newUser = {
            name: sanitizedName,
            email: sanitizedEmail,
            password: password,
            role: role,
            bio: '',
            skills: [],
            interests: [],
            createdAt: new Date().toISOString()
        };

        // Add to registered users
        users.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(users));

        localStorage.setItem('auth_token', 'demo_token_' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(newUser));

        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Registration error:', error);

        let errorMessage = document.getElementById('register-general-error');

        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'register-general-error';
            errorMessage.classList.add('form__error');

            const form = document.getElementById('register-form');
            form.insertBefore(errorMessage, form.querySelector('button[type="submit"]').parentElement);
        }

        errorMessage.classList.add('form__error--show');
        errorMessage.textContent = error.message || 'Registration failed. Please try again.';

        const submitButton = document.querySelector('#register-form button[type="submit"]');
        submitButton.textContent = 'Create Account';
        submitButton.disabled = false;
    }
}

// Check authentication
function requireAuth() {
    if (!apiService.isLoggedIn()) {
        localStorage.setItem('redirectAfterLogin', window.location.href);

        showNotification('Authentication Required', 'Please log in to access this page.', 'warning');

        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize profile page
function initializeProfile() {
    if (!requireAuth()) return;

    const currentUser = apiService.getCurrentUser();

    updateProfileUI(currentUser);
    setupProfileEdit();
}

// Update profile UI
function updateProfileUI(user) {
    if (!user) return;

    const profileName = document.querySelector('.profile__name');
    if (profileName) {
        profileName.textContent = user.name;
    }

    // Set user role
    const roleBadge = document.querySelector('.profile__role');
    if (roleBadge) {
        roleBadge.textContent = user.role;
        roleBadge.classList.add(`profile__role--${user.role.toLowerCase()}`);
    }

    // Set user avatar
    const avatar = document.querySelector('.profile__avatar');
    if (avatar) {
        avatar.src = user.avatar || '../assets/img/default-avatar.jpg';
        avatar.alt = `${user.name}'s profile picture`;
    }

    // Set user bio
    const bio = document.querySelector('.profile__bio');
    if (bio) {
        bio.textContent = user.bio || 'No bio provided yet.';
    }

    // Set user skills
    const skillsList = document.querySelector('.profile__skills-list');
    if (skillsList && user.skills && user.skills.length > 0) {
        skillsList.innerHTML = '';
        user.skills.forEach(skill => {
            const li = document.createElement('li');
            li.classList.add('profile__skill');
            li.textContent = skill;
            skillsList.appendChild(li);
        });
    }

    // Set user interests
    const interestsList = document.querySelector('.profile__interests-list');
    if (interestsList && user.interests && user.interests.length > 0) {
        interestsList.innerHTML = '';
        user.interests.forEach(interest => {
            const li = document.createElement('li');
            li.classList.add('profile__interest');
            li.textContent = interest;
            interestsList.appendChild(li);
        });
    }
}

// Profile edit
function setupProfileEdit() {
    const editButton = document.querySelector('.profile__edit-button');
    if (editButton) {
        editButton.addEventListener('click', handleProfileEdit);
    }
}

// Profile edit button
function handleProfileEdit() {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser) return;

    let modal = document.getElementById('profile-edit-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'profile-edit-modal';
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal__content">
                <span class="modal__close">&times;</span>
                <h2 class="modal__title">Edit Profile</h2>
                <form id="profile-edit-form" class="form">
                    <div class="form__group">
                        <label for="edit-name" class="form__label">Name</label>
                        <input type="text" id="edit-name" class="form__input" value="${currentUser.name}" required>
                        <div id="edit-name-error" class="form__error">Please enter a valid name</div>
                    </div>
                    <div class="form__group">
                        <label for="edit-bio" class="form__label">Bio</label>
                        <textarea id="edit-bio" class="form__textarea" rows="4">${currentUser.bio || ''}</textarea>
                    </div>
                    <div class="form__group">
                        <label class="form__label">Skills (comma separated)</label>
                        <input type="text" id="edit-skills" class="form__input" value="${currentUser.skills ? currentUser.skills.join(', ') : ''}">
                    </div>
                    <div class="form__group">
                        <label class="form__label">Interests (comma separated)</label>
                        <input type="text" id="edit-interests" class="form__input" value="${currentUser.interests ? currentUser.interests.join(', ') : ''}">
                    </div>
                    <div class="form__group">
                        <button type="submit" class="btn btn--primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.modal__close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        document.getElementById('profile-edit-form').addEventListener('submit', handleProfileUpdate);
    };
    modal.style.display = 'block';
}

// Profile update form submission
async function handleProfileUpdate(e) {
    e.preventDefault();

    const currentUser = apiService.getCurrentUser();
    if (!currentUser) return;

    const name = document.getElementById('edit-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const skillsInput = document.getElementById('edit-skills').value.trim();
    const interestsInput = document.getElementById('edit-interests').value.trim();

    // Validate name
    if (!isValidName(name)) {
        document.getElementById('edit-name-error').classList.add('form__error--show');
        return;
    }

    // Process skills and interests
    const skills = skillsInput ? skillsInput.split(',').map(skill => skill.trim()).filter(Boolean) : [];
    const interests = interestsInput ? interestsInput.split(',').map(interest => interest.trim()).filter(Boolean) : [];

    try {
        const submitButton = document.querySelector('#profile-edit-form button[type="submit"]');
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;

        const updatedUser = await apiService.updateUserProfile(currentUser.id, {
            name: sanitizeInput(name),
            bio: sanitizeInput(bio),
            skills,
            interests
        });

        showNotification('Success', 'Profile updated successfully!', 'success');
        updateProfileUI(updatedUser);
        document.getElementById('profile-edit-modal').style.display = 'none';
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error', error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
        const submitButton = document.querySelector('#profile-edit-form button[type="submit"]');
        submitButton.textContent = 'Save Changes';
        submitButton.disabled = false;
    }
}

// Show notification
function showNotification(title, message, type = 'info') {
    let container = document.querySelector('.notifications');

    if (!container) {
        container = document.createElement('div');
        container.classList.add('notifications');
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.classList.add('notification', `notification--${type}`);
    notification.innerHTML = `
        <div class="notification__header">
            <h3 class="notification__title">${title}</h3>
            <button class="notification__close">&times;</button>
        </div>
        <div class="notification__body">${message}</div>
    `;

    container.appendChild(notification);

    notification.querySelector('.notification__close').addEventListener('click', () => {
        notification.classList.add('notification--fade-out');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    });

    setTimeout(() => {
        if (notification.parentNode === container) {
            notification.classList.add('notification--fade-out');
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate name
function isValidName(name) {
    return name.length > 1 && /^[A-Za-z\s\-']+$/.test(name);
}

// Validate password
function isValidPassword(password) {
    return password && password.length >= 6;
}

// Sanitize user input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}