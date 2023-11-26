/* eslint-disable @typescript-eslint/no-explicit-any */
import { customFieldParser } from "./constants";
import { JsonDto } from "./types";

/**
 * Jira APIの認証情報
 * @interface Credentials
 */
interface Credentials {
  endpoint: string;
  account: string;
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
 * Jira softwareのAPI用クラス
 * @export
 * @class JiraActions
 */
export class JiraActions {
  /**
   * 初期化
   * @static
   * @return {() => Fetcher}
   * @memberof JiraActions
   */
  static init(credentials: Credentials): {
    fetcher: Fetcher;
  } {
    /** フェッチャー関数 */
    const fetcher: Fetcher = ({ method, query, payload }) => {
      const headers: GoogleAppsScript.URL_Fetch.HttpHeaders = {
        "Content-Type": "application/json",
        Authorization: `Basic ${Utilities.base64Encode(
          `${credentials.account}:${credentials.token}`,
        )}`,
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
   * fieldの取得
   * @return {any[]}
   */
  static getCustomfield(credentials: Credentials): unknown[] {
    const { fetcher } = this.init(credentials);
    const res = fetcher({ method: "get", query: "field" });
    return JSON.parse(res.getContentText())
      .filter((row: any) => /customfield/i.test(row.id))
      .map((row: any) => ({ [row.id]: row.name }));
  }

  /**
   * issueの取得
   * @param {string} query
   * @return {any[]}
   */
  static getIssueList(credentials: Credentials, query: string): unknown[] {
    const { fetcher } = this.init(credentials);

    const res = fetcher({ method: "get", query });
    return JSON.parse(res.getContentText()).issues.map(
      (row: any) => row.fields,
    );
  }

  /**
   * issueの発行
   * @param {JsonDto} json
   * @return {GoogleAppsScript.URL_Fetch.HTTPResponse}
   */
  static createIssue(
    credentials: Credentials,
    json: JsonDto,
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const { fetcher } = this.init(credentials);

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
        [customFieldParser.uniqueId]: json.uniqueId,
        [customFieldParser.threadId]: json.threadId,
        [customFieldParser.messageId]: json.messageId,
        [customFieldParser.receivedAt]: json.receivedAt,
        [customFieldParser.from]: json.from,
        [customFieldParser.to]: json.to,
        [customFieldParser.searchQuery]: json.searchQuery,
        [customFieldParser.link]: json.link,
      },
    };
    const res = fetcher({
      method: "post",
      query: "issue",
      payload: JSON.stringify(dto),
    });

    return res;
  }

  /**
   * issueListの登録
   * @static
   * @param {Credentials} credentials
   * @param {JsonDto[]} jsonDtoArray
   * @memberof JiraActions
   */
  static register(credentials: Credentials, jsonDtoArray: JsonDto[]) {
    const listOfExistingIssues = this.getIssueList(
      credentials,
      `search?fields=${customFieldParser.uniqueId}`,
    );

    const uidList = listOfExistingIssues.map(
      (row) => row[customFieldParser.uniqueId],
    );

    const issueListForCreate = jsonDtoArray.filter(
      (dto) => !uidList.includes(dto.uniqueId),
    );

    const registerData = [];
    for (const jsonDto of issueListForCreate) {
      const res = this.createIssue(credentials, jsonDto);
      registerData.push(res);
    }

    if (registerData.length) {
      Logger.log(`登録:${registerData.length}件`);
    } else {
      Logger.log("登録無し");
    }
  }
}
