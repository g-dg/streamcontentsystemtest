import { api } from "./api";

export class ConfigClient {
  /** Gets client config from server */
  static async getConfig(): Promise<any> {
    return await api("config", "GET");
  }
}
