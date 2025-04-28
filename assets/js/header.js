document.addEventListener('DOMContentLoaded', function () {
    initializeHamburgerMenu();
    setActiveNavItem();
});

// Toggle open/close menu on click
function initializeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navContainer = document.querySelector('.nav-container');
    const navLinks = document.querySelectorAll('.header__nav-item');

    // Click on hamburger icon
    if (hamburger) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navContainer.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    // Close menu when clicking on a nav link
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (hamburger) {
                hamburger.classList.remove('active');
                navContainer.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // Close menu when clicking outside or hamburger icon
    document.addEventListener('click', function (event) {
        if (hamburger && navContainer &&
            !hamburger.contains(event.target) &&
            !navContainer.contains(event.target)) {
            hamburger.classList.remove('active');
            navContainer.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    });
}

function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.header__nav-item');

    navLinks.forEach(link => {
        link.classList.remove('header__nav-item--active');

        const linkPath = link.getAttribute('href');
        if (linkPath) {
            if (currentPath.endsWith('/') || currentPath.endsWith('index.html')) {
                if (linkPath === 'index.html' || linkPath === './index.html') {
                    link.classList.add('header__nav-item--active');
                }
            }
            else if (currentPath.includes(linkPath)) {
                link.classList.add('header__nav-item--active');
            }
        }
    });
} 