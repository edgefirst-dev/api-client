# @edgefirst-dev/api-client

The `APIClient` class provides a flexible and extensible HTTP client for making API requests. It supports common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and allows customization of the request and response handling through the `before` and `after` interceptor hooks.

## Installation

```sh
bun add @edgefirst-dev/api-client
```

## Usage

Import the `APIClient` and create a new instance to make API requests.

```ts
import { APIClient } from "@edgefirst-dev/api-client";

let client = new APIClient("https://api.example.com");
let response = await client.get("/users/1");
```

### Customization

You can customize the request and response handling by extending the `APIClient` class and overriding the `before` and `after` methods.

```ts
class CustomAPIClient extends APIClient {
  async before(request: Request) {
    // Add a custom header to the request
    request.headers.set("X-Custom-Header", "value");

    return request;
  }

  async after(request: Request, response: Response) {
    if (response.status === 401) {
      // Handle unauthorized error
      throw new Error("Unauthorized");
    }

    return response;
  }
}

let client = new CustomAPIClient("https://api.example.com");
let response = await client.get("/users/1");
```

You can also define custom methods in the subclass to encapsulate common API calls.

```ts
import { ObjectParser } from "@edgefirst-dev/data/parser";

class CustomAPIClient extends APIClient {
  async fetchUserData(id: number) {
    let response = await this.get(`/users/${id}`);
    let data = await response.json();
    return new ObjectParser(data);
  }
}

let client = new CustomAPIClient("https://api.example.com");
let user = await client.fetchUserData(1);
let userName = user.string("name");
```

By overriding the constructor, you can provide a default base URL.

```ts
class CustomAPIClient extends APIClient {
  constructor() {
    super("https://api.example.com");
  }
}

let client = new CustomAPIClient();
```

### Interceptos

You can add interceptors to the `APIClient` instance to customize the request and response handling.

```ts
let client = new APIClient("https://api.example.com");

client.on("before", async (request) => {
  // Add a custom header to the request
  request.headers.set("X-Custom-Header", "value");

  return request;
});

client.on("after", async (request, response) => {
  if (response.status === 401) {
    // Handle unauthorized error
    throw new Error("Unauthorized");
  }

  return response;
});
```

You can also remove interceptors using the `off` method.

```ts
async function beforeInterceptor(request) {
  // Add a custom header to the request
  request.headers.set("X-Custom-Header", "value");

  return request;
}

let client = new APIClient("https://api.example.com");

client.on("before", beforeInterceptor); // Add the interceptor
client.off("before", beforeInterceptor); // Remove the interceptor
```

The sub-class interceptors run before the instance interceptors.

```ts
class CustomAPIClient extends APIClient {
  async before(request: Request) {
    // Add a custom header to the request
    request.headers.set("X-Custom-Header", "1");

    return request;
  }
}

let client = new CustomAPIClient("https://api.example.com");

client.on("before", async (request) => {
  // Add a custom header to the request
  request.headers.set("X-Custom-Header", "2");

  return request;
});
```

Here the `X-Custom-Header` will be set to `2` in the request because the instance interceptor overrides the header set by the sub-class interceptor.

### Testing

You can easily test your API calls using the `APIClient` with [msw](https://mswjs.io/) to mock the API responses.

```ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/native"; // or "msw/node" or "msw/browser"

let server = setupServer(
  http.get("https://api.example.com/users/1", (req, res, ctx) => {
    return res(ctx.json({ id: 1, name: "John Doe" }));
  })
);

server.listen();

let client = new APIClient("https://api.example.com");
let response = await client.get("/users/1");
let data = await response.json(); // { id: 1, name: "John Doe" }
```

### Error Handling

The `APIClient` class never throws an error except for network errors. You can handle API errors by checking the response status code.

```ts
let client = new APIClient("https://api.example.com");

try {
  let response = await client.get("/users/1");
  if (response.status === 401) {
    // Handle unauthorized error
    throw new Error("Unauthorized");
  }
  // Handle other errors or success
} catch (error) {
  // Handle network error
  console.error(error);
}
```

Alternatively, you can use the `after` interceptor to handle common API errors.

```ts
class CustomAPIClient extends APIClient {
  async after(request: Request, response: Response) {
    if (response.status === 401) {
      // Handle unauthorized error
      throw new Error("Unauthorized");
    }

    return response;
  }
}
```

Or you can use the `on` method to add an interceptor to handle common API errors.

```ts
let client = new APIClient("https://api.example.com");

client.on("after", async (request, response) => {
  if (response.status === 401) {
    // Handle unauthorized error
    throw new Error("Unauthorized");
  }

  return response;
});
```

### Timeout

You can set a timeout for the API requests using the `signal` option.

```ts
let client = new APIClient("https://api.example.com");
await client.get("/users/1", { signal: AbortSignal.timeout(5000) });
```

## License

See [LICENSE](./LICENSE)

## Author

- [Sergio Xalambrí](https://sergiodxa.com)
