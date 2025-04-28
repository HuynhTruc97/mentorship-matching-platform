document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('profile.html')) {
        if (!requireAuth()) return;

        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('edit') === 'true';

        if (isEditMode) {
            loadEditProfile();
        } else {
            loadUserProfile();
            setupProfileActions();
            setupConnectionsTab();
        }
    }
});

// Load user profile data
async function loadUserProfile() {
    try {
        const currentUser = apiService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        const profileName = document.querySelector('.profile__name');
        const profileAvatar = document.querySelector('.profile__avatar');
        const profileInfo = document.querySelector('.profile__info');

        if (!profileName || !profileAvatar || !profileInfo) {
            console.error('Profile elements not found');
            return;
        }

        profileName.textContent = sanitizeForDisplay(currentUser.name) || 'No Name';

        if (currentUser.avatar) {
            profileAvatar.src = sanitizeImageUrl(currentUser.avatar);
        }

        // Create profile
        const roleText = sanitizeForDisplay(currentUser.role) || 'Not specified';
        const skillsText = currentUser.skills && currentUser.skills.length > 0
            ? currentUser.skills.map(sanitizeForDisplay).join(', ')
            : 'Not specified';
        const interestsText = currentUser.interests && currentUser.interests.length > 0
            ? currentUser.interests.map(sanitizeForDisplay).join(', ')
            : 'Not specified';
        const bioText = sanitizeForDisplay(currentUser.bio) || 'No bio provided';

        profileInfo.innerHTML = `
            <p><strong>Role:</strong> ${roleText}</p>
            <p><strong>Skills:</strong> ${skillsText}</p>
            <p><strong>Interests:</strong> ${interestsText}</p>
            <p><strong>Bio:</strong> ${bioText}</p>
        `;

        loadConnectionRequests();
        loadActiveConnections();
    } catch (error) {
        console.error('Error loading profile:', error);
        showErrorMessage('Failed to load profile. Please try again.');
    }
}

// Load edit profile
async function loadEditProfile() {
    try {
        const currentUser = apiService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        const mainElement = document.querySelector('.main');
        if (!mainElement) {
            console.error('Main element not found');
            return;
        }

        mainElement.innerHTML = `
            <h1 class="main__title">Edit Profile</h1>
            
            <form class="form profile-edit-form">
                <div class="form__group">
                    <label for="edit-name" class="form__label">Name</label>
                    <input type="text" id="edit-name" class="form__input" value="${sanitizeForDisplay(currentUser.name) || ''}" required>
                    <div class="form__error" id="edit-name-error">Name can only contain letters, spaces, and hyphens</div>
                </div>
                
                <div class="form__group">
                    <label for="edit-role" class="form__label">Role</label>
                    <select id="edit-role" class="form__input">
                        <option value="Mentor" ${currentUser.role === 'Mentor' ? 'selected' : ''}>Mentor</option>
                        <option value="Mentee" ${currentUser.role === 'Mentee' ? 'selected' : ''}>Mentee</option>
                    </select>
                </div>
                
                <div class="form__group">
                    <label for="edit-skills" class="form__label">Skills (comma-separated)</label>
                    <input type="text" id="edit-skills" class="form__input" value="${currentUser.skills ? currentUser.skills.map(sanitizeForDisplay).join(', ') : ''}">
                    <div class="form__error" id="edit-skills-error">Skills can only contain letters, numbers, spaces, and commas</div>
                </div>
                
                <div class="form__group">
                    <label for="edit-interests" class="form__label">Interests (comma-separated)</label>
                    <input type="text" id="edit-interests" class="form__input" value="${currentUser.interests ? currentUser.interests.map(sanitizeForDisplay).join(', ') : ''}">
                    <div class="form__error" id="edit-interests-error">Interests can only contain letters, numbers, spaces, and commas</div>
                </div>
                
                <div class="form__group">
                    <label for="edit-bio" class="form__label">Bio</label>
                    <textarea id="edit-bio" class="form__input" rows="4" maxlength="500">${sanitizeForDisplay(currentUser.bio) || ''}</textarea>
                    <div class="form__error" id="edit-bio-error">Bio must be less than 500 characters</div>
                    <small class="form__help-text">Maximum 500 characters. <span id="bio-char-count">0</span>/500</small>
                </div>
                
                <div class="form__actions">
                    <button type="button" class="btn btn--secondary" id="discard-button">Discard</button>
                    <button type="submit" class="btn btn--primary">Save Changes</button>
                </div>
            </form>
        `;

        const bioTextarea = document.getElementById('edit-bio');
        const bioCharCount = document.getElementById('bio-char-count');
        if (bioTextarea && bioCharCount) {
            bioCharCount.textContent = bioTextarea.value.length;
            bioTextarea.addEventListener('input', () => {
                bioCharCount.textContent = bioTextarea.value.length;
            });
        }

        const discardButton = document.getElementById('discard-button');
        if (discardButton) {
            discardButton.addEventListener('click', () => {
                window.location.href = 'profile.html';
            });
        }

        const form = document.querySelector('.profile-edit-form');
        if (form) {
            form.addEventListener('submit', handleProfileEditSubmit);
        }
    } catch (error) {
        console.error('Error loading edit profile mode:', error);
        showErrorMessage('Failed to load profile edit form. Please try again.');
    }
}

// Profile edit form submission
async function handleProfileEditSubmit(e) {
    e.preventDefault();

    document.querySelectorAll('.form__error').forEach(el => {
        el.classList.remove('form__error--show');
    });

    const name = document.getElementById('edit-name').value.trim();
    const role = document.getElementById('edit-role').value;
    const skillsInput = document.getElementById('edit-skills').value.trim();
    const interestsInput = document.getElementById('edit-interests').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    // Validate inputs
    let isValid = true;

    // Validate name
    if (!isValidName(name)) {
        document.getElementById('edit-name-error').classList.add('form__error--show');
        isValid = false;
    }

    // Validate skills
    if (skillsInput && !isValidListInput(skillsInput)) {
        document.getElementById('edit-skills-error').classList.add('form__error--show');
        isValid = false;
    }

    // Validate interests
    if (interestsInput && !isValidListInput(interestsInput)) {
        document.getElementById('edit-interests-error').classList.add('form__error--show');
        isValid = false;
    }

    // Validate bio length
    if (bio.length > 500) {
        document.getElementById('edit-bio-error').classList.add('form__error--show');
        isValid = false;
    }

    if (!isValid) return;

    const currentUser = apiService.getCurrentUser();
    if (!currentUser) {
        showErrorMessage('User session expired. Please log in again.');
        window.location.href = 'login.html';
        return;
    }

    const sanitizedName = sanitizeInput(name);

    const skills = skillsInput
        .split(',')
        .map(s => sanitizeInput(s.trim()))
        .filter(s => s);

    const interests = interestsInput
        .split(',')
        .map(i => sanitizeInput(i.trim()))
        .filter(i => i);

    const sanitizedBio = sanitizeInput(bio);

    try {
        const submitButton = document.querySelector('.profile-edit-form button[type="submit"]');
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;

        // Update profile
        await apiService.updateProfile(currentUser.id, {
            name: sanitizedName,
            role,
            skills,
            interests,
            bio: sanitizedBio
        });

        showSuccessMessage('Profile updated successfully');

        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Error updating profile:', error);

        const errorMessage = document.createElement('div');
        errorMessage.classList.add('form__error', 'form__error--show');
        errorMessage.textContent = error.message || 'Failed to update profile. Please try again.';

        const form = document.querySelector('.profile-edit-form');
        form.insertBefore(errorMessage, form.querySelector('.form__actions'));

        submitButton.textContent = 'Save Changes';
        submitButton.disabled = false;
    }
}

// Set up profile action buttons
function setupProfileActions() {
    const editButton = document.querySelector('.profile__actions .btn--primary');
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = 'profile.html?edit=true';
        });
    }

    const deleteButton = document.querySelector('.profile__actions .btn--danger');
    if (deleteButton) {
        deleteButton.addEventListener('click', confirmDeleteProfile);
    }
}

// Confirm delete profile
function confirmDeleteProfile() {
    const confirmed = confirm(
        'Are you sure you want to delete your profile? This action cannot be undone and will remove all your data, including connections and pending requests.'
    );

    if (confirmed) {
        deleteProfile();
    }
}

// Delete profile
async function deleteProfile() {
    try {
        const currentUser = apiService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        await apiService.deleteProfile(currentUser.id);

        showSuccessMessage('Profile deleted successfully');

        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error deleting profile:', error);
        showErrorMessage('Failed to delete profile. Please try again.');
    }
}

// Setup connections tab
function setupConnectionsTab() {
    const mainElement = document.querySelector('.main');
    const profileElement = document.querySelector('.profile');

    if (!mainElement || !profileElement) {
        return;
    }

    if (!document.querySelector('.tabs')) {
        const tabsContainer = document.createElement('div');
        tabsContainer.classList.add('tabs');
        tabsContainer.innerHTML = `
            <div class="tabs__header">
                <button class="tabs__button tabs__button--active" data-tab="profile">Profile</button>
                <button class="tabs__button" data-tab="requests">Connection Requests</button>
                <button class="tabs__button" data-tab="connections">Active Connections</button>
            </div>
            <div class="tabs__content">
                <div class="tabs__panel tabs__panel--active" id="profile-panel">
                    <!-- Profile content will be moved here -->
                </div>
                <div class="tabs__panel" id="requests-panel">
                    <h2>Connection Requests</h2>
                    <div class="requests">
                        <div class="requests__section">
                            <h3>Incoming Requests</h3>
                            <div id="incoming-requests"></div>
                        </div>
                        <div class="requests__section">
                            <h3>Outgoing Requests</h3>
                            <div id="outgoing-requests"></div>
                        </div>
                    </div>
                </div>
                <div class="tabs__panel" id="connections-panel">
                    <h2>Active Connections</h2>
                    <div id="active-connections"></div>
                </div>
            </div>
        `;

        const profilePanel = tabsContainer.querySelector('#profile-panel');
        profilePanel.appendChild(profileElement);

        mainElement.appendChild(tabsContainer);

        const tabButtons = tabsContainer.querySelectorAll('.tabs__button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('tabs__button--active'));
                tabsContainer.querySelectorAll('.tabs__panel').forEach(panel => {
                    panel.classList.remove('tabs__panel--active');
                });

                button.classList.add('tabs__button--active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-panel`).classList.add('tabs__panel--active');
            });
        });
    }
}

// Load connection requests
async function loadConnectionRequests() {
    try {
        const currentUser = apiService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        const requests = await apiService.getConnectionRequests(currentUser.id);

        const incomingRequestsContainer = document.getElementById('incoming-requests');
        if (incomingRequestsContainer) {
            if (requests.incoming.length === 0) {
                incomingRequestsContainer.innerHTML = '<p>No incoming requests</p>';
            } else {
                incomingRequestsContainer.innerHTML = requests.incoming.map(request => `
                    <div class="request-card">
                        <div class="request-card__info">
                            <img src="${sanitizeImageUrl(request.fromUser.avatar)}" alt="User" class="request-card__avatar">
                            <div>
                                <h4>${sanitizeForDisplay(request.fromUser.name)}</h4>
                                <p>Role: ${sanitizeForDisplay(request.fromUser.role)}</p>
                                <p>Status: ${sanitizeForDisplay(request.status)}</p>
                            </div>
                        </div>
                        <div class="request-card__actions">
                            ${request.status === 'pending' ? `
                                <button class="btn btn--small btn--primary accept-request" data-id="${sanitizeForAttribute(request.id)}">Accept</button>
                                <button class="btn btn--small btn--danger reject-request" data-id="${sanitizeForAttribute(request.id)}">Reject</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');

                incomingRequestsContainer.querySelectorAll('.accept-request').forEach(button => {
                    button.addEventListener('click', async () => {
                        const requestId = button.getAttribute('data-id');

                        button.disabled = true;
                        const rejectButton = button.closest('.request-card__actions').querySelector('.reject-request');
                        if (rejectButton) rejectButton.disabled = true;

                        button.textContent = 'Accepting...';

                        await respondToRequest(requestId, 'accepted');
                    });
                });

                incomingRequestsContainer.querySelectorAll('.reject-request').forEach(button => {
                    button.addEventListener('click', async () => {
                        const requestId = button.getAttribute('data-id');

                        button.disabled = true;
                        const acceptButton = button.closest('.request-card__actions').querySelector('.accept-request');
                        if (acceptButton) acceptButton.disabled = true;

                        button.textContent = 'Rejecting...';

                        await respondToRequest(requestId, 'rejected');
                    });
                });
            }
        }

        // Update outgoing requests
        const outgoingRequests = document.getElementById('outgoing-requests');
        if (outgoingRequests) {
            if (requests.outgoing.length === 0) {
                outgoingRequests.innerHTML = '<p>No outgoing requests</p>';
            } else {
                outgoingRequests.innerHTML = requests.outgoing.map(request => `
                    <div class="request-card">
                        <div class="request-card__info">
                            <img src="${sanitizeImageUrl(request.toUser.avatar)}" alt="User" class="request-card__avatar">
                            <div>
                                <h4>${sanitizeForDisplay(request.toUser.name)}</h4>
                                <p>Role: ${sanitizeForDisplay(request.toUser.role)}</p>
                                <p>Status: ${sanitizeForDisplay(request.status)}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading connection requests:', error);
        showErrorMessage('Failed to load connection requests');
    }
}

// Respond to connection request
async function respondToRequest(requestId, status) {
    if (!requestId || !status) {
        showErrorMessage('Invalid request data');
        return;
    }

    try {
        await apiService.respondToConnectionRequest(requestId, status);
        loadConnectionRequests();
        loadActiveConnections();
        showSuccessMessage(`Request ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
    } catch (error) {
        console.error('Error responding to request:', error);
        showErrorMessage('Failed to respond to request. Please try again.');
    }
}

// Load active connections
async function loadActiveConnections() {
    try {
        const currentUser = apiService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        const connections = await apiService.getActiveConnections(currentUser.id);
        const connectionsContainer = document.getElementById('active-connections');
        if (connectionsContainer) {
            if (connections.length === 0) {
                connectionsContainer.innerHTML = '<p>No active connections</p>';
            } else {
                connectionsContainer.innerHTML = connections.map(connection => `
                    <div class="connection-card">
                        <div class="connection-card__info">
                            <img src="${sanitizeImageUrl(connection.connectedUser.avatar)}" alt="User" class="connection-card__avatar">
                            <div>
                                <h4>${sanitizeForDisplay(connection.connectedUser.name)}</h4>
                                <p>Role: ${sanitizeForDisplay(connection.connectedUser.role)}</p>
                                <p>Connected since: ${formatDate(connection.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading active connections:', error);
        showErrorMessage('Failed to load active connections');
    }
}

// Show success message
function showSuccessMessage(message) {
    alert(message);
}

// Show error message
function showErrorMessage(message) {
    alert(message);
}

// Safely format a date
function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
}

// Validation functions

// Validate name
function isValidName(name) {
    if (!name || name.trim() === '') return false;
    const nameRegex = /^[a-zA-Z\s-]+$/;
    return nameRegex.test(name);
}

// Validate comma-separated list input
function isValidListInput(input) {
    if (!input) return true;
    const listRegex = /^[a-zA-Z0-9\s,.\-]+$/;
    return listRegex.test(input);
}

// Sanitization functions

// Sanitize input
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

// Sanitize for HTML display
function sanitizeForDisplay(input) {
    return sanitizeInput(input);
}

// Sanitize for HTML attribute values
function sanitizeForAttribute(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[^\w\s-]/g, '');
}

// Sanitize image URL
function sanitizeImageUrl(url) {
    if (typeof url !== 'string') return '';
    const urlRegex = /^(https?:\/\/|\.\.?\/|\/)[a-zA-Z0-9\/_.-]+\.(jpg|jpeg|png|gif|svg|webp)(\?[a-zA-Z0-9=&]+)?$/i;

    if (urlRegex.test(url)) {
        return url;
    }
    return '../assets/img/HuynhThiThanhTruc.jpg';
}