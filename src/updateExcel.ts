import axios from "axios";
import type { usingDataProps } from "./type";
import formatDateString from "./formatDateString";
import { getGraphToken } from "./auth";

const fileId = import.meta.env.VITE_FILE_ID;
const sheetName = import.meta.env.VITE_WORKSHEET_NAME;

export async function getExcelData(token: string): Promise<usingDataProps[]> {
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const totalRows = 2000;
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalRows / batchSize);

    const allRows: (string | number)[][] = [];

    for (let i = 0; i < totalBatches; i++) {
      const startRow = i * batchSize + 4;
      const endRow = startRow + batchSize - 1;
      const rangeAddress = `A${startRow}:K${endRow}`;

      const res = await axios.get(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeAddress}')?valuesOnly=true`,
        { headers }
      );

      const values = res.data.values as (string | number)[][];
      if (values && values.length > 0) allRows.push(...values);
    }

    return allRows.map((row) => ({
      episodeId: Number(row[0] ?? 0),
      usageYn: String(row[1] ?? ""),
      channelName: String(row[2] ?? ""),
      episodeName: String(row[3] ?? ""),
      dispDtime: String(row[4] ?? ""),
      createdAt: String(row[5] ?? ""),
      playTime: Number(row[6] ?? 0),
      likeCnt: Number(row[7] ?? 0),
      listenCnt: Number(row[8] ?? 0),
      tags: String(row[9] ?? ""),
      tagsAdded: String(row[10] ?? ""),
    }));
  } catch (err) {
    console.error("엑셀 조회 실패:", err);
    return [];
  }
}

export async function addMissingRows(allData: usingDataProps[], token: string) {
  const existingData = await getExcelData(token);

  const missingRows = allData.filter(
    (item) => !existingData.some((row) => row.episodeId === item.episodeId)
  );

  if (missingRows.length === 0) {
    console.log("추가할 누락 데이터 없음");
    return;
  }

  const batchSize = 1000;

  for (let i = 0; i < missingRows.length; i += batchSize) {
  const batch = missingRows.slice(i, i + batchSize);
  const values = batch.map((row) => [
    row.episodeId,
    row.usageYn,
    row.channelName,
    row.episodeName,
    formatDateString(row.dispDtime),
    formatDateString(row.createdAt),
    row.playTime,
    row.likeCnt,
    row.listenCnt,
    row.tags,
    row.tagsAdded,
  ]);

  const startRow = existingData.length + i + 4;
  const endRow = startRow + batch.length - 1;
  const rangeAddress = `A${startRow}:K${endRow}`;

  try {
    await axios.patch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeAddress}')`,
      { values },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const refreshedToken = await getGraphToken();
      if (!refreshedToken) throw new Error("토큰 재발급 실패, 엑셀 업데이트 중단");

      token = refreshedToken;

      await axios.patch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeAddress}')`,
        { values },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
    } else {
      throw err;
    }
  }
}

}
