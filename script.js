/* ============================================
   MakeByJordan — Futuristic AI Landing Page
   JavaScript — Animations, Particles & Interactions
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // PARTICLE SYSTEM
    // ==========================================
    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: -1000, y: -1000 };
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.resize();
            this.init();
            this.bindEvents();
            this.animate();
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            this.ctx.scale(this.dpr, this.dpr);
        }

        init() {
            this.particles = [];
            const count = Math.min(Math.floor((this.width * this.height) / 15000), 80);
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.4 + 0.1,
                    hue: Math.random() > 0.5 ? 270 : 240 // purple or blue
                });
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.init();
            });

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        animate() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            this.particles.forEach((p, i) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around
                if (p.x < 0) p.x = this.width;
                if (p.x > this.width) p.x = 0;
                if (p.y < 0) p.y = this.height;
                if (p.y > this.height) p.y = 0;

                // Mouse interaction
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) {
                    const force = (200 - dist) / 200;
                    p.vx -= (dx / dist) * force * 0.02;
                    p.vy -= (dy / dist) * force * 0.02;
                }

                // Damping
                p.vx *= 0.99;
                p.vy *= 0.99;

                // Draw particle
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
                this.ctx.fill();

                // Draw connections
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (dist2 < 150) {
                        const opacity = (1 - dist2 / 150) * 0.15;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = `hsla(260, 60%, 60%, ${opacity})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // CURSOR GLOW
    // ==========================================
    class CursorGlow {
        constructor() {
            this.el = document.getElementById('cursorGlow');
            this.x = -1000;
            this.y = -1000;
            this.targetX = -1000;
            this.targetY = -1000;
            this.bindEvents();
            this.animate();
        }

        bindEvents() {
            document.addEventListener('mousemove', (e) => {
                this.targetX = e.clientX;
                this.targetY = e.clientY;
                this.el.classList.add('active');
            });

            document.addEventListener('mouseleave', () => {
                this.el.classList.remove('active');
            });
        }

        animate() {
            this.x += (this.targetX - this.x) * 0.08;
            this.y += (this.targetY - this.y) * 0.08;
            this.el.style.left = this.x + 'px';
            this.el.style.top = this.y + 'px';
            requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // NAVBAR
    // ==========================================
    class Navbar {
        constructor() {
            this.navbar = document.getElementById('navbar');
            this.toggle = document.getElementById('navToggle');
            this.mobileMenu = document.getElementById('mobileMenu');
            this.mobileLinks = document.querySelectorAll('.mobile-links a');
            this.isOpen = false;
            this.bindEvents();
        }

        bindEvents() {
            window.addEventListener('scroll', () => this.onScroll());
            this.toggle.addEventListener('click', () => this.toggleMenu());
            this.mobileLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }

        onScroll() {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
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
    // SCROLL ANIMATIONS
    // ==========================================
    class ScrollAnimator {
        constructor() {
            this.elements = document.querySelectorAll('[data-animate]');
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const delay = parseInt(entry.target.dataset.delay) || 0;
                            setTimeout(() => {
                                entry.target.classList.add('visible');
                            }, delay);
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            this.elements.forEach(el => this.observer.observe(el));
        }
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    class CounterAnimator {
        constructor() {
            this.counters = document.querySelectorAll('[data-count]');
            this.animated = new Set();
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !this.animated.has(entry.target)) {
                            this.animated.add(entry.target);
                            this.animateCounter(entry.target);
                        }
                    });
                },
                { threshold: 0.5 }
            );

            this.counters.forEach(el => this.observer.observe(el));
        }

        animateCounter(el) {
            const target = parseInt(el.dataset.count);
            const duration = 2000;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = target;
                }
            };

            requestAnimationFrame(update);
        }
    }

    // ==========================================
    // BAR FILL ANIMATION
    // ==========================================
    class BarAnimator {
        constructor() {
            this.bars = document.querySelectorAll('.bar-fill');
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                entry.target.classList.add('animated');
                            }, 300);
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.3 }
            );

            this.bars.forEach(el => this.observer.observe(el));
        }
    }

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================
    class SmoothScroll {
        constructor() {
            this.bindEvents();
        }

        bindEvents() {
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href === '#') return;

                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        const offset = 80;
                        const top = target.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({
                            top: top,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    }

    // ==========================================
    // MAGNETIC BUTTONS
    // ==========================================
    class MagneticButtons {
        constructor() {
            this.buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
            this.bindEvents();
        }

        bindEvents() {
            this.buttons.forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
                });

                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = '';
                });
            });
        }
    }

    // ==========================================
    // TILT EFFECT ON CARDS
    // ==========================================
    class TiltCards {
        constructor() {
            this.cards = document.querySelectorAll('.service-card, .project-card, .tech-category');
            this.bindEvents();
        }

        bindEvents() {
            this.cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    const tiltX = (y - 0.5) * 4;
                    const tiltY = (x - 0.5) * -4;

                    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }
    }

    // ==========================================
    // TYPING EFFECT FOR HERO (optional flair)
    // ==========================================
    class GlowingTrail {
        constructor() {
            this.serviceCards = document.querySelectorAll('.service-card');
            this.bindEvents();
        }

        bindEvents() {
            this.serviceCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    card.style.setProperty('--mouse-x', x + 'px');
                    card.style.setProperty('--mouse-y', y + 'px');

                    // Update card background glow
                    const bg = card.querySelector('.service-card-bg');
                    if (bg) {
                        bg.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(168, 85, 247, 0.06), transparent 60%)`;
                        bg.style.opacity = '1';
                    }
                });

                card.addEventListener('mouseleave', (card_el => {
                    return () => {
                        const bg = card_el.querySelector('.service-card-bg');
                        if (bg) {
                            bg.style.opacity = '0';
                        }
                    };
                })(card));
            });
        }
    }

    // ==========================================
    // PARALLAX EFFECT
    // ==========================================
    class ParallaxEffect {
        constructor() {
            this.orbs = document.querySelectorAll('.hero-orb');
            this.bindEvents();
        }

        bindEvents() {
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                this.orbs.forEach((orb, i) => {
                    const speed = 0.15 + i * 0.05;
                    orb.style.transform = `translateY(${scrollY * speed}px)`;
                });
            });
        }
    }

    // ==========================================
    // ACTIVE NAV LINK UPDATER
    // ==========================================
    class ActiveNavUpdater {
        constructor() {
            this.sections = document.querySelectorAll('.section, .hero');
            this.navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const id = entry.target.getAttribute('id');
                            this.navLinks.forEach(link => {
                                link.style.color = '';
                                if (link.getAttribute('href') === '#' + id) {
                                    link.style.color = 'var(--text-primary)';
                                }
                            });
                        }
                    });
                },
                {
                    threshold: 0.3,
                    rootMargin: '-80px 0px -50% 0px'
                }
            );

            this.sections.forEach(section => this.observer.observe(section));
        }
    }

    // ==========================================
    // INITIALIZE EVERYTHING
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // Core systems
        const canvas = document.getElementById('particles-canvas');
        if (canvas) {
            new ParticleSystem(canvas);
        }

        // Only enable cursor effects on non-touch devices
        if (window.matchMedia('(pointer: fine)').matches) {
            new CursorGlow();
            new MagneticButtons();
            new TiltCards();
            new GlowingTrail();
        }

        // UI Systems
        new Navbar();
        new ScrollAnimator();
        new CounterAnimator();
        new BarAnimator();
        new SmoothScroll();
        new ParallaxEffect();
        new ActiveNavUpdater();

        // Preloader fade
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease';
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });
})();
