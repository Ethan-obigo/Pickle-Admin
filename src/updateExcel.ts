// updateExcel.ts
import axios from "axios";
import type { excelProps } from "./type";

export async function updateExcelRow(data: excelProps[], token: string) {
  const fileId = import.meta.env.VITE_FILE_ID;
  const sheetName = import.meta.env.VITE_WORKSHEET_NAME;

  try {
    const response = await axios.patch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A1:M1')`,
      {
        values: [data],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("엑셀 업데이트 성공:", response.data);
  } catch (err) {
    console.error("엑셀 업데이트 실패:", err);
  }
}
