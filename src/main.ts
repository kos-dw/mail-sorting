/* eslint-disable @typescript-eslint/no-unused-vars */
import { GmailActions } from "./GmailActions";
import { JiraActions } from "./JiraActions";
import type { JsonDto } from "./types";

/** -----------------------------------------------------------
 * メイン処理
 * ------------------------------------------------------------ */
function main() {
  const ENV = PropertiesService.getScriptProperties().getProperties();
  const CREDENTIALS = {
    endpoint: ENV.JIRA_ENDPOINT,
    account: ENV.JIRA_ACCOUNT,
    token: ENV.JIRA_TOKEN,
  };
  const threads = GmailApp.search(ENV.SEARCH_QUERY);

  /**
   * @preserve タスクとして登録するデータのチャンク
   * @typedef jsonDto
   * @property {string} uniqueId - 一意のハッシュ値
   * @property {string} from - 送信元
   * @property {string} to - 送信先
   * @property {string} subject - 件名
   * @property {string} body - 本文
   * @property {string} threadId - スレッドID
   * @property {string} messageId - メッセージID
   * @property {string} receivedAt - 受信日時
   * @property {string} searchQuery - 検索クエリ
   * @property {string} link - メールのリンク
   */
  const jsonDtoArray: JsonDto[] = GmailActions.getNewDto(threads);

  // Jira softwearに登録
  JiraActions.register(CREDENTIALS, jsonDtoArray);

  // Spreadsheetに登録
  // SpreadsheetActions.register(ENV.SPREADSHEET_BOOK_ID, jsonDtoArray);
}
