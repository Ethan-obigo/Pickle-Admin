import { useState } from "react";
import { getGraphToken } from "./auth";
import { fetchAllData } from "./fetchAllData";
import { addMissingRows } from "./updateExcel";
import { getNewEpisodes } from "./getNewEpisodes";
import type { excelProps } from "./type";
import EpisodeList from "./EpisodeList";

function App() {
  const [token, setToken] = useState("");
  const [newEpi, setNewEpi] = useState<excelProps[]>([]);

  const handleLogin = async () => {
    const tk = await getGraphToken();
    if (tk) {
      setToken(tk);
      const newList = await getNewEpisodes(tk);
      setNewEpi(newList);
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

  return (
    <div className="bg-[#F6F7FA] w-screen h-screen">
      <div className="w-full h-[10%] flex justify-between items-center mb-4 p-10 bg-white">
        <h1 className="text-4xl font-bold">PICKLE</h1>
        <button
          className="border cursor-pointer bg-[#3c25cc] text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100"
          onClick={handleLogin}
        >
          MS Graph 로그인
        </button>
      </div>
      <div className="p-10 h-[80%]">
        <button
          className="border cursor-pointer bg-[#3c25cc] mb-4 text-white shadow-[0_2px_0_rgba(72,5,255,0.06)] px-5 py-2 rounded-md hover:bg-[#624ad9] transition-colors duration-100"
          onClick={handleUpdateExcel}
        >
          전체 에피소드 엑셀로 변환
        </button>
        <div className="w-full rounded-2xl bg-white h-full p-8">
          <h3 className="mb-6 text-[#3c25cc] font-semibold">
            새로운 에피소드 총{" "}
            <span className="font-extrabold">{newEpi.length}</span>개
          </h3>
          <div className="w-full font-bold flex pb-6">
            <p className="w-[10%]">ID</p>
            <p className="w-[20%]">에피소드명</p>
            <p className="w-[15%]">타입</p>
            <p className="w-[15%]">채널/도서명</p>
            <p className="w-[10%]">좋아요수</p>
            <p className="w-[10%]">청취수</p>
            <p className="w-[15%]">등록일</p>
          </div>
          <EpisodeList data={newEpi} />
        </div>
      </div>
    </div>
  );
}

export default App;
