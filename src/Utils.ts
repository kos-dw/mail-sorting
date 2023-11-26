// 汎用クラス
export class Utils {
  /**
   * ハッシュ文字列生成
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
