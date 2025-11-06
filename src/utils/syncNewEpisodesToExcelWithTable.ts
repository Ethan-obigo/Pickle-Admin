import type { usingDataProps } from '../type';
import axios from 'axios';
import { toast } from 'react-toastify';
import formatDateString from './formatDateString';

const fileId = import.meta.env.VITE_FILE_ID;

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

// 테이블 ID를 가져오는 함수
async function getTableId(
  token: string,
  tableName?: string
): Promise<string | null> {
  const sheetName = localStorage.getItem('sheetName');
  if (!sheetName) return null;

  try {
    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/tables`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const tables = res.data.value as Array<{ id: string; name: string }>;
    if (!tables || tables.length === 0) return null;

    // 테이블 이름이 지정되어 있으면 해당 테이블 찾기
    if (tableName) {
      const table = tables.find((t) => t.name === tableName);
      return table?.id || tables[0].id;
    }

    // 테이블 이름이 없으면 첫 번째 테이블 사용
    return tables[0].id;
  } catch (err) {
    console.error('테이블 ID 조회 실패:', err);
    return null;
  }
}

// 기존 테이블에서 ID 목록만 빠르게 가져오는 함수 (최대 1000행만 확인)
async function getExistingTableIds(token: string): Promise<Set<number>> {
  const sheetName = localStorage.getItem('sheetName');
  const tableId = await getTableId(token);
  if (!sheetName || !tableId) return new Set();

  try {
    // 테이블의 데이터 범위 가져오기 (헤더 제외)
    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${tableId}/dataBodyRange`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const rangeAddress = res.data.address as string;
    if (!rangeAddress) return new Set();

    // 범위 주소에서 시트 이름 제거하고 범위만 추출
    // 예: "Sheet1!B2:L1000" -> "B2:L1000"
    const rangeOnly = rangeAddress.includes('!')
      ? rangeAddress.split('!')[1]
      : rangeAddress;

    // 첫 번째 열(B열)의 범위만 추출
    // 예: "B2:L1000" -> "B2"
    const startMatch = rangeOnly.match(/B(\d+)/);
    if (!startMatch) return new Set();

    const startRow = parseInt(startMatch[1]);
    const endRow = Math.min(startRow + 1000, startRow + 999); // 최대 1000행
    const idRange = `B${startRow}:B${endRow}`;

    // ID 범위에서 값 가져오기
    const valuesRes = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${idRange}')?valuesOnly=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const values = valuesRes.data.values as (string | number)[][];
    if (!values || values.length === 0) return new Set();

    const ids = new Set<number>();
    for (const row of values) {
      if (row && row.length > 0 && row[0] !== null && row[0] !== '') {
        const id = Number(row[0]);
        if (!isNaN(id) && id > 0) ids.add(id);
      }
    }
    return ids;
  } catch (err) {
    console.error('기존 ID 확인 실패:', err);
    return new Set();
  }
}

// 테이블의 첫 데이터 행 위치를 가져오는 함수
async function getTableFirstDataRow(token: string): Promise<number | null> {
  const tableId = await getTableId(token);
  if (!tableId) return null;

  try {
    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${tableId}/dataBodyRange`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const rangeAddress = res.data.address as string;
    if (!rangeAddress) return null;

    // 범위 주소에서 시작 행 추출
    // 예: "Sheet1!B2:L1000" -> 2
    const rangeOnly = rangeAddress.includes('!')
      ? rangeAddress.split('!')[1]
      : rangeAddress;

    const match = rangeOnly.match(/[A-Z]+(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return null;
  } catch (err) {
    console.error('테이블 첫 행 위치 조회 실패:', err);
    return null;
  }
}

// 테이블에 행을 맨 앞에 삽입하는 함수 (range insert 사용)
async function insertRowsAtTop(
  token: string,
  values: (string | number)[][]
): Promise<void> {
  const sheetName = localStorage.getItem('sheetName');
  const tableId = await getTableId(token);
  if (!sheetName || !tableId) {
    throw new Error('시트 이름 또는 테이블 ID를 찾을 수 없습니다.');
  }

  // 테이블의 첫 데이터 행 위치 확인
  const firstDataRow = await getTableFirstDataRow(token);
  if (!firstDataRow) {
    throw new Error('테이블의 첫 데이터 행 위치를 찾을 수 없습니다.');
  }

  // 테이블의 열 개수 확인
  const tableInfo = await axios.get(
    `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${tableId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const columnCount = tableInfo.data.columns?.length || 11; // 기본값 11 (L열까지)
  const lastColumn = String.fromCharCode(66 + columnCount - 1); // B(66)부터 시작

  // 삽입할 행 수
  const insertRowCount = values.length;

  // 첫 데이터 행 위치에 range insert 사용
  // Microsoft Graph API의 range insert API
  const insertRange = `B${firstDataRow}:${lastColumn}${firstDataRow + insertRowCount - 1}`;

  try {
    // 방법 1: range insert 시도
    try {
      await axios.post(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${insertRange}')/insert`,
        {
          shift: 'Down',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (insertErr: any) {
      // insert가 실패하면 기존 데이터를 아래로 이동시키는 방법 사용
      console.warn(
        'range insert 실패, 데이터 이동 방식 사용:',
        insertErr?.response?.data
      );

      // 테이블의 전체 데이터 범위 가져오기
      const dataRangeRes = await axios.get(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/tables/${tableId}/dataBodyRange`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fullRange = dataRangeRes.data.address as string;
      const rangeOnly = fullRange.includes('!')
        ? fullRange.split('!')[1]
        : fullRange;

      // 기존 데이터를 읽어서 아래로 이동 (배치로 처리)
      const existingDataRes = await axios.get(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${rangeOnly}')?valuesOnly=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const existingValues = existingDataRes.data.values as (
        | string
        | number
      )[][];
      if (existingValues && existingValues.length > 0) {
        // 기존 데이터를 아래로 이동
        const newStartRow = firstDataRow + insertRowCount;
        const newRange = rangeOnly.replace(
          /[A-Z]+\d+/,
          `${rangeOnly.match(/^[A-Z]+/)?.[0] || 'B'}${newStartRow}`
        );
        const endMatch = rangeOnly.match(/:([A-Z]+)(\d+)$/);
        if (endMatch) {
          const newEndRow = parseInt(endMatch[2]) + insertRowCount;
          const movedRange = newRange.replace(
            /:[A-Z]+\d+$/,
            `:${endMatch[1]}${newEndRow}`
          );

          await axios.patch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${movedRange}')`,
            { values: existingValues },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }
    }

    // 새 데이터를 첫 행 위치에 쓰기
    await axios.patch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${insertRange}')`,
      { values },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('범위 삽입 실패:', err);
    throw err;
  }
}

// 새로운 데이터만 테이블에 삽입하는 함수
async function insertNewDataToTable(
  newData: usingDataProps[],
  token: string,
  setProgress: (progress: string) => void
): Promise<void> {
  const excelIds = await getExistingTableIds(token);
  const filteredNew = newData.filter(
    (item) => !excelIds.has((item as any).episodeId ?? (item as any).channelId)
  );

  if (filteredNew.length === 0) {
    toast.info('추가할 새로운 데이터가 없습니다.');
    return;
  }

  setProgress('새로운 데이터 삽입 중...');
  const batchSize = 100; // 테이블 API는 한 번에 많은 행을 처리하기 어려울 수 있음

  try {
    // 데이터 변환
    let allValues: (string | number)[][];
    allValues = (filteredNew as usingDataProps[]).map((row) => {
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

    // 배치로 처리 (역순으로 삽입하여 순서 유지)
    for (let i = allValues.length - 1; i >= 0; i -= batchSize) {
      const startIdx = Math.max(0, i - batchSize + 1);
      const batch = allValues.slice(startIdx, i + 1);

      setProgress(
        `새로운 데이터 삽입 중... ${Math.round(((allValues.length - i) / allValues.length) * 100)}%`
      );

      await insertRowsAtTop(token, batch);
    }

    toast.success(`엑셀 동기화에 성공했습니다! (${filteredNew.length}개 추가)`);
  } catch (err) {
    console.error('엑셀 동기화 실패:', err);
    toast.error('엑셀 동기화에 실패했습니다.');
    throw err;
  }
}

async function syncNewDataToExcel2(
  newData: usingDataProps[],
  token: string,
  setProgress: (progress: string) => void
) {
  // 테이블 API를 사용한 최적화 버전: 새로운 데이터만 삽입
  await insertNewDataToTable(newData, token, setProgress);
}

export default syncNewDataToExcel2;
