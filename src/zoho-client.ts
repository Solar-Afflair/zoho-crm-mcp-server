import axios, { AxiosInstance, AxiosError } from "axios";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ZohoClientConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class ZohoClient {
  private config: ZohoClientConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private httpClient: AxiosInstance;

  constructor(config: ZohoClientConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: "https://www.zohoapis.com",
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
  }

  private async refreshAccessToken(): Promise<void> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
    });
    const response = await axios.post<TokenResponse>(
      "https://accounts.zoho.com/oauth/v2/token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  }

  private async ensureToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
    return this.accessToken!;
  }

  private formatError(err: unknown): Error {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data = err.response?.data as Record<string, unknown> | undefined;
      const message = data?.message || data?.error || err.message;
      return new Error(`Zoho API error ${status}: ${JSON.stringify(message)}`);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const token = await this.ensureToken();
    try {
      const response = await this.httpClient.get<T>(path, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
        params,
      });
      return response.data;
    } catch (err) { throw this.formatError(err); }
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const token = await this.ensureToken();
    try {
      const response = await this.httpClient.post<T>(path, body, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      });
      return response.data;
    } catch (err) { throw this.formatError(err); }
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const token = await this.ensureToken();
    try {
      const response = await this.httpClient.put<T>(path, body, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      });
      return response.data;
    } catch (err) { throw this.formatError(err); }
  }

  async delete<T>(path: string): Promise<T> {
    const token = await this.ensureToken();
    try {
      const response = await this.httpClient.delete<T>(path, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      });
      return response.data;
    } catch (err) { throw this.formatError(err); }
  }
}

export function createZohoClient(): ZohoClient {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing env vars: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN");
  }
  return new ZohoClient({ clientId, clientSecret, refreshToken });
}
