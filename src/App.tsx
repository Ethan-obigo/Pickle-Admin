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
    if (tk) setToken(tk);
  };

  const handleUpdateExcel = async () => {
    if (!token) return alert("로그인을 먼저 해주세요!");
    const allData = await fetchAllData();
    await addMissingRows(allData, token);
  };

  const handleNewEpisodes = async () => {
    if (!token) return alert("로그인을 먼저 해주세요!");
    const newList = await getNewEpisodes(token);
    setNewEpi(newList);
  };

  return (
    <>
      <button onClick={handleLogin}>MS Graph 로그인</button>
      <button onClick={handleUpdateExcel}>누락된 엑셀 데이터 추가</button>
      <button onClick={handleNewEpisodes}>new!</button>
      <div>
        <h3>새로운 에피소드 목록{newEpi.length}</h3>
        <ul>
          {newEpi.map((epi, idx) => (
            <li key={idx}>
              {epi.episodeName}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
