/**
 * The `APIClient` class provides a basic HTTP client for making API requests.
 * It includes methods for making `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`
 * requests.
 *
 * Subclasses should define the `baseURL` to specify the root URL for all
 * requests.
 *
 * The class allows for customization of the request and response through the `before` and `after` hooks, which can be overridden in subclasses to modify
 * behavior before sending a request or after receiving a response.
 *
 * @example
 * class MyAPIClient extends APIClient {
 *   readonly baseURL = new URL("https://api.example.com/");
 *
 *   async before(request: Request) {
 *     const token = await fetchToken();
 *     request.headers.set('Authorization', `Bearer ${token}`);
 *     return request;
 *   }
 * }
 */
export class APIClient implements APIClient.Type {
	/** The base URL for all API requests. Must be defined in subclasses. */
	protected readonly baseURL: URL;

	constructor(baseURL: URL) {
		this.baseURL = baseURL;
	}

	public interceptors = {
		before: new Interceptor<APIClient.BeforeListenerFunction>(),
		after: new Interceptor<APIClient.AfterListenerFunction>(),
	};

	/**
	 * This method is called before the request is sent.
	 * It can be used to modify the request before it is sent (e.g., adding
	 * headers).
	 *
	 * @param request - The request object that will be sent.
	 * @returns A promise that resolves to the (possibly modified) request.
	 */
	protected async before(request: Request) {
		return request;
	}

	/**
	 * This method is called after the response is received.
	 * It can be used to process or inspect the response before returning it.
	 *
	 * @param request - The request object that was sent
	 * @param response - The response object that was received.
	 * @returns A promise that resolves to the (possibly processed) response.
	 */
	protected async after(request: Request, response: Response) {
		return response;
	}

	/**
	 * Sends a fetch request to the specified path, using the provided
	 * `RequestInit` options.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options.
	 * @returns A promise that resolves to the response from the request.
	 */
	async fetch(path: string, init?: RequestInit) {
		let url = new URL(path, this.baseURL);

		let request = new Request(url.toString(), init);
		request = await this.before(request);
		for (let listener of this.interceptors.before.listeners) {
			request = await listener(request);
		}

		let response = await fetch(request);
		response = await this.after(request, response);
		for (let listener of this.interceptors.after.listeners) {
			response = await listener(request, response);
		}

		return response;
	}

	/**
	 * Sends a `GET` request to the specified path.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options, excluding the HTTP method.
	 * @returns A promise that resolves to the response from the request.
	 */
	get(path: string, init?: Omit<RequestInit, "method">) {
		return this.fetch(path, { ...init, method: "GET" });
	}

	/**
	 * Sends a `POST` request to the specified path.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options, excluding the HTTP method.
	 * @returns A promise that resolves to the response from the request.
	 */
	post(path: string, init?: Omit<RequestInit, "method">) {
		return this.fetch(path, { ...init, method: "POST" });
	}

	/**
	 * Sends a `PUT` request to the specified path.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options, excluding the HTTP method.
	 * @returns A promise that resolves to the response from the request.
	 */
	put(path: string, init?: Omit<RequestInit, "method">) {
		return this.fetch(path, { ...init, method: "PUT" });
	}

	/**
	 * Sends a `PATCH` request to the specified path.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options, excluding the HTTP method.
	 * @returns A promise that resolves to the response from the request.
	 */
	patch(path: string, init?: Omit<RequestInit, "method">) {
		return this.fetch(path, { ...init, method: "PATCH" });
	}

	/**
	 * Sends a `DELETE` request to the specified path.
	 *
	 * @param path - The path to send the request to, relative to `baseURL`.
	 * @param init - Optional request options, excluding the HTTP method.
	 * @returns A promise that resolves to the response from the request.
	 */
	delete(path: string, init?: Omit<RequestInit, "method">) {
		return this.fetch(path, { ...init, method: "DELETE" });
	}
}

// biome-ignore lint/complexity/noBannedTypes: I need to use `Function` here
class Interceptor<Listener extends Function> {
	#listeners = new Set<Listener>();

	public on(event: Listener) {
		this.#listeners.add(event);
	}

	public off(event: Listener) {
		this.#listeners.delete(event);
	}

	get listeners() {
		return Array.from(this.#listeners);
	}
}

export namespace APIClient {
	export type BeforeListenerFunction = (request: Request) => Promise<Request>;

	export type AfterListenerFunction = (
		request: Request,
		response: Response,
	) => Promise<Response>;

	export type ListenerFunction = BeforeListenerFunction | AfterListenerFunction;

	export interface Type {
		interceptors: {
			before: Interceptor<BeforeListenerFunction>;
			after: Interceptor<AfterListenerFunction>;
		};

		fetch(path: string, init?: RequestInit): Promise<Response>;
		get(path: string, init?: Omit<RequestInit, "method">): Promise<Response>;
		post(path: string, init?: Omit<RequestInit, "method">): Promise<Response>;
		put(path: string, init?: Omit<RequestInit, "method">): Promise<Response>;
		patch(path: string, init?: Omit<RequestInit, "method">): Promise<Response>;
		delete(path: string, init?: Omit<RequestInit, "method">): Promise<Response>;
	}
}
