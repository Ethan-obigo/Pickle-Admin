import { getExcelData, getUsedRange } from './updateExcel';
import type { usingChannelProps, usingDataProps } from '../type';
import axios from 'axios';
import { toast } from 'react-toastify';
import formatDateString from './formatDateString';

const fileId = import.meta.env.VITE_FILE_ID;
const sheetName = localStorage.getItem('sheetName');

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearExcelFromRow(
  startRow: number,
  endRow: number,
  token: string,
  category: 'episode' | 'channel'
) {
  let lastLine = 'K';
  if (category === 'episode') lastLine = 'L';

  try {
    await axios.post(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='B${startRow}:${lastLine}${endRow}')/clear`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await delay(500);
  } catch (err) {
    console.error('엑셀 삭제 실패:', err);
  }
}

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

function excelDateTime(date: string | number) {
  if (!date) return '';

  if (typeof date === 'number') {
    return formatDateString(excelDateToJSDate(date).toISOString());
  }

  if (!isNaN(Number(date))) {
    return formatDateString(excelDateToJSDate(Number(date)).toISOString());
  }

  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : formatDateString(d.toISOString());
}

async function overwriteExcelData(
  newData: usingChannelProps[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'channel'
): Promise<void>;
async function overwriteExcelData(
  newData: usingDataProps[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'episode'
): Promise<void>;
async function overwriteExcelData(
  newData: (usingDataProps | usingChannelProps)[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'episode' | 'channel'
): Promise<void>;

async function overwriteExcelData(
  newData: (usingDataProps | usingChannelProps)[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'episode' | 'channel'
) {
  const existingData = await getUsedRange(token);
  const totalRowsToClear = Math.max(newData.length + 3, existingData!);
  await clearExcelFromRow(4, totalRowsToClear, token, category);
  const batchSize = 10000;

  try {
    for (let i = 0; i < newData.length; i += batchSize) {
      setProgress(`${Math.round((i / newData.length) * 100)}%`);
      const batch = newData.slice(i, i + batchSize);
      let values;
      let rangeAddress;

      if (category === 'episode') {
        values = (batch as usingDataProps[]).map((row) => {
          const createdAtStr = excelDateTime(row.createdAt);
          const dispDtimeStr = excelDateTime(row.dispDtime);

          return [
            row.episodeId,
            row.usageYn,
            row.channelName,
            row.episodeName,
            dispDtimeStr,
            createdAtStr,
            row.playTime,
            row.likeCnt,
            row.listenCnt,
            row.tags,
            row.tagsAdded,
          ];
        });
        const startRow = i + 4;
        const endRow = startRow + batch.length - 1;
        rangeAddress = `B${startRow}:L${endRow}`;
      } else {
        values = (batch as usingChannelProps[]).map((row) => {
          const createdAtStr = excelDateTime(row.createdAt);
          const lastUpdateDtimeStr = excelDateTime(row.lastUpdateDtime);

          return [
            row.channelId,
            row.usageYn,
            row.channelName,
            row.vendorName,
            row.categoryName,
            lastUpdateDtimeStr,
            row.channelTypeName,
            row.likeCnt,
            row.listenCnt,
            createdAtStr,
          ];
        });
        const startRow = i + 4;
        const endRow = startRow + batch.length - 1;
        rangeAddress = `B${startRow}:K${endRow}`;
      }

      await axios.patch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeAddress}')`,
        { values },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    toast.success('엑셀 동기화에 성공했습니다!');
  } catch (err) {
    console.error('엑셀 동기화 실패:', err);
    toast.error('엑셀 동기화에 실패했습니다.');
  }
}

async function syncNewDataToExcel(
  newData: usingChannelProps[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'channel'
): Promise<void>;
async function syncNewDataToExcel(
  newData: usingDataProps[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'episode'
): Promise<void>;

async function syncNewDataToExcel(
  newData: (usingDataProps | usingChannelProps)[],
  token: string,
  setProgress: (progress: string) => void,
  category: 'episode' | 'channel'
) {
  const excelData = await getExcelData(token, category);

  const excelIds = new Set(
    excelData.map((item) => (item as any).episodeId ?? (item as any).channelId)
  );
  const filteredNew = newData.filter(
    (item) => !excelIds.has((item as any).episodeId ?? (item as any).channelId)
  );

  const updatedData = [...filteredNew, ...excelData];

  await overwriteExcelData(updatedData, token, setProgress, category);
}

export default syncNewDataToExcel;

export async function syncNewDatatoExcel3(
  newData: usingDataProps[],
  token: string,
  tableName: string
) {
  let values = newData.map((row) => {
    const createdAtStr = excelDateTime(row.createdAt);
    const dispDtimeStr = excelDateTime(row.dispDtime);

    return [
      row.episodeId,
      row.usageYn,
      row.channelName,
      row.episodeName,
      dispDtimeStr,
      createdAtStr,
      row.playTime,
      row.likeCnt,
      row.listenCnt,
      row.tags,
      row.tagsAdded,
      '',
    ];
  });
  
  const body = {
    values: values,
    index: 0,
  };

  try {
    await axios.post(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${tableName}/rows`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    toast.success('엑셀 동기화에 성공했습니다!');
  } catch (err) {
    console.error('엑셀 동기화 실패:', err);
    toast.error('엑셀 동기화에 실패했습니다.');
  }
}
