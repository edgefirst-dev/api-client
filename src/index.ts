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
export class APIClient {
	private beforeListeners = new Set<APIClient.BeforeListenerFunction>();
	private afterListeners = new Set<APIClient.AfterListenerFunction>();

	/** The base URL for all API requests. Must be defined in subclasses. */
	protected readonly baseURL: URL;

	constructor(baseURL: URL) {
		this.baseURL = baseURL;
	}

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

		if (this.beforeListeners.size > 0) {
			for (let listener of this.beforeListeners) {
				request = await listener(request);
			}
		}

		let response = await fetch(request);
		response = await this.after(request, response);

		if (this.afterListeners.size > 0) {
			for (let listener of this.afterListeners) {
				response = await listener(request, response);
			}
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

	public on(event: "before", listener: APIClient.BeforeListenerFunction): this;
	public on(event: "after", listener: APIClient.AfterListenerFunction): this;
	public on(event: "before" | "after", listener: APIClient.ListenerFunction) {
		if (event === "before") {
			this.beforeListeners.add(listener as APIClient.BeforeListenerFunction);
		}

		if (event === "after") {
			this.afterListeners.add(listener as APIClient.AfterListenerFunction);
		}

		return this;
	}

	public off(event: "before", listener: APIClient.BeforeListenerFunction): this;
	public off(event: "after", listener: APIClient.AfterListenerFunction): this;
	public off(event: "before" | "after", listener: APIClient.ListenerFunction) {
		if (event === "before") {
			this.beforeListeners.delete(listener as APIClient.BeforeListenerFunction);
		}

		if (event === "after") {
			this.afterListeners.delete(listener as APIClient.AfterListenerFunction);
		}

		return this;
	}
}

export namespace APIClient {
	export type BeforeListenerFunction = (request: Request) => Promise<Request>;

	export type AfterListenerFunction = (
		request: Request,
		response: Response,
	) => Promise<Response>;

	export type ListenerFunction = BeforeListenerFunction | AfterListenerFunction;
}
