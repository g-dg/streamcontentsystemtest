import { api } from "./api";

export class ContentClient {
  static async listContent(): Promise<Record<string, string>> {
    return await api("content", "GET");
  }

  static async getContent(filename: string): Promise<string> {
    filename = encodeURIComponent(filename.replaceAll(/[^ 0-9A-Za-z-]/g, "_"));
    return await api(`content/${filename}`, "GET", undefined, {
      returnType: "text",
    });
  }
}
