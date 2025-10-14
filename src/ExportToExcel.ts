import type { excelProps } from "./type";
import * as XLSX from "xlsx-js-style";

function exportToExcel( allData : excelProps[]) {
  const filteredData = allData.map(item => ({
    "주차": item.week,
    "큐레이션 위치": item.curationSite,
    "큐레이션명": item.curationName,
    "태그": item.tag,
    "에피소드 순번": item.episodeNumber,
    "채널명": item.channelName,
    "에피소드명": item.episodeName,
    "에피소드ID": item.episodeId,
    "시작일": item.startDate,
    "종료일": item.endDate,
    "상태": item.status,
    "담당자": item.manager,
    "비고": item.note,
  }));
  
  const headers = [
    "주차",
    "큐레이션 위치",
    "큐레이션명",
    "태그",
    "에피소드 순번",
    "채널명",
    "에피소드명",
    "에피소드ID",
    "시작일",
    "종료일",
    "상태",
    "담당자",
    "비고",
  ];

  const emptyRows = [{}, {}];
  
  const excelData = [...emptyRows, ...filteredData];

  const worksheet = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
  XLSX.utils.sheet_add_json(worksheet, [{}], { origin: 0 });
  XLSX.utils.sheet_add_json(worksheet, [{}], { origin: 1 });
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 2 });
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 75 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
  ];

  worksheet["!rows"] = [
    { hpx: 20 },
    { hpx: 20 },
    { hpx: 35 },
    ...Array(filteredData.length).fill({ hpx: 20 }),
  ];
  
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3 };
  
  const range = XLSX.utils.decode_range(worksheet["!ref"] as string);
  for (let R = 2; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);

      if (!worksheet[cell_ref]) continue;
      worksheet[cell_ref].s = {
        alignment: { horizontal: "center", vertical: "center" },
      }; 

      if (R === 2) {
        worksheet[cell_ref].s = {
          alignment: { horizontal: "center", vertical: "center" },
          fill: {
            type: "pattern",
            patternType: "solid",
            fgColor: { rgb: "DAF2D0" },
          },
        };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "큐레이션 데이터");


  XLSX.writeFile(workbook, "PICKLE_AAOS 큐레이션.xlsx");
}

export default exportToExcel;
