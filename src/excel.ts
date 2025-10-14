// excel.ts

import type { excelProps, ExcelRow } from "./type";

export async function getExcelData(
  accessToken: string,
  filePath: string,
  sheetName: string
): Promise<ExcelRow[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${filePath}:/workbook/worksheets/${sheetName}/usedRange`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.values as ExcelRow[];
}

export function filterNewRows(existingData: ExcelRow[], newData: excelProps[]): ExcelRow[] {
  const existingIds = existingData.map(row => row[7]); // 에피소드ID 기준
  return newData
    .filter(item => !existingIds.includes(item.episodeId))
    .map(item => [
      item.week,
      item.curationSite,
      item.curationName,
      item.tag,
      item.episodeNumber,
      item.channelName,
      item.episodeName,
      item.episodeId,
      item.startDate,
      item.endDate,
      item.status,
      item.manager,
      item.note,
    ]);
}

// excel.ts
export async function addRowsToExcel(
  accessToken: string,
  filePath: string,
  sheetName: string,
  newRows: ExcelRow[]
): Promise<void> {
  await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${filePath}:/workbook/worksheets/${sheetName}/tables/Table1/rows/add`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: newRows }),
    }
  );
}

