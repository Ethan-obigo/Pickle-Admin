import type { excelProps } from "./type";
import * as XLSX from "xlsx";

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
  const emptyRows = [{}, {}];
  
  const excelData = [...emptyRows, ...filteredData];

  const worksheet = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
  XLSX.utils.sheet_add_json(worksheet, [{}], { origin: 0 });
  XLSX.utils.sheet_add_json(worksheet, [{}], { origin: 1 });

  const headers = ["주차", "큐레이션 위치", "큐레이션명", "태그", "에피소드 순번", "채널명", "에피소드명", "에피소드ID", "시작일", "종료일", "상태", "담당자", "비고"];
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 2 });
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 15 },
    { wch: 12 },
    { wch: 6 },
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
    { hpx: 50 },
    ...Array(filteredData.length).fill({ hpx: 20 }),
  ];
  
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "큐레이션 데이터");


  XLSX.writeFile(workbook, "PICKLE_AAOS 큐레이션.xlsx");
}

export default exportToExcel;
