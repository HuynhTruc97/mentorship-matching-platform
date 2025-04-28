document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('discovery.html')) {
        loadDiscoveryUsers();
        setupFilterFunc();
    }
});

// Load discovery users
async function loadDiscoveryUsers(filters = {}) {
    try {
        const userList = document.getElementById('user-list');
        if (userList) {
            userList.innerHTML = '<p class="loading">Loading users...</p>';
        }

        const sanitizedFilters = {
            role: filters.role ? sanitizeInput(filters.role) : undefined,
            skills: filters.skills ? sanitizeInput(filters.skills) : undefined,
            interests: filters.interests ? sanitizeInput(filters.interests) : undefined
        };

        const users = await apiService.getUsers(sanitizedFilters);
        const currentUser = apiService.getCurrentUser();

        // Get existing connection requests
        let connectionRequests = [];
        if (currentUser) {
            const requests = await apiService.getConnectionRequests(currentUser.id);
            connectionRequests = [
                ...requests.incoming.map(req => ({ id: req.id, fromUserId: req.fromUserId, toUserId: req.toUserId, status: req.status })),
                ...requests.outgoing.map(req => ({ id: req.id, fromUserId: req.fromUserId, toUserId: req.toUserId, status: req.status }))
            ];
        }

        // Update user list
        if (userList) {
            if (users.length === 0) {
                userList.innerHTML = '<p>No users found matching your criteria</p>';
            } else {
                userList.innerHTML = users.map(user => {
                    let connectionStatus = null;
                    let connectionRequestId = null;

                    if (currentUser) {
                        const outgoingRequest = connectionRequests.find(
                            req => req.fromUserId === currentUser.id && req.toUserId === user.id
                        );
                        const incomingRequest = connectionRequests.find(
                            req => req.fromUserId === user.id && req.toUserId === currentUser.id
                        );
                        if (outgoingRequest) {
                            connectionStatus = outgoingRequest.status;
                            connectionRequestId = outgoingRequest.id;
                        } else if (incomingRequest) {
                            connectionStatus = incomingRequest.status;
                            connectionRequestId = incomingRequest.id;
                        }
                    }

                    let connectionButton;

                    if (!currentUser) {
                        connectionButton = `<button class="btn btn--primary connect-button" data-id="${sanitizeForAttribute(user.id)}">Connect</button>`;
                    } else if (connectionStatus === 'pending') {
                        connectionButton = `<button class="btn btn--secondary" disabled>Request Pending</button>`;
                    } else if (connectionStatus === 'accepted') {
                        connectionButton = `<button class="btn btn--success" disabled>Connected</button>`;
                    } else if (connectionStatus === 'rejected') {
                        connectionButton = `<button class="btn btn--danger" disabled>Request Rejected</button>`;
                    } else {
                        connectionButton = `<button class="btn btn--primary connect-button" data-id="${sanitizeForAttribute(user.id)}">Connect</button>`;
                    }

                    return `
                        <div class="card">
                            <img src="${sanitizeImageUrl(user.avatar)}" alt="${sanitizeForAttribute(user.name)}" class="card__image">
                            <div class="card__body">
                                <h3 class="card__title">${sanitizeForDisplay(user.name)}</h3>
                                <p class="card__text">Role: ${sanitizeForDisplay(user.role) || 'Not specified'}</p>
                                <p class="card__text">Skills: ${user.skills && user.skills.length > 0 ? user.skills.map(sanitizeForDisplay).join(', ') : 'Not specified'}</p>
                                <p class="card__text">Interests: ${user.interests && user.interests.length > 0 ? user.interests.map(sanitizeForDisplay).join(', ') : 'Not specified'}</p>
                                ${connectionButton}
                            </div>
                        </div>
                    `;
                }).join('');

                // Add event listeners to connect buttons
                if (currentUser) {
                    userList.querySelectorAll('.connect-button').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            e.preventDefault();

                            // Validate user ID
                            const userId = button.getAttribute('data-id');
                            if (!userId) {
                                showErrorMessage('Invalid user ID');
                                return;
                            }

                            // Prevent duplicate requests
                            const allButtons = userList.querySelectorAll('.connect-button:not([disabled])');
                            allButtons.forEach(btn => {
                                btn.disabled = true;
                                btn.dataset.originalText = btn.textContent;
                                btn.textContent = 'Processing...';
                            });

                            try {
                                await apiService.sendConnectionRequest(currentUser.id, userId);

                                button.textContent = 'Request Sent';
                                button.classList.remove('btn--primary');
                                button.classList.add('btn--secondary');
                                button.disabled = true;

                                allButtons.forEach(btn => {
                                    if (btn !== button) {
                                        btn.disabled = false;
                                        btn.textContent = btn.dataset.originalText;
                                    }
                                });

                                showSuccessMessage('Connection request sent successfully!');
                            } catch (error) {
                                console.error('Error sending connection request:', error);

                                showErrorMessage(error.message || 'Failed to send connection request. Please try again later.');

                                allButtons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.textContent = btn.dataset.originalText;
                                });
                            }
                        });
                    });
                } else {
                    userList.querySelectorAll('.connect-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.preventDefault();

                            sessionStorage.setItem('redirectAfterLogin', window.location.href);

                            showInfoMessage('Please log in to connect with users');
                            window.location.href = 'login.html';
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading discovery users:', error);

        const userList = document.getElementById('user-list');
        if (userList) {
            userList.innerHTML = `<p class="error">Error loading users. Please try again.</p>`;
        }

        showErrorMessage('Failed to load users. Please try again later.');
    }
}

// Set up filter 
function setupFilterFunc() {
    const filterApplyButton = document.getElementById('filter-apply');

    if (filterApplyButton) {
        filterApplyButton.addEventListener('click', () => {
            const roleFilter = document.getElementById('filter-role').value.trim();
            const skillsFilter = document.getElementById('filter-skills').value.trim();
            const interestsFilter = document.getElementById('filter-interests').value.trim();

            // Validate filter inputs
            if (skillsFilter && !isValidListInput(skillsFilter)) {
                showErrorMessage('Skills filter can only contain letters, numbers, spaces, commas, and hyphens');
                return;
            }

            if (interestsFilter && !isValidListInput(interestsFilter)) {
                showErrorMessage('Interests filter can only contain letters, numbers, spaces, commas, and hyphens');
                return;
            }

            loadDiscoveryUsers({
                role: roleFilter,
                skills: skillsFilter,
                interests: interestsFilter
            });
        });

        const filterInputs = document.querySelectorAll('.filter__input, .filter__select');
        filterInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    filterApplyButton.click();
                }
            });
        });
    }
}

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

// Validate comma-separated list input
function isValidListInput(input) {
    if (!input) return true;
    const listRegex = /^[a-zA-Z0-9\s,.\-]+$/;
    return listRegex.test(input);
}

// Show success message
function showSuccessMessage(message) {
    alert(message);
}

// Show error message
function showErrorMessage(message) {
    alert(message);
}

// Show info message
function showInfoMessage(message) {
    alert(message);
}
