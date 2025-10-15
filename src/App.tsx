import { useState } from "react";
import { getGraphToken } from "./auth";
import { fetchAllData } from "./fetchAllData";
import { addMissingRows } from "./updateExcel";
import { getNewEpisodes } from "./getNewEpisodes";
import type { excelProps } from "./type";
import EpisodeList from "./EpisodeList";
import syncNewEpisodesToExcel from "./syncNewEpisodesToExcel";

function App() {
  const [token, setToken] = useState("");
  const [newEpi, setNewEpi] = useState<excelProps[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const tk = await getGraphToken();
    if (tk) {
      setToken(tk);
      setLoading(true);
      const newList = await getNewEpisodes(tk);
      setNewEpi(newList);
      setLoading(false);
    }
  };

  const handleUpdateExcel = async () => {
    if (!token) return alert("로그인을 먼저 해주세요!");
    const result = window.confirm("엑셀 파일에 누락된 데이터를 추가합니다.");
    if (result) {
      const allData = await fetchAllData();
      await addMissingRows(allData, token);
    }
  };

  const handleSyncExcel = async () => {
    if (!token) return alert("로그인을 먼저 해주세요!");
    await syncNewEpisodesToExcel(newEpi, token);
  };

  return (
    <div className="bg-[#F6F7FA] w-screen h-screen">
      <div className="w-full h-[10%] flex justify-between items-center mb-0 p-10 bg-white">
        <h1 className="text-4xl font-bold">PICKLE</h1>
        <button
          className="border cursor-pointer bg-[#3c25cc] text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100"
          onClick={handleLogin}
        >
          MS Graph 로그인
        </button>
      </div>
      <div className="p-10 h-[80%]">
        <div className="flex gap-2">
          <button
            className="border cursor-pointer bg-[#3c25cc] mb-4 text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100"
            onClick={handleUpdateExcel}
          >
            전체 에피소드 엑셀로 변환
          </button>
          <a
            href="https://pickle.obigo.ai/admin-web/#/episode-list"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="border cursor-pointer bg-[#3c25cc] mb-4 text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100">
              대시보드 이동
            </button>
          </a>
        </div>
        <div className="w-full rounded-2xl bg-white h-full p-8">
          <div className="flex justify-between">
            <h3 className="mb-6 text-[#3c25cc] font-semibold">
              새로운 에피소드 총{" "}
              <span className="font-extrabold">{newEpi.length}</span>개
            </h3>
            <button
              onClick={handleSyncExcel}
              className="border cursor-pointer bg-[#3c25cc] mb-4 text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100"
            >
              Excel 동기화
            </button>
          </div>
          <div className="w-full font-bold flex py-5 bg-gray-100">
            <p className="w-[10%] px-2">ID</p>
            <p className="w-[20%] px-2">에피소드명</p>
            <p className="w-[15%] px-2">타입</p>
            <p className="w-[15%] px-2">채널/도서명</p>
            <p className="w-[10%] px-2">좋아요수</p>
            <p className="w-[10%] px-2">청취수</p>
            <p className="w-[15%] px-2">등록일</p>
          </div>

          {loading && (
            <div className="flex flex-col gap-4 items-center justify-center h-[70%] box-border bg-black/30">
              <p className="text-white text-center font-bold">새로운 에피소드 목록을 불러오는 중입니다.<br />잠시만 기다려주세요!</p>
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {!loading && <EpisodeList data={newEpi} />}
        </div>
      </div>
    </div>
  );
}

export default App;
