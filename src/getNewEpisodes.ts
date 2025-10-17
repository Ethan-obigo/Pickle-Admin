import axios from "axios";
import type { usingDataProps } from "./type";
import { getExcelData } from "./updateExcel";

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

export async function getNewEpisodes(token: string, accessToken: string) {
  const excelData = await getExcelData(token);
  if (excelData.length === 0) return [];

  const latestDateInExcel = excelDateToJSDate(Number(excelData[3].createdAt));
  const latestTime = latestDateInExcel.getTime();
console.log("excelTime: ", latestTime);
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
console.log(`${page}, pageTime: `, pageTime);
    allApiData = allApiData.concat(pageData);
    if (pageTime <= latestTime) break;
  }

  const newEpisodes = allApiData.filter(
    (item) => new Date(item.createdAt).getTime() > latestTime
  );

  return newEpisodes;
}
