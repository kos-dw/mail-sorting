import type { JsonDto, JsonRow } from "./types";

// スプレッドシートの操作用クラス
export class SpreadsheetActions {
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
   * @static
   * @param {string} bookId
   * @param {JsonDto[]} jsonArray
   * @memberof SpreadsheetActions
   */
  static register(bookId: string, jsonArray: JsonDto[]): void {
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
