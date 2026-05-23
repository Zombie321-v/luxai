// Premium Animations Module
class AnimationHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupMouseFollowEffect();
        this.setupTiltEffect();
        this.setupScrollAnimations();
        this.setupButtonRippleEffect();
        this.setupFloatingElements();
    }

    // Mouse follow effect for particles
    setupMouseFollowEffect() {
        document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            
            // Update CSS custom properties for mouse position
            document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
            
            // Animate floating elements based on mouse position
            const floatingElements = document.querySelectorAll('.floating');
            floatingElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const moveX = (clientX - centerX) / 50;
                const moveY = (clientY - centerY) / 50;
                
                el.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    }

    // 3D Tilt effect on cards
    setupTiltEffect() {
        document.querySelectorAll('.tilt-effect').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }

    // Scroll animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeIn');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe message containers
        document.querySelectorAll('.message-container').forEach(msg => {
            observer.observe(msg);
        });
    }

    // Button ripple effect
    setupButtonRippleEffect() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            const ripple = document.createElement('span');
            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            target.style.position = 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // Floating elements animation
    setupFloatingElements() {
        const floatingElements = document.querySelectorAll('.animate-float');
        floatingElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.5}s`;
        });
    }

    // Animated counter
    animateCounter(element, target, duration = 2000) {
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const animate = () => {
            current += increment;
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                element.textContent = target;
                return;
            }
            element.textContent = Math.round(current);
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Typewriter effect
    typewriterEffect(element, text, speed = 50) {
        let index = 0;
        element.textContent = '';
        
        const type = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            }
        };
        
        type();
    }

    // Smooth scroll to element
    smoothScrollTo(element, duration = 500) {
        const target = element.getBoundingClientRect().top + window.pageYOffset;
        const start = window.pageYOffset;
        const distance = target - start;
        let startTime = null;
        
        const animation = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            window.scrollTo(0, start + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    }

    // Parallax effect
    setupParallax() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('[data-parallax]');
            
            parallaxElements.forEach(el => {
                const speed = el.dataset.parallax || 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // Glow effect on hover
    setupGlowEffect() {
        document.querySelectorAll('.glow-on-hover').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                el.style.setProperty('--glow-x', `${x}px`);
                el.style.setProperty('--glow-y', `${y}px`);
            });
        });
    }
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize animations
window.animationHandler = new AnimationHandler();