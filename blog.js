/* ============================================
   MakeByJordan — Blog System
   Database, Rendering & Admin CRUD
   ============================================ */

(function () {
    'use strict';

    const API_BASE = '/api';
    const STORAGE_KEY = 'mbj_blog_posts';
    const JSON_STORAGE_PREFIX = 'mbj_json_';
    const ADMIN_PASS = 'makebyjordan2026';
    const AUTH_KEY = 'mbj_admin_auth';
    const API_TOKEN_KEY = 'mbj_api_token';

    function esc(value) {
        const s = String(value ?? '');
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeHtml(value) {
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
            return window.DOMPurify.sanitize(String(value ?? ''));
        }
        return esc(String(value ?? ''));
    }

    // ==========================================
    // DATABASE — API + local cache fallback
    // ==========================================
    class BlogDB {
        constructor() {
            this.posts = [];
            this.loaded = false;
        }

        async load() {
            // Primary source: API
            try {
                const response = await fetch(`${API_BASE}/posts`);
                this.posts = await response.json();
                this.save();
                this.loaded = true;
                return this.posts;
            } catch (e) {
                console.error('Error loading /api/posts:', e);
            }

            // Fallback: localStorage cache
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    this.posts = JSON.parse(stored);
                } catch (e) {
                    this.posts = [];
                }
            } else {
                this.posts = [];
            }

            this.loaded = true;
            return this.posts;
        }

        setAll(posts) {
            this.posts = Array.isArray(posts) ? posts : [];
            this.save();
            return this.posts;
        }

        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.posts));
        }

        getAll() {
            return [...this.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        getById(id) {
            return this.posts.find(p => p.id === parseInt(id));
        }

        getCategories() {
            const cats = new Set(this.posts.map(p => p.category));
            return Array.from(cats);
        }

        getByCategory(category) {
            return this.getAll().filter(p => p.category === category);
        }

        create(post) {
            const maxId = this.posts.reduce((max, p) => Math.max(max, p.id), 0);
            const gradients = [
                ['#7c3aed', '#2563eb'],
                ['#ec4899', '#8b5cf6'],
                ['#06b6d4', '#6366f1'],
                ['#f59e0b', '#ef4444'],
                ['#10b981', '#3b82f6']
            ];
            const newPost = {
                id: maxId + 1,
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                author: post.author || 'Jordan',
                date: post.date || new Date().toISOString().split('T')[0],
                category: post.category,
                gradient: gradients[Math.floor(Math.random() * gradients.length)],
                tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            };
            this.posts.push(newPost);
            this.save();
            return newPost;
        }

        update(id, data) {
            const index = this.posts.findIndex(p => p.id === parseInt(id));
            if (index === -1) return null;
            this.posts[index] = {
                ...this.posts[index],
                title: data.title,
                excerpt: data.excerpt,
                content: data.content,
                category: data.category,
                tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : this.posts[index].tags
            };
            this.save();
            return this.posts[index];
        }

        delete(id) {
            this.posts = this.posts.filter(p => p.id !== parseInt(id));
            this.save();
        }
    }

    // ==========================================
    // SVG SHAPES for cards
    // ==========================================
    const cardShapes = [
        `<svg viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/><circle cx="100" cy="100" r="35" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/><circle cx="100" cy="100" r="12" fill="rgba(255,255,255,0.08)"/></svg>`,
        `<svg viewBox="0 0 200 200" fill="none"><rect x="50" y="50" width="100" height="100" rx="16" stroke="rgba(255,255,255,0.12)" stroke-width="0.5" transform="rotate(12 100 100)"/><rect x="70" y="70" width="60" height="60" rx="8" stroke="rgba(255,255,255,0.18)" stroke-width="0.5" transform="rotate(-8 100 100)"/></svg>`,
        `<svg viewBox="0 0 200 200" fill="none"><polygon points="100,30 170,70 170,130 100,170 30,130 30,70" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/><polygon points="100,60 140,82 140,118 100,140 60,118 60,82" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/></svg>`
    ];

    // ==========================================
    // BLOG RENDERER — Main blog page
    // ==========================================
    class BlogRenderer {
        constructor(db) {
            this.db = db;
            this.gridEl = document.getElementById('blog-grid');
            this.filtersEl = document.getElementById('blog-filters');
            this.activeFilter = 'all';
        }

        renderFilters() {
            if (!this.filtersEl) return;
            const categories = this.db.getCategories();
            let html = `<button class="filter-btn active" data-filter="all">Todos</button>`;
            categories.forEach(cat => {
                html += `<button class="filter-btn" data-filter="${cat}">${cat}</button>`;
            });
            this.filtersEl.innerHTML = html;

            this.filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeFilter = btn.dataset.filter;
                    this.renderPosts();
                });
            });
        }

        renderPosts() {
            if (!this.gridEl) return;
            const posts = this.activeFilter === 'all'
                ? this.db.getAll()
                : this.db.getByCategory(this.activeFilter);

            if (posts.length === 0) {
                this.gridEl.innerHTML = `
                    <div class="blog-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3Z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 7H17M7 12H17M7 17H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <h3>No hay artículos</h3>
                        <p>Aún no se han publicado artículos en esta categoría.</p>
                    </div>
                `;
                return;
            }

            this.gridEl.innerHTML = posts.map((post, i) => {
                const shape = cardShapes[i % cardShapes.length];
                const dateStr = new Date(post.date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                const safeTitle = esc(post.title);
                const safeCategory = esc(post.category);
                const safeExcerpt = esc(post.excerpt);
                return `
                    <a href="post.html?id=${post.id}" class="blog-card" data-animate="fade-up" data-delay="${i * 80}">
                        <div class="blog-card-image">
                            <div class="blog-card-gradient" style="background: linear-gradient(135deg, ${post.gradient[0]}, ${post.gradient[1]})"></div>
                            ${post.image ? `<img src="${esc(post.image)}" alt="${safeTitle}" class="blog-card-photo" loading="lazy" data-post="${post.id}">` : ''}
                            <div class="blog-card-shape">${shape}</div>
                            <span class="blog-card-category">${safeCategory}</span>
                        </div>
                        <div class="blog-card-body">
                            <div class="blog-card-date">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1"/>
                                    <path d="M7 4V7L9 9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                                </svg>
                                ${dateStr}
                            </div>
                            <h3>${safeTitle}</h3>
                            <p>${safeExcerpt}</p>
                            <div class="blog-card-tags">
                                ${post.tags.map(t => `<span>${esc(t)}</span>`).join('')}
                            </div>
                            <div class="modal-actions">
                                <a class="btn btn-secondary" href="post.html?id=${post.id}" target="_blank" rel="noopener">Leer más</a>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');

            // Trigger animations
            setTimeout(() => {
                this.gridEl.querySelectorAll('[data-animate]').forEach(el => {
                    const delay = parseInt(el.dataset.delay) || 0;
                    setTimeout(() => el.classList.add('visible'), delay);
                });
            }, 100);

            // Modal for post images
            const modal = document.getElementById('global-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalSubtitle = document.getElementById('modal-subtitle');
            const modalBody = document.getElementById('modal-body');
            const modalClose = document.getElementById('modal-close');

            function openModal(title, subtitle, bodyHtml) {
                if (!modal) return;
                modalTitle.textContent = title || '';
                modalSubtitle.textContent = subtitle || '';
                modalBody.innerHTML = bodyHtml || '';
                modal.classList.add('active');
            }

            function closeModal() {
                modal.classList.remove('active');
            }

            this.gridEl.querySelectorAll('[data-post]').forEach(img => {
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = parseInt(img.dataset.post, 10);
                    const post = this.db.getById(id);
                    if (!post) return;
                    const dateStr = new Date(post.date).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    const body = `
                        ${post.image ? `<img src="${esc(post.image)}" alt="${esc(post.title)}">` : ''}
                        ${sanitizeHtml(post.content || '')}
                    `;
                    openModal(post.title, `${post.category} · ${dateStr}`, body);
                });
            });

            modalClose && modalClose.addEventListener('click', closeModal);
            modal && modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        render() {
            this.renderFilters();
            this.renderPosts();
        }
    }

    // ==========================================
    // POST RENDERER — Single post page
    // ==========================================
    class PostRenderer {
        constructor(db) {
            this.db = db;
        }

        render() {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (!id) {
                window.location.href = 'blog.html';
                return;
            }

            const post = this.db.getById(id);
            if (!post) {
                window.location.href = 'blog.html';
                return;
            }

            // Update page title
            document.title = `${post.title} — MakeByJordan Blog`;

            // Render meta
            const metaEl = document.getElementById('post-meta');
            if (metaEl) {
                const dateStr = new Date(post.date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                metaEl.innerHTML = `
                    <span class="post-meta-category">${esc(post.category)}</span>
                    <span class="post-meta-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1"/>
                            <path d="M7 4V7L9 9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                        </svg>
                        ${dateStr}
                    </span>
                    <span class="post-meta-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="5" r="3" stroke="currentColor" stroke-width="1"/>
                            <path d="M2 13C2 10.2 4.2 8 7 8C9.8 8 12 10.2 12 13" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                        </svg>
                        ${esc(post.author)}
                    </span>
                `;
            }

            // Render hero image
            const heroEl = document.getElementById('post-hero-image');
            if (heroEl && post.image) {
                heroEl.innerHTML = `
                    <img src="${esc(post.image)}" alt="${esc(post.title)}">
                `;
            }

            // Render title
            const titleEl = document.getElementById('post-title');
            if (titleEl) titleEl.textContent = post.title;

            // Render content
            const contentEl = document.getElementById('post-content');
            if (contentEl) {
                contentEl.innerHTML = sanitizeHtml(post.content);

                // Add tags
                if (post.tags && post.tags.length > 0) {
                    contentEl.innerHTML += `
                        <div class="post-tags">
                            ${post.tags.map(t => `<span>${esc(t)}</span>`).join('')}
                        </div>
                    `;
                }
            }
        }
    }

    // ==========================================
    // SIMPLE NAVBAR FOR BLOG PAGES
    // ==========================================
    class SimpleNavbar {
        constructor() {
            this.navbar = document.getElementById('navbar');
            this.toggle = document.getElementById('navToggle');
            this.mobileMenu = document.getElementById('mobileMenu');
            this.mobileLinks = document.querySelectorAll('.mobile-links a');
            this.isOpen = false;

            if (this.navbar && this.toggle && this.mobileMenu) {
                this.bindEvents();
            }
        }

        bindEvents() {
            window.addEventListener('scroll', () => this.onScroll());
            this.toggle.addEventListener('click', () => this.toggleMenu());
            this.mobileLinks.forEach(link => link.addEventListener('click', () => this.closeMenu()));
        }

        onScroll() {
            if (!this.navbar) return;
            this.navbar.classList.toggle('scrolled', window.scrollY > 50);
        }

        toggleMenu() {
            this.isOpen = !this.isOpen;
            this.toggle.classList.toggle('active', this.isOpen);
            this.mobileMenu.classList.toggle('active', this.isOpen);
            document.body.style.overflow = this.isOpen ? 'hidden' : '';
        }

        closeMenu() {
            this.isOpen = false;
            this.toggle.classList.remove('active');
            this.mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ==========================================
    // ADMIN PANEL
    // ==========================================
    class AdminPanel {
        constructor(db) {
            this.db = db;
            this.editingId = null;
            this.activeTab = 'blog';
        }

        isAuthenticated() {
            return localStorage.getItem(AUTH_KEY) === 'true' && !!localStorage.getItem(API_TOKEN_KEY);
        }

        login(password, apiToken) {
            if (password === ADMIN_PASS) {
                localStorage.setItem(AUTH_KEY, 'true');
                localStorage.setItem(API_TOKEN_KEY, apiToken);
                return true;
            }
            return false;
        }

        logout() {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(API_TOKEN_KEY);
            window.location.reload();
        }

        getApiToken() {
            return localStorage.getItem(API_TOKEN_KEY) || '';
        }

        async apiFetch(path, options = {}) {
            const token = this.getApiToken();
            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(path, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            return response;
        }

        initLogin() {
            const loginForm = document.getElementById('login-form');
            const loginError = document.getElementById('login-error');
            if (!loginForm) return;

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const pass = document.getElementById('login-password').value;
                const token = document.getElementById('login-api-token').value.trim();
                if (this.login(pass, token)) {
                    window.location.reload();
                } else {
                    loginError.classList.add('show');
                    setTimeout(() => loginError.classList.remove('show'), 3000);
                }
            });
        }

        initDashboard() {
            this.renderPosts();
            this.initModal();
            this.initTabs();
            this.initJsonEditor();

            // New post button
            const newBtn = document.getElementById('btn-new-post');
            if (newBtn) {
                newBtn.addEventListener('click', () => this.openModal());
            }

            // Logout button
            const logoutBtn = document.getElementById('btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }

        initTabs() {
            const tabs = document.querySelectorAll('.admin-tab');
            const blogPanel = document.getElementById('admin-blog-panel');
            const jsonPanel = document.getElementById('admin-json-panel');

            const setTab = (tab) => {
                this.activeTab = tab;
                tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
                if (blogPanel) blogPanel.classList.toggle('active', tab === 'blog');
                if (jsonPanel) jsonPanel.classList.toggle('active', tab === 'json');
            };

            tabs.forEach(btn => {
                btn.addEventListener('click', () => setTab(btn.dataset.tab));
            });

            setTab(this.activeTab);
        }

        getJsonConfig(id) {
            const map = {
                posts: { publicApi: `${API_BASE}/posts`, adminApi: `${API_BASE}/admin/posts`, storageKey: STORAGE_KEY, label: 'posts.json' },
                tech: { publicApi: `${API_BASE}/tech`, adminApi: `${API_BASE}/admin/tech`, storageKey: `${JSON_STORAGE_PREFIX}tech`, label: 'tech.json' },
                projects: { publicApi: `${API_BASE}/projects`, adminApi: `${API_BASE}/admin/projects`, storageKey: `${JSON_STORAGE_PREFIX}projects`, label: 'projects.json' }
            };
            return map[id] || map.posts;
        }

        async initJsonEditor() {
            const select = document.getElementById('json-select');
            const editor = document.getElementById('json-editor');
            const btnLoad = document.getElementById('btn-json-load');
            const btnSave = document.getElementById('btn-json-save');
            const btnDownload = document.getElementById('btn-json-download');

            if (!select || !editor) return;

            const loadCurrent = async () => {
                const cfg = this.getJsonConfig(select.value);
                try {
                    const res = await fetch(cfg.publicApi);
                    const data = await res.json();
                    editor.value = JSON.stringify(data, null, 4);
                } catch (e) {
                    const cached = localStorage.getItem(cfg.storageKey);
                    editor.value = cached || '';
                }
            };

            select.addEventListener('change', loadCurrent);
            if (btnLoad) btnLoad.addEventListener('click', loadCurrent);

            if (btnSave) {
                btnSave.addEventListener('click', async () => {
                    const cfg = this.getJsonConfig(select.value);
                    let parsed;
                    try {
                        parsed = JSON.parse(editor.value);
                    } catch (e) {
                        alert('JSON inválido. Revisa la sintaxis.');
                        return;
                    }

                    try {
                        await this.apiFetch(cfg.adminApi, {
                            method: 'PUT',
                            body: JSON.stringify(parsed)
                        });
                    } catch (e) {
                        alert(`No se pudo guardar en API: ${e.message}`);
                        return;
                    }

                    localStorage.setItem(cfg.storageKey, JSON.stringify(parsed, null, 4));

                    // If editing posts.json, sync with blog DB
                    if (select.value === 'posts') {
                        this.db.setAll(parsed);
                        this.renderPosts();
                    }

                    alert('Guardado en API.');
                });
            }

            if (btnDownload) {
                btnDownload.addEventListener('click', () => {
                    const cfg = this.getJsonConfig(select.value);
                    const blob = new Blob([editor.value], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = cfg.label;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(a.href);
                });
            }

            await loadCurrent();
        }

        renderPosts() {
            const listEl = document.getElementById('admin-posts-list');
            if (!listEl) return;

            const posts = this.db.getAll();
            if (posts.length === 0) {
                listEl.innerHTML = `<div class="admin-empty"><p>No hay artículos. Crea el primero.</p></div>`;
                return;
            }

            listEl.innerHTML = posts.map(post => {
                const dateStr = new Date(post.date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                return `
                    <div class="admin-post-item">
                        <div class="admin-post-info">
                            <h3>${esc(post.title)}</h3>
                            <span>${esc(post.category)} · ${dateStr}</span>
                        </div>
                        <div class="admin-post-actions">
                            <button class="btn-icon" onclick="blogAdmin.openModal(${post.id})" title="Editar">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="blogAdmin.deletePost(${post.id})" title="Eliminar">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 5H13M5 5V13H11V5M7 7V11M9 7V11M6 5V3H10V5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        initModal() {
            const modal = document.getElementById('admin-modal');
            const overlay = modal?.querySelector('.modal-overlay');
            const form = document.getElementById('post-form');
            const cancelBtn = document.getElementById('btn-cancel');

            if (overlay) overlay.addEventListener('click', () => this.closeModal());
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.savePost();
                });
            }
        }

        openModal(id = null) {
            const modal = document.getElementById('admin-modal');
            const modalTitle = document.getElementById('modal-title');
            const form = document.getElementById('post-form');

            if (!modal || !form) return;

            this.editingId = id;

            if (id) {
                const post = this.db.getById(id);
                if (!post) return;
                modalTitle.textContent = 'Editar Artículo';
                form.querySelector('#form-title').value = post.title;
                form.querySelector('#form-excerpt').value = post.excerpt;
                form.querySelector('#form-content').value = post.content;
                form.querySelector('#form-category').value = post.category;
                form.querySelector('#form-tags').value = post.tags.join(', ');
            } else {
                modalTitle.textContent = 'Nuevo Artículo';
                form.reset();
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            const modal = document.getElementById('admin-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                this.editingId = null;
            }
        }

        async savePost() {
            const form = document.getElementById('post-form');
            const data = {
                title: form.querySelector('#form-title').value,
                excerpt: form.querySelector('#form-excerpt').value,
                content: form.querySelector('#form-content').value,
                category: form.querySelector('#form-category').value,
                tags: form.querySelector('#form-tags').value
            };

            if (!data.title || !data.excerpt || !data.content || !data.category) {
                alert('Por favor completa todos los campos obligatorios.');
                return;
            }

            // Wrap content in <p> tags if plain text
            if (!data.content.includes('<')) {
                data.content = data.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
            }

            if (this.editingId) {
                this.db.update(this.editingId, data);
            } else {
                this.db.create(data);
            }

            try {
                await this.apiFetch(`${API_BASE}/admin/posts`, {
                    method: 'PUT',
                    body: JSON.stringify(this.db.getAll())
                });
            } catch (e) {
                alert(`No se pudo guardar en API: ${e.message}`);
                return;
            }

            this.closeModal();
            this.renderPosts();
        }

        async deletePost(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
                this.db.delete(id);
                try {
                    await this.apiFetch(`${API_BASE}/admin/posts`, {
                        method: 'PUT',
                        body: JSON.stringify(this.db.getAll())
                    });
                } catch (e) {
                    alert(`No se pudo eliminar en API: ${e.message}`);
                    return;
                }
                this.renderPosts();
            }
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    const db = new BlogDB();

    document.addEventListener('DOMContentLoaded', async () => {
        await db.load();

        const page = document.body.dataset.page;

        if (page === 'blog') {
            const renderer = new BlogRenderer(db);
            renderer.render();
        }

        if (page === 'post') {
            const renderer = new PostRenderer(db);
            renderer.render();
        }

        if (page === 'admin') {
            const admin = new AdminPanel(db);
            // Expose globally for inline onclick handlers
            window.blogAdmin = admin;

            if (admin.isAuthenticated()) {
                document.getElementById('admin-login')?.remove();
                document.getElementById('admin-dashboard').style.display = 'block';
                admin.initDashboard();
            } else {
                document.getElementById('admin-login').style.display = 'flex';
                document.getElementById('admin-dashboard').style.display = 'none';
                admin.initLogin();
            }
        }

        // Navbar interactions for blog/post/admin pages
        new SimpleNavbar();
    });
})();
