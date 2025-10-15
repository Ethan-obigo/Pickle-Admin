import { getExcelData } from "./updateExcel";
import { addMissingRows } from "./updateExcel";
import type { excelProps } from "./type";

async function syncNewEpisodesToExcel(newEpi: excelProps[], token: string) {
  const excelData = await getExcelData(token);

  const excelIds = new Set(excelData.map((epi) => epi.episodeId));
  const filteredNew = newEpi.filter((epi) => !excelIds.has(epi.episodeId));

  const updatedData = [...filteredNew, ...excelData];

  await addMissingRows(updatedData, token);

  console.log("동기화 완료! 총 데이터 개수:", updatedData.length);
}

export default syncNewEpisodesToExcel;
