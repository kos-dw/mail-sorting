interface NotifyOnLine {
  endpoint: string;
  token: string;
  targetUser: string;
  msg: string;
}

// 汎用クラス
export class Utils {
  /**
   * ハッシュ文字列生成
   * @static
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

  /**
   * LINEのMessage APIを利用して通知を送信する
   *
   * @static
   * @param {NotifyOnLine} props
   * @memberof Utils
   */
  static notifyOnLine(props: NotifyOnLine) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.token}`,
    };
    const data = {
      to: props.targetUser,
      messages: [
        {
          type: "text",
          text: props.msg,
        },
      ],
    };
    UrlFetchApp.fetch(props.endpoint, {
      method: "post",
      headers: headers,
      payload: JSON.stringify(data),
    });
  }
}
