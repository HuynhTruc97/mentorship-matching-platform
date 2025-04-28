document.addEventListener('DOMContentLoaded', () => {
    loadScript('./assets/js/api.js', () => {
        loadScript('./assets/js/auth.js', () => {
            if (window.location.pathname.includes('profile.html')) {
                loadScript('./assets/js/profile.js');
            }
            if (window.location.pathname.includes('discovery.html')) {
                loadScript('./assets/js/discovery.js');
            }
        });
    });
});

function loadScript(url, callback) {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
        if (callback) callback();
        return;
    }
    const script = document.createElement('script');
    script.src = url;
    if (callback) {
        script.onload = callback;
    }
    document.body.appendChild(script);
}