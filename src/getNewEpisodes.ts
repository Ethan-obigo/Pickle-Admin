import axios from "axios";
import type { usingDataProps } from "./type";
import { getExcelData } from "./updateExcel";

function excelDateToJSDate(serial: number): Date {
  const millisPerDay = 24 * 60 * 60 * 1000;
  const excelEpochMillis = Date.UTC(1899, 11, 30); 
  const targetMillis = excelEpochMillis + serial * millisPerDay;

  return new Date(targetMillis);
}

function findLatestTimeInExcel(excelData: usingDataProps[]): number {
  if (excelData.length === 0) return 0;

  const latestSerial = excelData.reduce((max, item) => {
    const currentSerial = Number(item.createdAt);
    return currentSerial > max ? currentSerial : max;
  }, 0);

  if (latestSerial === 0) return 0;

  const latestDateInExcel = excelDateToJSDate(latestSerial);
  return latestDateInExcel.getTime();
}

export async function getNewEpisodes(token: string, accessToken: string) {
  const excelData = await getExcelData(token);
  if (excelData.length === 0) return [];

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
    const dbDate = new Date(pageData[0].createdAt);
    const pageTime = dbDate.getTime() - (dbDate.getTimezoneOffset() * 60 * 1000);

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
