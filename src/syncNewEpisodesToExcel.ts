import { getExcelData } from "./updateExcel";
import type { excelProps } from "./type";
import formatDateString from "./formatDateString";
import axios from "axios";
import { toast } from "react-toastify";

const fileId = import.meta.env.VITE_FILE_ID;
const sheetName = import.meta.env.VITE_WORKSHEET_NAME;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearExcelFromRow(
  startRow: number,
  endRow: number,
  token: string
) {
  try {
    await axios.post(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A${startRow}:M${endRow}')/clear`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await delay(500); 
  } catch (err) {
    console.error("엑셀 삭제 실패:", err);
  }
}

async function overwriteExcelData(newEpi: excelProps[], token: string) {
  const existingData = await getExcelData(token);
  const updatedData = [...newEpi, ...existingData];

  const batchSize = 1000;

  try {
    for (let i = 0; i < updatedData.length; i += batchSize) {
      const batch = updatedData.slice(i, i + batchSize);
      await clearExcelFromRow(i + 4, i + batchSize + 4, token);
      const values = batch.map((row) => [
        row.audioUrl,
        row.episodeNumber,
        row.channelName,
        row.episodeName,
        row.episodeId,
        formatDateString(row.createdAt),
        formatDateString(row.dispDtime),
        row.episodeType,
        row.language,
        row.likeCnt,
        row.playTime,
        row.thumbnailUrl,
        row.vendorName,
      ]);

      const startRow = i + 4;
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
    }

    toast.success("엑셀 동기화에 성공했습니다!");
  } catch (err) {
    console.error("엑셀 동기화 실패:", err);
    toast.error("엑셀 동기화에 실패했습니다.");
  }
}

async function syncNewEpisodesToExcel(newEpi: excelProps[], token: string) {
  const excelData = await getExcelData(token);

  const excelIds = new Set(excelData.map((epi) => epi.episodeId));
  const filteredNew = newEpi.filter((epi) => !excelIds.has(epi.episodeId));

  const updatedData = [...filteredNew, ...excelData];

  await overwriteExcelData(updatedData, token);
}

export default syncNewEpisodesToExcel;
