/**
 * Mobile-Only Performance Enhancements
 * Only runs on mobile devices - Desktop/VR unaffected
 */

(function() {
    'use strict';
    
    // Only run on mobile devices
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        console.log('📱 Mobile optimizations skipped - Desktop/VR mode active');
        return;
    }
    
    console.log('📱 Initializing mobile optimizations...');
    
    // Detect iOS specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS) {
        console.log('🍎 iOS detected - applying iOS-specific fixes');
    }
    
    // ============================================
    // LAZY LOADING FOR IMAGES (Mobile Only)
    // ============================================
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.01
        });
        
        // Apply lazy loading to gallery thumbnails
        document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('.video-thumbnail, .video-card img');
            
            images.forEach(img => {
                if (img.src && !img.dataset.src) {
                    img.dataset.src = img.src;
                    // Use a tiny placeholder
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"%3E%3Crect fill="%231b2a41" width="16" height="9"/%3E%3C/svg%3E';
                }
                imageObserver.observe(img);
            });
            
            console.log(`📸 Lazy loading enabled for ${images.length} images`);
        });
    }
    
    // ============================================
    // VIDEO BACKGROUND OPTIMIZATION (Mobile Only)
    // ============================================
    
    document.addEventListener('DOMContentLoaded', function() {
        const videoBackground = document.getElementById('video-background');
        
        if (videoBackground) {
            // Completely remove video on mobile to save memory
            videoBackground.remove();
            console.log('🎥 Video background removed on mobile');
        }
    });
    
    // ============================================
    // MEMORY MANAGEMENT (iOS/Safari)
    // ============================================
    
    if (isIOS || isSafari) {
        // REMOVED: pagehide cleanup was causing WebGL context loss on page navigation
        // The browser will handle cleanup when truly unloading
        
        // Handle visibility change - only pause, don't destroy
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                console.log('📱 Page hidden - pausing videos only');
                document.querySelectorAll('video').forEach(v => v.pause());
                // DO NOT clear WebGL context - let it persist
            }
        });
    }
    
    // ============================================
    // ERROR HANDLING (Mobile Only)
    // ============================================
    
    window.addEventListener('error', function(e) {
        // Only handle specific mobile-related errors
        if (e.error && e.error.message) {
            const errorMsg = e.error.message.toLowerCase();
            
            if (errorMsg.includes('webgl') || 
                errorMsg.includes('memory') ||
                errorMsg.includes('quota') ||
                errorMsg.includes('texture')) {
                
                console.error('📱 Mobile error detected:', e.error.message);
                
                // Show user-friendly message
                showMobileError('Device memory low. Try closing other apps and refreshing.');
                
                // Prevent default crash
                e.preventDefault();
                return true;
            }
        }
    }, true);
    
    // Show error message helper
    function showMobileError(message) {
        // Check if error already showing
        if (document.getElementById('mobile-error-toast')) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'mobile-error-toast';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 59, 48, 0.95);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.innerHTML = `<strong>⚠️ ${message}</strong>`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
    
    // ============================================
    // REDUCE ANIMATION LOAD (Mobile Only)
    // ============================================
    
    document.addEventListener('DOMContentLoaded', function() {
        // Disable logo strip animations on mobile
        const logoIcons = document.querySelectorAll('.logo-icon');
        logoIcons.forEach(icon => {
            icon.style.animation = 'none';
        });
        
        console.log('✨ Simplified animations for mobile');
    });
    
    // ============================================
    // TOUCH OPTIMIZATION (Mobile Only)
    // ============================================
    
    document.addEventListener('DOMContentLoaded', function() {
        // Add touch-action for better scrolling
        document.body.style.touchAction = 'pan-y';
        
        // Prevent double-tap zoom on buttons
        const buttons = document.querySelectorAll('.btn, .play-button, .filter-btn');
        buttons.forEach(btn => {
            btn.style.touchAction = 'manipulation';
        });
        
        console.log('👆 Touch interactions optimized');
    });
    
    // ============================================
    // GALLERY SPECIFIC (Mobile Only)
    // ============================================
    
    if (window.location.pathname.includes('gallery')) {
        document.addEventListener('DOMContentLoaded', function() {
            // Limit initial video cards shown
            const videoCards = document.querySelectorAll('.video-card');
            
            console.log(`🎬 Gallery page - ${videoCards.length} cards found`);
            
            // All cards are visible, but images are lazy loaded
            // This is handled by the intersection observer above
        });
    }
    
    // ============================================
    // PERFORMANCE MONITORING (Mobile Only)
    // ============================================
    
    if ('performance' in window && 'memory' in performance) {
        // Log memory usage (Chrome only)
        setInterval(function() {
            const memory = performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
            const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
            
            if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
                console.warn(`⚠️ High memory usage: ${usedMB}MB / ${limitMB}MB`);
            }
        }, 30000); // Check every 30 seconds
    }
    
    console.log('✅ Mobile optimizations initialized successfully');
    
})();
