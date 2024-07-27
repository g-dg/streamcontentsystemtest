import { api } from "./api";

export class ConfigClient {
  static async getConfig(): Promise<any> {
    return await api("config", "GET");
  }
}
