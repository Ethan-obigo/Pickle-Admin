import { useState } from "react";
import "./App.css";
import { getGraphToken } from "./auth";
import { updateExcelRow } from "./updateExcel";
/*
import { useEffect, useState } from "react";
import type { AxiosResponse } from "axios";
import axios from "axios";
*/
/*
  const [data, setData] = useState<AxiosResponse | null>(null);

  const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://pickle.obigo.ai/admin/episode?episodeName=%EC%8A%AC%EC%9D%98%EC%83%9D&page=1&size=10",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setData(response.data);
    };

    fetchData();
  }, [accessToken]);

  console.log(data?.data);
  */

function App() {
  const [token, setToken] = useState("");
  const sampleData = {
    week: "11",
    curationSite: 2,
    curationName: "큐레이션명",
    tag: "태그",
    episodeNumber: 3,
    channelName: "채널명",
    episodeName: "에피소드명1",
    episodeId: 12312,
    startDate: "시작일1",
    endDate: "종료일1",
    status: "상태1",
    manager: "관리자1",
    note: "비고1",
  };

  const handleLogin = async () => {
    const tk = await getGraphToken();
    if (tk) {
      setToken(tk);
      console.log("Graph Token:", tk);
    } else {
      alert("로그인 실패");
    }
  };

  return (
    <>
      <div style={{ padding: "20px" }}>
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0078D4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          MS Graph 로그인
        </button>
      </div>
      <div
        onClick={() => {
          console.log("토큰:", token);
          const row = [
            sampleData.week,
            sampleData.curationSite,
            sampleData.curationName,
            sampleData.tag,
            sampleData.episodeNumber,
            sampleData.channelName,
            sampleData.episodeName,
            sampleData.episodeId,
            sampleData.startDate,
            sampleData.endDate,
            sampleData.status,
            sampleData.manager,
            sampleData.note,
          ];
          updateExcelRow(row, token);
        }}
        style={{
          cursor: "pointer",
          padding: "10px",
          background: "#4caf50",
          color: "white",
          width: "200px",
          textAlign: "center",
        }}
      >
        엑셀 업데이트 테스트
      </div>
    </>
  );
}

export default App;
