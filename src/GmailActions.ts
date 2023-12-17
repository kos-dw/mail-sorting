import type { JsonDto } from "./types";
import { Utils } from "./Utils";

// Gmailの操作用クラス
export class GmailActions {
  /**
   * 初期化
   * @static
   * @param {GoogleAppsScript.Gmail.GmailThread[]} threads
   * @return {searchUrl: string, jsonArray: JsonDto[]}
   * @memberof GmailActions
   */
  static init(threads: GoogleAppsScript.Gmail.GmailThread[]): {
    searchUrl: string;
    jsonArray: JsonDto[];
  } {
    Logger.log("GmailActions initialized");
    Logger.log("Length of threads: " + threads.length);
    const searchUrl = "https://mail.google.com/mail/u/0/#search";
    const jsonArray: JsonDto[] = [];

    return { searchUrl, jsonArray };
  }

  /**
   * スレッドの取得
   * @static
   * @param {GoogleAppsScript.Gmail.GmailThread[]} threads
   * @return {JsonDto[]}
   * @memberof GmailActions
   */
  static getNewDto(threads: GoogleAppsScript.Gmail.GmailThread[]): JsonDto[] {
    const { searchUrl, jsonArray } = this.init(threads);

    // スレッド毎の処理
    threads.forEach((thread) => {
      // 初期設定
      const date = Utilities.formatDate(
        thread.getLastMessageDate(),
        "JST",
        "yyyy-MM-dd HH:mm:ss",
      );
      const messages = thread.getMessages();
      const new_message = messages[messages.length - 1];
      const rawContent = new_message.getRawContent();
      const messageIdMatch = new RegExp(/^message-id: <(.*?)>$/, "mi").exec(
        rawContent,
      );
      const messageId = messageIdMatch ? messageIdMatch[1].trim() : "";

      // JSONの作成
      const json: JsonDto = {
        uniqueId: Utils.hashMD5(`${date}${messageId}`),
        from: new_message.getFrom(),
        to: new_message.getTo().replace(/<|>/g, ""),
        subject: new_message.getSubject(),
        body: new_message
          .getPlainBody()
          .trim()
          .substring(0, 1000)
          .concat("..."),
        threadId: thread.getId(),
        messageId: messageId,
        receivedAt: date,
        searchQuery: `rfc822msgid:${messageId}`,
        link: `${searchUrl}/${encodeURIComponent(`rfc822msgid:${messageId}`)}`,
      };

      jsonArray.push(json);
    });

    return jsonArray;
  }
}
