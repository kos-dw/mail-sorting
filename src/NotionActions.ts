/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotionDatabasePropertyParser as parser } from "./constants";
import { JsonDto, RecordListTypeOfNotion } from "./types";

/**
 * Notion APIの認証情報
 * @interface Credentials
 */
interface Credentials {
  endpoint: string;
  database: string;
  version: string;
  token: string;
}

// フェッチャー関数の型定義
type Fetcher = ({
  method,
  query,
  payload,
}: {
  method: GoogleAppsScript.URL_Fetch.HttpMethod;
  query: string;
  payload?: string;
}) => GoogleAppsScript.URL_Fetch.HTTPResponse;

/**
 * NotionのAPI用クラス
 * @export
 * @class NotionActions
 */
export class NotionActions {
  /**
   * 初期化
   * @static
   * @return {() => Fetcher}
   */
  static init(credentials: Credentials): {
    fetcher: Fetcher;
  } {
    /** フェッチャー関数 */
    const fetcher: Fetcher = ({ method, query, payload }) => {
      const headers: GoogleAppsScript.URL_Fetch.HttpHeaders = {
        "Content-Type": "application/json",
        "Notion-Version": credentials.version,
        Authorization: `Bearer ${credentials.token}`,
      };
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: method,
        headers: headers,
        muteHttpExceptions: true,
      };
      if (method === "post" && payload) {
        options.payload = payload;
      }

      return UrlFetchApp.fetch(`${credentials.endpoint}/${query}`, options);
    };

    return { fetcher };
  }

  /**
   * DatabaseのRecordの取得
   * @param {string} query
   * @return {any[]}
   */
  static getRecordList(
    credentials: Credentials,
    query: string,
  ): RecordListTypeOfNotion {
    const { fetcher } = this.init(credentials);

    const res = fetcher({ method: "post", query });
    return JSON.parse(res.getContentText());
  }

  /**
   * recordの発行
   * @param {JsonDto} json
   * @return {GoogleAppsScript.URL_Fetch.HTTPResponse}
   */
  static createRecord(
    credentials: Credentials,
    json: JsonDto,
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const { fetcher } = this.init(credentials);

    const dto = {
      parent: {
        database_id: `${credentials.database}`,
      },
      properties: {
        [parser.title]: {
          title: [
            {
              text: {
                content: json.subject,
              },
            },
          ],
        },
        [parser.uniqueId]: {
          rich_text: [
            {
              text: {
                content: json.uniqueId,
              },
            },
          ],
        },
        [parser.taskType]: {
          select: {
            name: "mail",
          },
        },
        [parser.due_date]: {
          date: {
            start: (() => {
              // デフォルトの動作として3日後の日付を返す
              const now = new Date();
              now.setDate(now.getDate() + 3);
              return Utilities.formatDate(now, "Asia/Tokyo", "yyyy-MM-dd");
            })(),
          },
        },
        [parser.url]: {
          url: json.link,
        },
      },
      children: [
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[FROM] | ${json.from}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[TO] | ${json.to}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[RECEIVED_AT] | ${json.receivedAt}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[SERCH_QUERY] | ${json.searchQuery}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[MESSAGE_ID] | ${json.messageId}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `[THREAD_ID] | ${json.threadId}`,
                },
                annotations: {
                  bold: true,
                  code: true,
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "divider",
          divider: {},
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: json.body,
                },
              },
            ],
          },
        },
      ],
    };

    const res = fetcher({
      method: "post",
      query: "pages",
      payload: JSON.stringify(dto),
    });

    return res;
  }

  /**
   * recordのListの登録
   * @static
   * @param {Credentials} credentials
   * @param {JsonDto[]} jsonDtoArray
   */
  static register(credentials: Credentials, jsonDtoArray: JsonDto[]) {
    // 登録済みのtask listを取得
    const listOfExistingTask = this.getRecordList(
      credentials,
      `databases/${credentials.database}/query`,
    ).results;

    const uidList = listOfExistingTask.map((row) => {
      return row ? row.properties.uid.formula.string : "";
    });

    // ユニークIDを比較して登録済みレコードを除外
    const recordListForCreate = jsonDtoArray.filter((dto) => {
      return !uidList.includes(dto.uniqueId);
    });

    const registerData = [];
    for (const jsonDto of recordListForCreate) {
      const res = this.createRecord(credentials, jsonDto);
      registerData.push(res);
    }

    if (registerData.length) {
      Logger.log(`登録:${registerData.length}件`);
    } else {
      Logger.log("登録無し");
    }
  }
}
