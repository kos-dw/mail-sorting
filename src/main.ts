/* eslint-disable @typescript-eslint/no-unused-vars */
import { GmailActions } from "./GmailActions";
import { NotionActions } from "./NotionActions";
import type { JsonDto } from "./types";

/** -----------------------------------------------------------
 * メイン処理
 * ------------------------------------------------------------ */
function main() {
  const ENV = PropertiesService.getScriptProperties().getProperties();

  const threads = GmailApp.search(ENV.SEARCH_QUERY);

  /**
   * @preserve タスクとして登録するGmail用タスクのfield一覧
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

  /**
   * Notionに登録
   */

  // Notion用環境変数
  const CREDENTIALS_OF_NOTION = {
    endpoint: ENV.NOTION_ENDPOINT,
    database: ENV.NOTION_DATABASE,
    version: ENV.NOTION_VERSION,
    token: ENV.NOTION_TOKEN,
  };
  NotionActions.register(CREDENTIALS_OF_NOTION, jsonDtoArray);

  // /**
  //  * Jira softwearに登録
  //  */
  // // Jira software用環境変数
  // const CREDENTIALS_OF_JIRA = {
  //   endpoint: ENV.JIRA_ENDPOINT,
  //   account: ENV.JIRA_ACCOUNT,
  //   token: ENV.JIRA_TOKEN,
  // };
  // JiraActions.register(CREDENTIALS_OF_JIRA, jsonDtoArray);

  // /**
  //  * Spreadsheetに登録
  //  */
  // SpreadsheetActions.register(ENV.SPREADSHEET_BOOK_ID, jsonDtoArray);
}
