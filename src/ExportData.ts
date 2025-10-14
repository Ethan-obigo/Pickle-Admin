import axios from "axios";
import type { excelProps } from "./type";
import exportToExcel from "./ExportToExcel";

async function exportAllDataToExcel() {
  const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

  try {
    const size = 1000;
    const firstRes = await axios.get(`https://pickle.obigo.ai/admin/episode?page=1&size=${size}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const totalCount = firstRes.data.data.pageInfo.totalCount;
    const totalPages = Math.ceil(totalCount / size);

    let allData: excelProps[] = [...firstRes.data.data.dataList];

    for (let page = 2; page <= totalPages; page++) {
      const res = await axios.get(`https://pickle.obigo.ai/admin/episode?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      allData = allData.concat(res.data.data.dataList);
    }

    exportToExcel(allData);
    alert("엑셀 다운로드 완료!");
  } catch (error) {
    console.error("데이터 가져오기/엑셀 생성 오류:", error);
  }
}

export default exportAllDataToExcel;
