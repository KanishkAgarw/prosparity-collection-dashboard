
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's a user already exists error (422)
      if (error.message?.includes('User already registered') || error.status === 422) {
        throw error;
      }
      
      // Don't retry if it's not a rate limit error
      if (!error.message?.includes('rate limit') && !error.message?.includes('429') && error.status !== 429) {
        throw error;
      }
      
      if (attempt === options.maxRetries) {
        break;
      }
      
      // Much more aggressive exponential backoff with jitter for rate limits
      const baseBackoff = options.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 10000; // Up to 10 seconds of jitter
      const delay = Math.min(baseBackoff + jitter, options.maxDelay);
      
      console.log(`Rate limit hit, waiting ${Math.round(delay/1000)}s before retry (attempt ${attempt + 1}/${options.maxRetries + 1})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

export interface BulkOperationProgress {
  current: number;
  total: number;
  success: number;
  failed: number;
  skipped: number;
  currentItem?: string;
}

export type ProgressCallback = (progress: BulkOperationProgress) => void;
