import axios  from 'axios';
import {isRetryRequired, getMergedHeaders, isNotString} from './helpers';
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
  HTTP_METHOD_OPTIONS,
  HTTP_METHOD_DELETE,
  HTTP_METHOD_PATCH,
  HTTP_METHOD_PUT,
  HTTP_METHOD_HEAD,
  RETRY_DELAY,
  HEADERS,
} from './constants';

class HttpClient  {
  constructor(clientConfig) {
    const {
      baseURL,
      timeout,
      headers = {},
    } = clientConfig;

    this.instance = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers
      },
      timeout
    });

    this.config = clientConfig;

    this.clonedInstanceMap = {};

    this.instance.interceptors.request.use(async (request) => {
      let originalRequest = request;
      const {refereshTokenCallback} = this.config;
      if (typeof refereshTokenCallback === 'function') {
        originalRequest  = await refereshTokenCallback(request)  || request;
      }
      return originalRequest;
    }, (error) => Promise.reject(error));

    this.instance.interceptors.response.use((response) => response, async (error) => {
      const { config } = error;

      if (isRetryRequired(error)) {
        config.__retyCount += 1;

        const axiosRetry = new Promise((resolve) => {
          setTimeout(() => {
              resolve(axios(config));
          }, (config.retryDelay || RETRY_DELAY) * config.__retryCount);
        });
        return axiosRetry.then(() => this.makeRequest(config));
      }
      return Promise.reject(error);
    })
  }

  setConfig(config) {
    this.config = config;
  }

  clone(config, key) {
    // check for the key type
    if (isNotString(key)) {
      return null;
    }
    // if the instance already exists call the mergeConfig and returns the same instance
    if (this.clonedInstanceMap[key]) {
      const instance = this.clonedInstanceMap[key];
      instance.mergeConfig(config);
      return instance;
    }
    // merge the headers
    const headers = getMergedHeaders(this.config[HEADERS], config[HEADERS]);
    // create a new instance
    const instance = new HttpClient({ ...this.config, ...config, headers });
    this.clonedInstanceMap[key] = instance;
    return instance;
  }

  removeInstance(key) {
    if (isNotString(key)) {
      return;
    }
    // if there is no instance for this key just return
    if (!this.clonedInstanceMap[key]) {
      return;
    }
    delete this.clonedInstanceMap[key];
  }

  mergeConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      headers: getMergedHeaders(this.config[HEADERS], config[HEADERS])
    }
  }

  makeRequest(config) {
    const { method, url, ...rest } = config;

    switch (method.toUpperCase()) {
      case HTTP_METHOD_GET:
        return this.get(url, rest);
      case HTTP_METHOD_POST:
        return this.post(url, rest);
      case HTTP_METHOD_PUT:
        return this.put(url, rest);
      case HTTP_METHOD_DELETE:
        return this.delete(url, rest);
      case HTTP_METHOD_PATCH:
        return this.patch(url, rest);
      case HTTP_METHOD_HEAD:
        return this.head(url, rest);
      case HTTP_METHOD_OPTIONS:
        return this.options(url, rest);
      default:
        return null;
    }
  }

  get(url, data = {}) {
    this.instance.get(url, {
      ...this.config,
      ...data
    });
  }

  post(url, options = {}) {
    this.instance.post(url, {
      ...this.config,
      ...options
    });
  }

  put(url, options = {}) {
    this.instance.put(url, {
      ...this.config,
      ...options
    });
  }

  patch(url, options = {}) {
    const { data = {}, ...rest } = options;
    return this.instance.patch(url, data, {
      ...this.config, ...rest,
    });
  }

  delete(url, options = {}) {
    this.instance.delete(url, {
      ...this.config,
      ...options
    });
  }

  options(url, options = {}) {
    return this.instance.options(url, {
      ...this.config, ...options,
    });
  }

  head(url, options = {}) {
    return this.instance.head(url, {
      ...this.config, ...options,
    });
  }
}

export default new HttpClient();