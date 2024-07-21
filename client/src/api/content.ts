import { api } from "./api";

export class ContentClient {
  static async listContent(): Promise<Record<string, string>> {
    return await api("content", "GET");
  }

  static async getContent(filename: string): Promise<string> {
    filename = encodeURIComponent(filename);
    return await api(`content/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }
}
