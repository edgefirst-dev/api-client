import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/native";

import { APIClient } from ".";

describe(APIClient.name, () => {
	const server = setupServer();

	beforeAll(() => server.listen());

	beforeEach(() =>
		server.resetHandlers(
			http.all("https://example.com/path", () => {
				return HttpResponse.text("It works!");
			}),
		),
	);

	afterAll(() => server.close());

	test("#constructor", () => {
		let client = new APIClient(new URL("https://example.com"));
		expect(client).toBeInstanceOf(APIClient);
	});

	test("#fetch", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.fetch("/path");
		expect(response).toBeInstanceOf(Response);
	});

	test("#get", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.get("/path");
		expect(response).toBeInstanceOf(Response);
	});

	test("#post", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.post("/path");
		expect(response).toBeInstanceOf(Response);
	});

	test("#patch", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.patch("/path");
		expect(response).toBeInstanceOf(Response);
	});

	test("#put", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.put("/path");
		expect(response).toBeInstanceOf(Response);
	});

	test("#delete", async () => {
		let client = new APIClient(new URL("https://example.com"));
		let response = await client.delete("/path");
		expect(response).toBeInstanceOf(Response);
	});

	describe("Sub-Class", () => {
		class CustomClient extends APIClient {
			constructor() {
				super(new URL("https://sub.example.com"));
			}

			async before(request: Request) {
				request.headers.set("X-Custom", "Header");
				return request;
			}

			async after(_: Request, response: Response) {
				if (response.status === 400) throw new Error("Bad request");
				return response;
			}
		}

		test("#constructor", () => {
			let client = new CustomClient();
			expect(client).toBeInstanceOf(CustomClient);
		});

		test("#fetch with before", async () => {
			let client = new CustomClient();

			server.resetHandlers(
				http.all("https://sub.example.com/path", ({ request }) => {
					expect(request.headers.get("X-Custom")).toBe("Header");
					return HttpResponse.text("It works!");
				}),
			);

			await client.fetch("/path");
		});

		test("#fetch with after", async () => {
			let client = new CustomClient();

			server.resetHandlers(
				http.all("https://sub.example.com/path", () => {
					return HttpResponse.text("Bad request", { status: 400 });
				}),
			);

			expect(client.fetch("/path")).rejects.toThrow("Bad request");
		});
	});

	describe("Instance Interceptor", () => {
		test("can attach before interceptor to instance", async () => {
			let randomValue = crypto.randomUUID();

			let client = new APIClient(new URL("https://example.com"));

			client.on("before", async (request) => {
				request.headers.set("X-Custom", randomValue);
				return request;
			});

			server.resetHandlers(
				http.all("https://example.com/path", ({ request }) => {
					return HttpResponse.text(request.headers.get("X-Custom"));
				}),
			);

			let response = await client.get("/path");
			expect(await response.text()).toBe(randomValue);
		});

		test("can attach after interceptor to instance", async () => {
			let client = new APIClient(new URL("https://example.com"));

			client.on("after", async (_, response) => {
				if (response.status === 400) throw new Error("Bad request");
				return response;
			});

			server.resetHandlers(
				http.all("https://example.com/path", () => {
					return HttpResponse.text("Bad request", { status: 400 });
				}),
			);

			expect(client.fetch("/path")).rejects.toThrow("Bad request");
		});

		test("can attach multiple before interceptors to instance", async () => {
			let client = new APIClient(new URL("https://example.com"));

			client.on("before", async (request) => {
				request.headers.set("X-Custom", "First");
				return request;
			});

			client.on("before", async (request) => {
				request.headers.set("X-Custom", "Second");
				return request;
			});

			server.resetHandlers(
				http.all("https://example.com/path", ({ request }) => {
					return HttpResponse.text(request.headers.get("X-Custom"));
				}),
			);

			let response = await client.get("/path");
			expect(await response.text()).toBe("Second");
		});

		test("can attach multiple after interceptors to instance", async () => {
			let client = new APIClient(new URL("https://example.com"));

			client.on("after", async (_, response) => {
				if (response.status === 400) throw new Error("Bad request");
				return response;
			});

			client.on("after", async (_, response) => {
				if (response.status === 401) throw new Error("Unauthorized");
				return response;
			});

			server.resetHandlers(
				http.all("https://example.com/path", () => {
					return HttpResponse.text("Unauthorized", { status: 401 });
				}),
			);

			expect(client.fetch("/path")).rejects.toThrow("Unauthorized");
		});

		test("sub-class before interceptos runs before instance interceptors", async () => {
			class CustomClient extends APIClient {
				constructor() {
					super(new URL("https://example.com"));
				}

				async before(request: Request) {
					request.headers.set("X-Custom", "Sub-Class");
					return request;
				}
			}

			let client = new CustomClient();

			client.on("before", async (request) => {
				request.headers.set("X-Custom", "Instance");
				return request;
			});

			server.resetHandlers(
				http.all("https://example.com/path", ({ request }) => {
					return HttpResponse.text(request.headers.get("X-Custom"));
				}),
			);

			let response = await client.get("/path");
			expect(await response.text()).toBe("Instance");
		});

		test("sub-class after interceptos runs before instance interceptors", async () => {
			class CustomClient extends APIClient {
				constructor() {
					super(new URL("https://example.com"));
				}

				async after(_: Request, response: Response) {
					if (response.status === 400) throw new Error("Bad request");
					return response;
				}
			}

			let client = new CustomClient();

			client.on("after", async (_, response) => {
				if (response.status === 400) throw new TypeError("Bad request");
				return response;
			});

			server.resetHandlers(
				http.all("https://example.com/path", () => {
					return HttpResponse.text("Bad request", { status: 400 });
				}),
			);

			expect(client.fetch("/path")).rejects.toThrow(Error);
		});
	});
});
