import axios from "axios";
import type { excelProps } from "./type";
import { getExcelData } from "./updateExcel";

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

export async function getNewEpisodes(token: string) {
  const excelData = await getExcelData(token);
  if (excelData.length === 0) return [];

  const latestDateInExcel = excelDateToJSDate(Number(excelData[0].createdAt));
  const latestTime = latestDateInExcel.getTime();

  const accessToken = import.meta.env.VITE_ACCESS_TOKEN;
  const size = 1000;
  const firstRes = await axios.get(
    `https://pickle.obigo.ai/admin/episode?page=1&size=${size}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const totalCount = firstRes.data.data.pageInfo.totalCount;
  const totalPages = Math.ceil(totalCount / size);

  let allApiData: excelProps[] = [...firstRes.data.data.dataList];

  for (let page = 2; page <= totalPages; page++) {
    const res = await axios.get(
      `https://pickle.obigo.ai/admin/episode?page=${page}&size=${size}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const pageData = res.data.data.dataList;
    const pageTime = new Date(pageData[0].createdAt).getTime();

    if (pageTime <= latestTime) break;
    allApiData = allApiData.concat(pageData);
  }

  const newEpisodes = allApiData.filter(
    (item) => new Date(item.createdAt).getTime() > latestTime
  );

  return newEpisodes;
}
