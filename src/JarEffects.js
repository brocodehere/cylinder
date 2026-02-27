// Pure vanilla JavaScript and CSS for jar effects
// No external dependencies - performance optimized

class JarEffects {
  constructor() {
    this.activeEffects = new Map(); // Track effects per jar
    this.isTabVisible = true;
    this.isMobile = false;
    this.prefersReducedMotion = false;
    
    this.init();
  }

  init() {
    // Detect device and preferences
    this.detectCapabilities();
    
    // Setup tab visibility detection
    this.setupTabVisibility();
    
    // Setup resize observer for performance
    this.setupResizeObserver();
  }

  detectCapabilities() {
    // Mobile detection
    this.isMobile = window.innerWidth <= 768;
    
    // Reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setupTabVisibility() {
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
      
      // Pause all effects when tab is hidden
      if (!this.isTabVisible) {
        this.activeEffects.forEach((effects, jarId) => {
          this.stopEffects(jarId);
        });
      }
    }, { passive: true });
  }

  setupResizeObserver() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.isMobile = window.innerWidth <= 768;
      }, 250);
    }, { passive: true });
  }

  // Add effects to a jar element
  addEffects(jarElement, topicId) {
    try {
      if (this.prefersReducedMotion || this.isMobile) {
        return; // Skip effects for accessibility/mobile
      }

      const jarId = `jar-${topicId}`;

      // Skip if already initialized
      if (this.activeEffects.has(jarId)) {
        return;
      }

      const effects = {
        jar: jarElement,
        vibrationInterval: null,
        isActive: true, // Always active now
        isVisible: true
      };

      this.activeEffects.set(jarId, effects);

      // Start effects immediately
      this.startEffects(jarId);
      
      // Setup intersection observer for visibility
      this.setupVisibilityObserver(jarId);
      
      // Fallback: Start vibration immediately after short delay
      setTimeout(() => {
        this.startEffects(jarId);
      }, 500);
      
    } catch (error) {
      // Silently handle errors
    }
  }

  setupVisibilityObserver(jarId) {
    const effects = this.activeEffects.get(jarId);
    if (!effects) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          effects.isVisible = entry.isIntersecting;
          
          if (effects.isVisible && this.isTabVisible) {
            this.startEffects(jarId);
          } else {
            this.stopEffects(jarId);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(effects.jar);
    effects.observer = observer;
  }

  startEffects(jarId) {
    const effects = this.activeEffects.get(jarId);
    if (!effects) return;

    // Only start if visible and tab is active
    if (!this.isTabVisible || this.isMobile || this.prefersReducedMotion) {
      return;
    }

    // Start vibration with random intervals
    if (!effects.vibrationInterval) {
      this.startVibrationCycle(jarId);
    }
  }

  startVibrationCycle(jarId) {
    const effects = this.activeEffects.get(jarId);
    if (!effects) return;

    const vibrate = () => {
      if (!effects.isVisible || !this.isTabVisible) {
        this.stopVibration(effects.jar);
        return;
      }
      
      // Random vibration duration (2-4 seconds)
      const duration = 2000 + Math.random() * 2000;
      
      // Start vibration
      this.startVibration(effects.jar);
      
      // Stop vibration after duration
      setTimeout(() => {
        this.stopVibration(effects.jar);
        
        // Schedule next vibration after pause (3-6 seconds)
        if (effects.isVisible && this.isTabVisible) {
          const pause = 3000 + Math.random() * 3000;
          effects.vibrationInterval = setTimeout(vibrate, pause);
        }
      }, duration);
    };

    // Start first vibration
    vibrate();
  }

  startVibration(jarElement) {
    try {
      // Add vibration class for CSS animation
      jarElement.classList.add('jar-vibrating');
    } catch (error) {
      // Silently handle errors
    }
  }

  stopVibration(jarElement) {
    try {
      // Remove vibration class
      jarElement.classList.remove('jar-vibrating');
    } catch (error) {
      // Silently handle errors
    }
  }

  stopEffects(jarId) {
    const effects = this.activeEffects.get(jarId);
    if (!effects) return;

    // Stop vibration
    this.stopVibration(effects.jar);
  }

  // Clean up method
  destroy() {
    this.activeEffects.forEach((effects, jarId) => {
      this.stopEffects(jarId);
      
      // Clean up intersection observer
      if (effects.observer) {
        effects.observer.disconnect();
      }
    });
    this.activeEffects.clear();
  }
}

// Create singleton instance
const jarEffects = new JarEffects();

export default jarEffects;
