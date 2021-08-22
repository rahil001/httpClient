import {
  RETRY_COUNT,
  RETRY_ERROR_CODES,
} from './constants';

export const isNetworkError = (error) => error.response && error.message.toLowerCase().indexOf('network error') !== -1;

export const isTimeout = (error) => !error.response && error.message.toLowerCase().indexOf('timeout') !== -1;

export const isRetryRequired = (error) => {
  const { config = {}, response = {} } = error;
  const { status } = response;

  if (config.retry) {
    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= (config.retryCount || RETRY_COUNT)) {
      return false;
    }

    const errorCodes = config.retryErrorCodes || RETRY_ERROR_CODES;
    // if error code matches error codes provided in the config
    if (errorCodes.includes(status)) {
      return true;
    }
    // check for timeout or network error
    if (isTimeout(error) || isNetworkError(error)) {
      return true;
    }
  }
  return false;
};

export const isNotString = (key) => {
  if (!key) {
    return true;
  }
  return typeof key !== 'string';
};

export const getMergedHeaders = (headers1 = {}, headers2 = {}) => ({ ...headers1, ...headers2 });

