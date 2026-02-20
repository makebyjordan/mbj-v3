(function () {
    'use strict';

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getChildren(node) {
        if (!node) return [];
        if (Array.isArray(node.children)) return node.children;
        if (Array.isArray(node.links)) return node.links;
        if (node.submenu && typeof node.submenu === 'object') return Object.values(node.submenu);
        if (node.children && typeof node.children === 'object') return Object.values(node.children);
        return [];
    }

    function generateHTML(items, isMobile) {
        return items.map((item) => {
            const children = getChildren(item);
            const hasChildren = children.length > 0;
            const label = escapeHTML(item.title || item.name || 'Sin titulo');
            const description = item.description
                ? '<span class="nav-item-desc">' + escapeHTML(item.description) + '</span>'
                : '';

            if (hasChildren) {
                return (
                    '<li class="' + (isMobile ? 'mobile-has-children' : 'has-children') + '">' +
                        '<span class="' + (isMobile ? 'mobile-dropdown-toggle' : 'submenu-trigger') + '" role="button" tabindex="0">' +
                            label +
                        '</span>' +
                        '<ul class="' + (isMobile ? 'mobile-dropdown-menu mobile-sub-wrapper' : 'nav-dropdown-menu') + '">' +
                            generateHTML(children, isMobile) +
                        '</ul>' +
                    '</li>'
                );
            }

            const safeUrl = escapeHTML(item.url || '#');
            const isNewTab = item.newTab === true || item.target === '_blank';
            return (
                '<li>' +
                    '<a href="' + safeUrl + '"' + (isNewTab ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
                        '<span class="nav-item-content">' +
                            '<span class="nav-item-title">' +
                                label +
                                (isNewTab ? '<span class="nav-item-external">↗</span>' : '') +
                            '</span>' +
                            description +
                        '</span>' +
                    '</a>' +
                '</li>'
            );
        }).join('');
    }

    function initMobileDropdowns() {
        document.querySelectorAll('.mobile-dropdown-toggle').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const parent = btn.parentElement;
                if (parent) parent.classList.toggle('active');
            });
        });
    }

    function initDesktopDropdowns() {
        document.querySelectorAll('.nav-dropdown-toggle').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
            });
        });
    }

    async function loadNavbarLinks() {
        const desktopRoot = document.getElementById('knowLG-submenu');
        const mobileRoot = document.getElementById('knowLG-mobile-submenu');
        if (!desktopRoot || !mobileRoot) return;

        try {
            const response = await fetch('navbar-links.json');
            if (!response.ok) return;
            const data = await response.json();
            const rootData = getChildren(data && data.navbar && data.navbar.knowLG);

            desktopRoot.innerHTML = generateHTML(rootData, false);
            mobileRoot.innerHTML = generateHTML(rootData, true);
            initDesktopDropdowns();
            initMobileDropdowns();
        } catch (error) {
            console.error('Navbar links error:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadNavbarLinks);
})();
