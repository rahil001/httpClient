
# A lightweight javascript HTTP client

This package provides interface for javascript based application to easily execute HTTP requests and asynchronously process HTTP responses.

## Overview
- This NPM package exports defaultHttpClient (a singleton class) and HttpClient class.
- Importing defaultHttpClient will give you the default instance of the HttpClient class (always gives a singleton object).
- Importing HttpClient will give you the HttpClient class. (we will dive deep about its usage below).
- Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, HEAD).
- Supports exponential retrying of requests.
- Supports refresh token injection.
- Support for setting default config from composite App level.
- Feature Apps can clone a new instance merging its own config with composite's config.
- Support for transforming request and response.
- Automatic transforms for JSON data.

## Important Guidelines
- Composite App will always create defaultHttpClient instance and set the initial configs (e.g BaseURL, headers, timeout).
- Feature App will have an option to clone an instance from the defaultHttpClient if it wants to inherit config properties from composite App.
- Feature App will provide a unique key while cloning from the default instance.
- Feature App can also create altogether a new instance without cloning by importing HttpClient class.

### How to import

1. defaultHttpClient
```
import { defaultHttpClient } from './HttpClient';
```
2. HttpClient
```
import { HttpClient } from './HttpClient';
```

### Composite App
```
import { defaultHttpClient } from './HttpClient';

//  for fetching refresh token and setting the authorization header to the request (use your header name)
const refreshTokenCallback = async (request) => {

    // Add logic for fetching refresh token 
    const token = await sso.getFreshAccessToken();

    // set auth header in the request
    request.headers['X-auth'] = `bearer ${token}`;

    // don't forget to return request (else request will dangle)
    return request;
};
// set default config
    defaultHttpClient.setConfig({
        baseURL: 'https://reqres.in',
        timeout: 50000,
        headers: {
        'Cache-Control': 'max-age=30000'
        },
        refreshTokenCallback,
    });

// you can also merge the config with the existing config

    defaultHttpClient.mergeConfig({
        headers: {
        'auth-token': 'bearer ****'
        },
        retry: true
    });

 
// composite can also access all methods and make all HTTP calls
    defaultHttpClient.get('/api/users?page=2', {
        retry: true,
        retryErrorCodes: [501]
    })
    .then((response) => {
        console.log(response.data);
    })
    .catch((error) => {
        console.warn(error);
    });
 
 
// Want to use async/await? Add the `async` keyword to your outer function/method.
    const getUser = async () => {
        try {
            const response = await defaultHttpClient.get('/api/users?page=2', {
                retry: true,
                retryErrorCodes: [500, 503],
                retryCount: 3,
                retryDelay: 3000
            });
            console.log(response);
        } catch (error) {
            console.warn(error);
        }
    }
 
 
// Want to make call to graphQl enpoint? Here you go!
    const postAuthor = async () => {
        try {
            const response = await defaultHttpClient.post('/graphql', {
            data: {
            query: `
                query PostsForAuthor {
                    author(id: 1) {
                    firstName
                        posts {
                          title
                          votes
                        }
                    }
                }
                `
                }
            }
        );
        } catch (error) {
            console.warn(error);
        }
    }
```
### Feature App
1. If feature App wants to clone an instance from default Instance created by composite App then call the clone method like below.
calling clone method will merge the config of feature and composite app and returns a new instance.
3. second argument is the key passed while cloning so as to keep the reference of cloned instance.
4. cloned instance will eventually be deleted from the memory if feature App unmounts or removed.

#### Create a cloned instance
This is how feature App can clone from default instance
```
import { defaultHttpClient } from '@walmart/functional-components';
 
// call clone method with new set of configs
    const httpClient = defaultHttpClient.clone({
      timeout: 6000,
      headers: {
        'X-Auth-Token': 'bearer hysdihbudsunbaghsuehjd'
      }
    }, 'key-miniApp');
     
// Make POST call
    const postUser = async () => {
        try {
            const response = await httpClient.post('/api/users', {
                data: {
                    "name": "morpheus",
                    "job": "leader"
                }
            });
            console.log(response);
        } catch (error) {
            console.warn(error);
        }
    }
     
// Call removeInstance by passing the key when component unmounts
    componentWillUnmount() {
      defaultHttpClient.removeInstance('key-miniApp');
    }
```

#### Create a brand new instance
Feature can also create an instance without inheriting config from composite App.
```

import { HttpClient } from '@walmart/functional-components';

// function for fetching refresh token from sso and set the auth header
const refreshTokenCallback = async (request) => {
    // logic for fetching refresh token 
    const token = await sso.getFreshAccessToken();
    // set auth header in the request
    request.headers['Authorization'] = `bearer ${token}`; 
    // don't forget to return request (else request will dangle)
    return request;
};
// create a new httpClient instance
    const httpClient = new HttpClient({
      baseURL: 'https://reqres.in',
      timeout: 8000,
      refreshTokenCallback,
    });
     
// Make Http Calls
    const getUser = async () => {
        try {
            const response = await defaultHttpClient.get('/api/users?page=2');
            console.log(response.data);
        } catch (error) {
            console.warn(error);
        }
    }
```

### Instance Methods

httpClient.get(url, options)

httpClient.post(url, options)

httpClient.put(url, options)

httpClient.delete(url, options)

httpClient.patch(url, options)

httpClient.head(url, options)

httpClient.options(url, options)


### Options config

```javascript

// `headers` are custom headers to be sent
headers: {'X-Requested-With': 'XMLHttpRequest'},

// `data` is the data to be sent as the request body
// Only applicable for request methods 'PUT', 'POST', 'DELETE , and 'PATCH'
data: {
    name: "morpheus",
},

// `responseType` indicates the type of data that the server will respond with
// options are: 'arraybuffer', 'document', 'json', 'text', 'stream'
responseType: 'json', // default

// Add retries for the request
retry: true, // default false

// The number of retries you want to make
retryCount: 2 // default 3

// delay between the retries
retryDelay: 3000 // default 2000 millisecond

// configure retries for specific error codes as array 
retryErrorCodes: [ 502 ] // default [500, 502, 503, 504]

// you can add backoff delay between retries
retryDelay: 3000 // default 2000 millisecond

```

### Response Schema

```javascript

// `data` is the response that was provided by the server
data: {},

// `status` is the HTTP status code from the server response
status: 200,

// `statusText` is the HTTP status message from the server response
statusText: 'OK',

// `headers` the HTTP headers that the server responded with
headers: {},

// `config` is the config that was provided to `HttpClient` for the request
config: {},

// `request` is the request that generated this response
request: {}

```
