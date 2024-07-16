import { parse } from "https://deno.land/std@0.107.0/encoding/csv.ts";
import Fuse from "fuse.js";

const bankFilePath = Deno.args[0];
console.log(bankFilePath)

const meFilePath = Deno.args[1];
console.log(meFilePath)


// 讀取 CSV 檔案
const bankFileContent = await Deno.readTextFile(bankFilePath);
const meFileContent = await Deno.readTextFile(meFilePath);

// console.log(bankFileContent)

// 解析 CSV 檔案內容
const bankRecords = await parse(bankFileContent, {
  skipFirstRow: true // 跳過第一行，假設第一行是表頭
}) as Array<{ [key: string]: string }>;

console.log(bankRecords);

const meRecords = await parse(meFileContent, {
  skipFirstRow: true // 跳過第一行，假設第一行是表頭
}) as Array<{ [key: string]: string }>;

console.log(meRecords);

// const targetIP = prompt("輸入檔案名稱:", "./README.md");
// console.log(targetIP);
const options = {
  includeScore: true,
  // threshold: 0.7, // 設置閾值，允許較寬鬆的匹配
  keys: ['支出金額']
};

const fuse = new Fuse(meRecords, options);

const csvOutput = bankRecords.map(bankRecord => {
  const fuseResults = fuse.search(bankRecord['金額']);
  if (fuseResults.length > 0) {
    // 獲取最相似的結果
    const bestMatch = fuseResults[0];
    // 進一步比較明細和備註
    const detailFuse = new Fuse([bestMatch.item], { includeScore: true, threshold: 0.7, keys: ['備註'] });
    const detailResults = detailFuse.search(bankRecord['明細']);

    if (detailResults.length > 0) {
      console.log(`最佳匹配:`);
      console.log(`Bank Record: ${bankRecord['明細']} - ${bankRecord['金額']}`);
      console.log(`Me Record: ${bestMatch.item['備註']} - ${bestMatch.item['支出金額']}`);
      console.log(`匹配分數: ${bestMatch.score}`);
      return `"${bestMatch.item['備註']}","${bestMatch.item['支出金額']}"`;
    } else {
      console.log(`未找到明細匹配: ${bankRecord['明細']} - ${bankRecord['金額']}`);
      return `"${bankRecord['明細']}","${bankRecord['金額']}"`;
    }

  } else {
    console.log(`未找到金額匹配: ${bankRecord['明細']} - ${bankRecord['金額']}`);
    return `"${bankRecord['明細']}","${bankRecord['金額']}"`;
  }
}).join('\n');

console.log(csvOutput);
await Deno.writeTextFile('output.csv', csvOutput);




// 搜尋
