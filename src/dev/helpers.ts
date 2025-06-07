// Development helpers and utilities

export const devLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 MKM Helper DEV: ${message}`, data || '');
  }
};

export const devError = (error: Error | string, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : '';
    console.error(`🚨 MKM Helper DEV Error${context ? ` (${context})` : ''}:`, {
      message: errorMessage,
      stack: errorStack
    });
  }
};

export const devTiming = (label: string): (() => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    console.time(`⏱️ ${label}`);
    
    return () => {
      const end = performance.now();
      console.timeEnd(`⏱️ ${label}`);
      console.log(`📊 ${label} took ${(end - start).toFixed(2)}ms`);
    };
  }
  
  return () => {}; // No-op in production
};

export const devAssert = (condition: any, message: string): void => {
  if (process.env.NODE_ENV === 'development' && !condition) {
    console.error(`🔥 Assertion failed: ${message}`);
    debugger; // Trigger debugger in development
  }
};