const apiService = (() => {
    const API_URL = 'https://api.mentormatch.example.com/v1';

    const TOKEN_KEY = 'auth_token';
    const USER_KEY = 'user_data';

    /**
     * Helper function to make API requests
     * @param {string} endpoint
     * @param {string} method
     * @param {object} data 
     * @returns {Promise} 
     */
    const apiRequest = async (endpoint, method = 'GET', data = null) => {
        const url = `${API_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
            credentials: 'include',
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Something went wrong');
            }

            return responseData;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    };

    // Authentication Methods

    /**
     * Log in a user
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise} 
     */
    const login = async (email, password) => {
        const response = await apiRequest('/auth/login', 'POST', { email, password });

        if (response.token) {
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }

        return response;
    };

    /**
     * Register a new user
     * @param {object} userData
     * @returns {Promise}
     */
    const register = async (userData) => {
        const response = await apiRequest('/auth/register', 'POST', userData);

        if (response.token) {
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }

        return response;
    };

    /**
     * Log out the current user
     */
    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return true;
    };

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    const isLoggedIn = () => {
        return !!localStorage.getItem(TOKEN_KEY);
    };

    /**
     * Get current user data
     * @returns {object|null}
     */
    const getCurrentUser = () => {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    };

    /**
     * Get user profile by ID
     * @param {string} userId
     * @returns {Promise}
     */
    const getUserProfile = async (userId = 'me') => {
        return apiRequest(`/users/${userId}`);
    };

    /**
     * Update user profile
     * @param {object} profileData
     * @returns {Promise}
     */
    const updateProfile = async (profileData) => {
        const response = await apiRequest('/users/me', 'PATCH', profileData);

        if (response.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }

        return response;
    };

    // Expose public methods
    return {
        login,
        register,
        logout,
        isLoggedIn,
        getCurrentUser,
        getUserProfile,
        updateProfile,
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
} 