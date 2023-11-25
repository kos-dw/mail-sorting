/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Gmailのメール情報
interface JsonDto {
  uniqueId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  threadId: string;
  messageId: string;
  receivedAt: string;
  searchQuery: string;
  link: string;
}

// スプレッドシートの行情報
type JsonRow = [
  uniqueId: string,
  from: string,
  to: string,
  subject: string,
  body: string,
  threadId: string,
  messageId: string,
  receivedAt: string,
  searchQuery: string,
  link: string,
];

/**
 * 初期設定
 */
const ENV = PropertiesService.getScriptProperties().getProperties();
const QUERY = ENV.SEARCH_QUERY;
const BOOK_ID = ENV.SPREADSHEET_BOOK_ID;
const ENDPOINT = ENV.JIRA_ENDPOINT;
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Basic ${Utilities.base64Encode(
    `${ENV.JIRA_ACCOUNT}:${ENV.JIRA_TOKEN}`,
  )}`,
};

// Jiraのカスタムフィールド
const CUSTOM_FIELD = {
  uniqueId: "customfield_10035",
  threadId: "customfield_10036",
  messageId: "customfield_10037",
  receivedAt: "customfield_10044",
  from: "customfield_10039",
  to: "customfield_10040",
  searchQuery: "customfield_10042",
  link: "customfield_10043",
};

// -----------------------------------------------------------
// 以下メイン処理
// -----------------------------------------------------------

function main() {
  // 初期設定
  const threads = GmailApp.search(QUERY);

  /**
   * タスクとして登録するデータ
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

  /**
   * タスクとして登録するデータのリスト
   * @type {jsonDto[]}
   */
  const jsonDto: JsonDto[] = GmailActions.getNewDto(threads);

  SpreadsheetActions.export(BOOK_ID, jsonDto);
}

// -----------------------------------------------------------
// 以下サブ関数
// -----------------------------------------------------------

// Gmailの操作用クラス
class GmailActions {
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
      const new_message = thread.getMessages()[0];
      const rawContent = new_message.getRawContent();
      const messageIdMatch = new RegExp(/^message-id: <(.*?)>$/, "mi").exec(
        rawContent,
      );
      const messageId = messageIdMatch ? messageIdMatch[1].trim() : "";

      // JSONの作成
      const json: JsonDto = {
        uniqueId: utls.hashMD5(`${date}${messageId}`),
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

// スプレッドシートの操作用クラス
class SpreadsheetActions {
  /**
   * 初期化
   * @static
   * @param {string} bookId
   * @return { sheet: GoogleAppsScript.Spreadsheet.Sheet; allData: JsonRow[]; }
   * @memberof SpreadsheetActions
   */
  static init(bookId: string): {
    sheet: GoogleAppsScript.Spreadsheet.Sheet;
    allData: JsonRow[];
  } {
    const sheet = SpreadsheetApp.openById(bookId).getActiveSheet();
    const allData = sheet.getDataRange().getValues() as JsonRow[];
    Logger.log("SpreadsheetActions initialized");
    Logger.log("Length of Current sheet rows: " + allData.length);

    return { sheet, allData };
  }

  /**
   * タスクの出力
   * @static*
   * @param {string} bookId
   * @param {JsonDto[]} jsonArray
   * @memberof SpreadsheetActions
   */
  static export(bookId: string, jsonArray: JsonDto[]): void {
    // 初期設定
    const { sheet, allData } = this.init(bookId);
    const uidList = allData.map((row) => row[0]);
    const dataList: JsonRow[] = [];

    for (const json of jsonArray) {
      if (uidList.includes(json.uniqueId)) {
        continue;
      }

      dataList.push([
        json.uniqueId,
        json.from,
        json.to,
        json.subject,
        json.body,
        json.threadId,
        json.messageId,
        json.receivedAt,
        json.searchQuery,
        json.link,
      ]);
    }

    if (dataList.length) {
      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          dataList.length,
          dataList[0].length,
        )
        .setValues(dataList);
      Logger.log(`登録:${dataList.length}件`);
    } else {
      Logger.log("登録無し");
    }
  }
}

// Jira softwareのAPI用クラス
class Jira {
  /**
   * fieldの取得
   * @return {any[]}
   */
  getCustomfield(): unknown[] {
    const res = UrlFetchApp.fetch(`${ENDPOINT}/field`, {
      method: "get",
      headers: HEADERS,
      muteHttpExceptions: true,
    });
    return JSON.parse(res.getContentText())
      .filter((row: any) => /customfield/i.test(row.id))
      .map((row: any) => ({ [row.id]: row.name }));
  }

  /**
   * issueの取得
   * @param {string} query
   * @return {any[]}
   */
  getIssueList(query: string): unknown[] {
    const res = UrlFetchApp.fetch(`${ENDPOINT}/search?${query}`, {
      method: "get",
      headers: HEADERS,
      muteHttpExceptions: true,
    });
    return JSON.parse(res.getContentText()).issues.map(
      (row: any) => row.fields,
    );
  }

  /**
   * issueの発行
   * @param {JsonDto} json
   * @return {GoogleAppsScript.URL_Fetch.HTTPResponse}
   */
  createIssue(json: JsonDto): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const dto = {
      fields: {
        project: {
          key: "MAILTASK",
        },
        issuetype: {
          name: "Task",
        },
        summary: json.subject,
        description: json.body,
        [CUSTOM_FIELD.uniqueId]: json.uniqueId,
        [CUSTOM_FIELD.threadId]: json.threadId,
        [CUSTOM_FIELD.messageId]: json.messageId,
        [CUSTOM_FIELD.receivedAt]: json.receivedAt,
        [CUSTOM_FIELD.from]: json.from,
        [CUSTOM_FIELD.to]: json.to,
        [CUSTOM_FIELD.searchQuery]: json.searchQuery,
        [CUSTOM_FIELD.link]: json.link,
      },
    };
    const res = UrlFetchApp.fetch(`${ENDPOINT}/issue`, {
      method: "post",
      headers: HEADERS,
      payload: JSON.stringify(dto),
      muteHttpExceptions: true,
    });

    return res;
  }
}

// 汎用クラス
class utls {
  /**
   * ハッシュ文字列生成
   *
   * @param {string} [input=""]
   * @return {string}
   */
  static hashMD5(input: string = ""): string {
    if (input === "") {
      return "";
    }

    const rawHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      input,
    );
    let txtHash = "";
    for (let i = 0; i < rawHash.length; i++) {
      let hashVal = rawHash[i];
      if (hashVal < 0) {
        hashVal += 256;
      }
      if (hashVal.toString(16).length == 1) {
        txtHash += "0";
      }
      txtHash += hashVal.toString(16);
    }
    return txtHash.toUpperCase();
  }
}
