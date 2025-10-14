export type ExcelRow = (string | number | null)[];
export interface excelProps {
  audioUrl: string;
  episodeNumber: number;
  channelName: string;
  episodeName: string;
  episodeId: number;
  createdAt: string;
  dispDtime: string;
  episodeType: string;
  language: string;
  likeCnt: number;
  playTime: number;
  thumbnailUrl: string;
  vendorName: string;
}