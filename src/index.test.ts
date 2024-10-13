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

			async after(response: Response) {
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
});
