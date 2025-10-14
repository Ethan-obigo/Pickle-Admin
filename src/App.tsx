import { useState } from "react";
import { getGraphToken } from "./auth";
import { fetchAllData } from "./fetchAllData";
import { addMissingRows } from "./updateExcel";
import { getNewEpisodes } from "./getNewEpisodes";
import type { excelProps } from "./type";

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
    const allData = await fetchAllData();
    await addMissingRows(allData, token);
  };

  return (
    <div className="p-10 bg-[#F6F7FA] w-screen h-screen">
      <button className="border cursor-pointer" onClick={handleLogin}>
        MS Graph 로그인
      </button>
      <button className="border cursor-pointer" onClick={handleUpdateExcel}>
        전체 에피소드 엑셀로 변환
      </button>
      <div className="w-full rounded-2xl bg-white h-[80%] p-8">
        <h3 className="mb-6">
          새로운 에피소드 목록 <br /> 총{" "}
          <span className="font-bold">{newEpi.length}</span>개
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
        <ul className="w-full h-[75%] overflow-scroll">
          {newEpi.map((epi, idx) => (
            <li
              key={idx}
              className="py-2 w-full flex border-t-2 border-gray-200 cursor-pointer transition-colors duration-150 hover:bg-gray-100"
            >
              <p className="w-[10%]">{epi.episodeId}</p>
              <p className="w-[20%]">{epi.episodeName}</p>
              <p className="w-[15%]">{epi.episodeType}</p>
              <p className="w-[15%]">{epi.channelName}</p>
              <p className="w-[10%]">{epi.likeCnt}</p>
              <p className="w-[10%]">{epi.playTime}</p>
              <p className="w-[15%]">{epi.createdAt}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
