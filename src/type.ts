export type ExcelRow = (string | number | null)[];
export interface excelProps {
  audioUrl: string;
  channelId: number;
  episodeNumber: number;
  channelName: string;
  creatorSeq: number;
  episodeName: string;
  episodeId: number;
  createdAt: string;
  dispDtime: string;
  episodeType: string;
  guests: string;
  language: string;
  lastUpdateDtime: string;
  likeCnt: number;
  listenCnt: number;
  modifiedAt: string;
  modifierSeq: number;
  playTime: number;
  playlists: string;
  tags: string;
  tagsAdded: string;
  thumbnailUrl: string;
  usageYn: string;
  vendorName: string;
}
export interface LoginResponseData {
  adminSeq: number;
  email: string;
  adminName: string;
  roleId: string;
  accessToken: string;
  refreshToken: string;
}
