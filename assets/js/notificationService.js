const NotificationService = (() => {
    const defaultConfig = {
        duration: 5000,
        maxCount: 5,
        container: null,
        animations: true
    };

    // Private variables
    let config = { ...defaultConfig };
    let notificationCount = 0;
    let notifications = [];

    /**
     * Initialize the notification service
     * @param {Object} customConfig
     */
    function init(customConfig = {}) {
        config = { ...defaultConfig, ...customConfig };

        if (!document.querySelector('.notification__container')) {
            const container = document.createElement('div');
            container.className = 'notification__container';
            document.body.appendChild(container);
            config.container = container;
        } else {
            config.container = document.querySelector('.notification__container');
        }
    }

    /**
     * Show a notification
     * @param {Object} options
     */
    function show(options) {
        if (!config.container) {
            init();
        }

        const defaults = {
            type: 'info',
            message: '',
            duration: config.duration,
            dismissible: true
        };

        const notificationOptions = typeof options === 'string'
            ? { ...defaults, message: options }
            : { ...defaults, ...options };

        const notification = document.createElement('div');
        notification.className = `notification notification-${notificationOptions.type}`;

        notification.innerHTML = `
            <div class="notification__message">${notificationOptions.message}</div>
            ${notificationOptions.dismissible ? '<button class="notification__close">&times;</button>' : ''}
        `;

        config.container.appendChild(notification);
        notificationCount++;
        notifications.push(notification);
        manageNotificationOverflow();

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        if (notificationOptions.duration) {
            setTimeout(() => {
                dismiss(notification);
            }, notificationOptions.duration);
        }

        if (notificationOptions.dismissible) {
            const closeButton = notification.querySelector('.notification__close');
            closeButton.addEventListener('click', () => {
                dismiss(notification);
            });
        }

        return notification;
    }

    /**
     * Remove a specific notification
     * @param {HTMLElement} notification
     */
    function dismiss(notification) {
        if (!notification || !notification.parentNode) return;
        notification.classList.remove('show');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                notificationCount--;
                notifications = notifications.filter(n => n !== notification);
            }
        }, 300);
    }

    /**
     * Remove all notifications
     */
    function dismissAll() {
        const allNotifications = [...notifications];
        allNotifications.forEach(notification => {
            dismiss(notification);
        });
    }

    /**
     * Manage the maximum number of notifications shown
     */
    function manageNotificationOverflow() {
        if (config.maxCount && notifications.length > config.maxCount) {
            // Remove oldest notifications
            const excessCount = notifications.length - config.maxCount;
            for (let i = 0; i < excessCount; i++) {
                const oldest = notifications[i];
                dismiss(oldest);
            }
        }
    }

    /**
     * Show a success notification
     * @param {string} message
     * @param {number} duration
     */
    function success(message, duration) {
        return show({
            type: 'success',
            message,
            duration: duration || config.duration
        });
    }

    /**
     * Show an error notification
     * @param {string} message
     * @param {number} duration
     */
    function error(message, duration) {
        return show({
            type: 'error',
            message,
            duration: duration || config.duration
        });
    }

    /**
     * Show a warning notification
     * @param {string} message
     * @param {number} duration
     */
    function warning(message, duration) {
        return show({
            type: 'warning',
            message,
            duration: duration || config.duration
        });
    }

    /**
     * Show an info notification
     * @param {string} message
     * @param {number} duration
     */
    function info(message, duration) {
        return show({
            type: 'info',
            message,
            duration: duration || config.duration
        });
    }

    // Public API
    return {
        init,
        show,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    NotificationService.init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
} 