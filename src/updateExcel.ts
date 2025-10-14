import axios from "axios";
import type { excelProps } from "./type";

const fileId = import.meta.env.VITE_FILE_ID;
const sheetName = import.meta.env.VITE_WORKSHEET_NAME;

export async function getExcelData(token: string): Promise<excelProps[]> {
  try {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/usedRange(valuesOnly=true)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const values: any[][] = response.data.values || [];
    return values.map((row) => ({
      week: row[0],
      curationSite: row[1],
      curationName: row[2],
      tag: row[3],
      episodeNumber: row[4],
      channelName: row[5],
      episodeName: row[6],
      episodeId: row[7],
      startDate: row[8],
      endDate: row[9],
      status: row[10],
      manager: row[11],
      note: row[12],
    }));
  } catch (err) {
    console.error("엑셀 조회 실패:", err);
    return [];
  }
}

export async function addMissingRows(allData: excelProps[], token: string) {
  const existingData = await getExcelData(token);

  const missingRows = allData.filter(
    (item) => !existingData.some((row) => row.episodeId === item.episodeId)
  );

  if (missingRows.length === 0) {
    console.log("추가할 누락 데이터 없음");
    return;
  }

  const batchSize = 1000;

  try {
    for (let i = 0; i < missingRows.length; i += batchSize) {
      const batch = missingRows.slice(i, i + batchSize);
      const values = batch.map((row) => [
        row.week,
        row.curationSite,
        row.curationName,
        row.tag,
        row.episodeNumber,
        row.channelName,
        row.episodeName,
        row.episodeId,
        row.startDate,
        row.endDate,
        row.status,
        row.manager,
        row.note,
      ]);

      const startRow = existingData.length + i + 1;
      const endRow = startRow + batch.length - 1;
      const rangeAddress = `A${startRow}:M${endRow}`;

      await axios.patch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeAddress}')`,
        { values },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`배치 ${i / batchSize + 1}: ${batch.length}행 추가 완료`);
    }

    console.log(`총 누락 데이터 ${missingRows.length}행 추가 완료`);
  } catch (err) {
    console.error("엑셀 업데이트 실패:", err);
  }
}
