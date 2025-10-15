import { getExcelData } from "./updateExcel";
import type { excelProps } from "./type";
import axios from "axios";
import { toast } from "react-toastify";
import formatDateString from "./formatDateString";

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

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

async function overwriteExcelData(newEpi: excelProps[], token: string) {
  const existingData = await getExcelData(token);
  const updatedData = [...newEpi, ...existingData];

  const batchSize = 1000;

  try {
    for (let i = 0; i < updatedData.length; i += batchSize) {
      const batch = updatedData.slice(i, i + batchSize);
      await clearExcelFromRow(i + 4, i + batchSize + 4, token);
      const values = batch.map((row) => {
        const createdAtStr = (() => {
          if (!row.createdAt) return "";

          if (typeof row.createdAt === "number") {
            return formatDateString(
              excelDateToJSDate(row.createdAt).toISOString()
            );
          }

          if (!isNaN(Number(row.createdAt))) {
            return formatDateString(
              excelDateToJSDate(Number(row.createdAt)).toISOString()
            );
          }

          const d = new Date(row.createdAt);
          return isNaN(d.getTime()) ? "" : formatDateString(d.toISOString());
        })();

        const dispDtimeStr = (() => {
          if (!row.dispDtime) return "";

          if (typeof row.dispDtime === "number") {
            return formatDateString(
              excelDateToJSDate(row.dispDtime).toISOString()
            );
          }

          if (!isNaN(Number(row.dispDtime))) {
            return formatDateString(
              excelDateToJSDate(Number(row.dispDtime)).toISOString()
            );
          }

          const d = new Date(row.dispDtime);
          return isNaN(d.getTime()) ? "" : formatDateString(d.toISOString());
        })();

        return [
          row.audioUrl,
          row.episodeNumber,
          row.channelName,
          row.episodeName,
          row.episodeId,
          createdAtStr,
          dispDtimeStr,
          row.episodeType,
          row.language,
          row.likeCnt,
          row.playTime,
          row.thumbnailUrl,
          row.vendorName,
        ];
      });

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
