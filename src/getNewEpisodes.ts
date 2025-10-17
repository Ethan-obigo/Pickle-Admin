import axios from "axios";
import type { usingDataProps } from "./type";
import { getExcelData } from "./updateExcel";

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

function findLatestTimeInExcel(excelData: usingDataProps[]): number {
  if (excelData.length === 0) return 0;

  // excelData[3]만 사용하는 대신, 전체를 순회하여 가장 큰 createdAt(시리얼) 값을 찾음
  const latestSerial = excelData.reduce((max, item) => {
    const currentSerial = Number(item.createdAt);
    return currentSerial > max ? currentSerial : max;
  }, 0); // 0부터 시작 가정

  if (latestSerial === 0) return 0; // 데이터가 0인 경우

  const latestDateInExcel = excelDateToJSDate(latestSerial);
  return latestDateInExcel.getTime();
}

export async function getNewEpisodes(token: string, accessToken: string) {
  const excelData = await getExcelData(token);
  if (excelData.length === 0) return [];
  console.log(excelData);
  const latestTime = findLatestTimeInExcel(excelData);
  console.log(latestTime);
  const size = 1000;
  const firstRes = await axios.get(
    `https://pickle.obigo.ai/admin/episode?page=1&size=${size}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const totalCount = firstRes.data.data.pageInfo.totalCount;
  const totalPages = Math.ceil(totalCount / size);

  let allApiData: usingDataProps[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const res = await axios.get(
      `https://pickle.obigo.ai/admin/episode?page=${page}&size=${size}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const pageData = res.data.data.dataList;
    const pageTime = new Date(pageData[0].createdAt).getTime();

    allApiData = allApiData.concat(pageData);
    if (pageTime <= latestTime) {
      console.log(pageData[0].episodeName);
      console.log(pageTime, latestTime);
      break;
    }
  }

  const newEpisodes = allApiData.filter(
    (item) => new Date(item.createdAt).getTime() > latestTime
  );

  console.log(allApiData);
  console.log(newEpisodes);

  return newEpisodes;
}
