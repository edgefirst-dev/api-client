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

  async after(response: Response) {
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
class CustomAPIClient extends APIClient {
  async fetchUserData(id: number) {
    let response = await this.get(\`/users/\${id}\`);
    return response.json();
  }
}

let client = new CustomAPIClient("https://api.example.com");
let data = await client.fetchUserData(1);
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

## License

See [LICENSE](./LICENSE)

## Author

- [Sergio Xalambrí](https://sergiodxa.com)
