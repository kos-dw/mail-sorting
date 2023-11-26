/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomField, JsonDto } from "./types";

const ENV = PropertiesService.getScriptProperties().getProperties();
const ENDPOINT = ENV.JIRA_ENDPOINT;
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Basic ${Utilities.base64Encode(
    `${ENV.JIRA_ACCOUNT}:${ENV.JIRA_TOKEN}`,
  )}`,
};

// Jira softwareのAPI用クラス
export class JiraActions {
  /**
   * 初期化
   * @static
   * @return {CustomField}
   * @memberof JiraActions
   */
  static init(): CustomField {
    // Jiraのカスタムフィールド
    return {
      uniqueId: "customfield_10035",
      threadId: "customfield_10036",
      messageId: "customfield_10037",
      receivedAt: "customfield_10044",
      from: "customfield_10039",
      to: "customfield_10040",
      searchQuery: "customfield_10042",
      link: "customfield_10043",
    };
  }

  /**
   * fieldの取得
   * @return {any[]}
   */
  static getCustomfield(): unknown[] {
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
  static getIssueList(query: string): unknown[] {
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
  static createIssue(json: JsonDto): GoogleAppsScript.URL_Fetch.HTTPResponse {
    // Jiraのカスタムフィールド
    const CUSTOM_FIELD = this.init();

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
