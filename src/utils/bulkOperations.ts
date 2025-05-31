
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
      
      // Don't retry if it's not a rate limit error
      if (!error.message?.includes('rate limit') && !error.message?.includes('429')) {
        throw error;
      }
      
      if (attempt === options.maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        options.maxDelay
      );
      
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${options.maxRetries + 1})`);
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
  currentItem?: string;
}

export type ProgressCallback = (progress: BulkOperationProgress) => void;
