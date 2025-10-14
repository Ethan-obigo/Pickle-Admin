import { useState } from "react";
import { getGraphToken } from "./auth";
import { fetchAllData } from "./fetchAllData";
import { addMissingRows } from "./updateExcel";

function App() {
  const [token, setToken] = useState("");

  const handleLogin = async () => {
    const tk = await getGraphToken();
    if (tk) setToken(tk);
  };

  const handleUpdateExcel = async () => {
    if (!token) return alert("로그인을 먼저 해주세요!");
    const allData = await fetchAllData();
    await addMissingRows(allData, token);
  };

  return (
    <>
      <button onClick={handleLogin}>MS Graph 로그인</button>
      <button onClick={handleUpdateExcel}>누락된 엑셀 데이터 추가</button>
    </>
  );
}

export default App;
