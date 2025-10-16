import axios from "axios";
import type { usingDataProps } from "./type";

const size = 10000;

export async function fetchAllData(accessToken: string): Promise<usingDataProps[]> {
  try {
    const firstRes = await axios.get(
      `https://pickle.obigo.ai/admin/episode?page=1&size=${size}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const totalCount = firstRes.data.data.pageInfo.totalCount;
    const totalPages = Math.ceil(totalCount / size);

    let allData: usingDataProps[] = [...firstRes.data.data.dataList];

    for (let page = 2; page <= totalPages; page++) {
      const res = await axios.get(
        `https://pickle.obigo.ai/admin/episode?page=${page}&size=${size}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      allData = allData.concat(res.data.data.dataList);
    }

    return allData;
  } catch (err) {
    console.error("데이터 API 가져오기 실패:", err);
    return [];
  }
}
