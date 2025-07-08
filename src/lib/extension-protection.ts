// Browser Extension Protection
// This utility helps prevent browser extensions from causing app crashes

export function initializeExtensionProtection() {
  if (typeof window === 'undefined') return;

  // Add global error handler for extension errors
  const originalError = window.addEventListener;
  
  window.addEventListener('error', (event) => {
    // Check if error is from browser extension
    const isExtensionError = event.filename?.includes('chrome-extension://') ||
                           event.filename?.includes('moz-extension://') ||
                           event.error?.stack?.includes('chrome-extension://') ||
                           event.error?.stack?.includes('moz-extension://');

    if (isExtensionError) {
      console.warn('Browser extension error intercepted (non-critical):', event.error?.message || event.message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const isExtensionError = error?.stack?.includes('chrome-extension://') ||
                           error?.stack?.includes('moz-extension://') ||
                           error?.message?.includes('extension');

    if (isExtensionError) {
      console.warn('Browser extension promise rejection intercepted (non-critical):', error?.message || error);
      event.preventDefault();
    }
  });

  // Protect console methods from extension interference
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('chrome-extension://') || message.includes('moz-extension://')) {
      // Downgrade extension errors to warnings
      console.warn('[Extension]', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Add safe window property access
  const createSafePropertyDescriptor = (obj: any, prop: string) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor) {
      const originalGet = descriptor.get;
      const originalSet = descriptor.set;
      
      Object.defineProperty(obj, prop, {
        get() {
          try {
            return originalGet ? originalGet.call(this) : descriptor.value;
          } catch (error) {
            console.warn(`Extension tried to access ${prop} but failed:`, error);
            return null;
          }
        },
        set(value) {
          try {
            if (originalSet) {
              return originalSet.call(this, value);
            } else if (descriptor.writable) {
              descriptor.value = value;
            }
          } catch (error) {
            console.warn(`Extension tried to set ${prop} but failed:`, error);
          }
        },
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable
      });
    }
  };

  // Protect common properties that extensions might try to access
  try {
    createSafePropertyDescriptor(window, 'ethereum');
    createSafePropertyDescriptor(window, 'web3');
    createSafePropertyDescriptor(window, 'solana');
  } catch (error) {
    // Silently ignore if we can't protect these properties
  }
}

// Check if we're in a problematic browser environment
export function detectProblematicExtensions() {
  if (typeof window === 'undefined') return [];

  const detectedExtensions: string[] = [];

  // Check for common problematic extensions
  if ((window as any).ethereum) {
    detectedExtensions.push('Crypto Wallet (MetaMask/etc)');
  }

  if ((window as any).web3) {
    detectedExtensions.push('Web3 Provider');
  }

  if ((window as any).solana) {
    detectedExtensions.push('Solana Wallet');
  }

  // Check for extension script tags in document
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && (src.includes('chrome-extension://') || src.includes('moz-extension://'))) {
      detectedExtensions.push('Browser Extension Script');
      break;
    }
  }

  return detectedExtensions;
}

// Initialize protection when this module is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtensionProtection);
  } else {
    initializeExtensionProtection();
  }
} 