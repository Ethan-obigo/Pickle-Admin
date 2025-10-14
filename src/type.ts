export type ExcelRow = (string | number | null)[];
export interface excelProps {
  week: string;
  curationSite: number;
  curationName: string;
  tag: string;
  episodeNumber: number;
  channelName: string;
  episodeName: string;
  episodeId: number;
  startDate: string;
  endDate: string;
  status: string;
  manager: string;
  note: string;
}