/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// 初期設定

const ENV = PropertiesService.getScriptProperties().getProperties();
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

// 以下メイン処理 ---------------------------------------------

/**
 * メイン処理
 */
function main() {
  // 初期設定
  const query = "newer_than:1d";
  // const query = `after:${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`;
  const threads = GmailApp.search(query);
  const bookId = BOOK_ID;
  const jsonArray: JsonDto[] = [];

  // スレッド毎の処理
  threads.forEach((thread) => {
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
    const hash = hashMD5(`${date}${messageId}`);
    const searchUrl = "https://mail.google.com/mail/u/0/#search";
    const json: JsonDto = {
      uniqueId: hash,
      from: new_message.getFrom(),
      to: new_message.getTo().replace(/<|>/g, ""),
      subject: new_message.getSubject(),
      body: new_message.getPlainBody().trim().substring(0, 1000).concat("..."),
      threadId: thread.getId(),
      messageId: messageId,
      receivedAt: date,
      searchQuery: `rfc822msgid:${messageId}`,
      // link: new URL(searchUrl, encodeURIComponent(`rfc822msgid:${messageId}`)).toString(),
      link: `${searchUrl}/${encodeURIComponent(`rfc822msgid:${messageId}`)}`,
    };
    // Logger.log(json.body.trim().substring(0, 1000).concat("..."));
    jsonArray.push(json);
  });

  // let index = 0;
  // for (const json of jsonArray) {
  //   if (index > 3) break;

  //   const res = createIssue(json);
  //   Logger.log(res);
  //   index++;
  // }

  exportToSpreadsheet(bookId, jsonArray);
}

// 以下関数宣言 ---------------------------------------------

/**
 * ticketの出力
 *
 * @param {string} bookId
 * @param {JsonDto[]} jsonArray
 */
function exportToSpreadsheet(bookId: string, jsonArray: JsonDto[]) {
  // 初期設定
  const book = SpreadsheetApp.openById(bookId);
  const sheet = book.getActiveSheet();
  const allData = sheet.getDataRange().getValues();
  const uidList = allData.map((row) => row[1]);

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
      .getRange(sheet.getLastRow() + 1, 1, dataList.length, dataList[0].length)
      .setValues(dataList);
    Logger.log(`登録:${dataList.length}件`);
  } else {
    Logger.log("登録無し");
  }
}

/**
 * ハッシュ文字列生成
 *
 * @param {string} [input=""]
 * @return {string}
 */
function hashMD5(input: string = ""): string {
  if (input == "") {
    return "";
  }

  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input);
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

/**
 * fieldの取得
 *
 * @return {any[]}
 */
function getCustomfield(): unknown[] {
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
 *
 * @param {string} query
 * @return {any[]}
 */
function getIssueList(query: string): unknown[] {
  const res = UrlFetchApp.fetch(`${ENDPOINT}/search?${query}`, {
    method: "get",
    headers: HEADERS,
    muteHttpExceptions: true,
  });
  return JSON.parse(res.getContentText()).issues.map((row: any) => row.fields);
}

/**
 * issueの発行
 *
 * @param {JsonDto} json
 * @return {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function createIssue(json: JsonDto): GoogleAppsScript.URL_Fetch.HTTPResponse {
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
