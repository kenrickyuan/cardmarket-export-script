// Development helpers and utilities

// Declare the build-time constant
declare const __DEV__: boolean;

export const devLog = (message: string, data?: unknown): void => {
  if (__DEV__) {
    console.log(`🔧 MKM Helper DEV: ${message}`, data || "");
  }
};

export const devError = (error: Error | string, context?: string): void => {
  if (__DEV__) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : "";
    console.error(`🚨 MKM Helper DEV Error${context ? ` (${context})` : ""}:`, {
      message: errorMessage,
      stack: errorStack,
    });
  }
};

export const devTiming = (label: string): (() => void) => {
  if (__DEV__) {
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

export const devAssert = (condition: unknown, message: string): void => {
  if (__DEV__ && !condition) {
    console.error(`🔥 Assertion failed: ${message}`);
  }
};
