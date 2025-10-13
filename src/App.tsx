import { useEffect, useState } from "react";
import "./App.css";
import exportAllDataToExcel from "./ExportData";
import type { AxiosResponse } from "axios";
import axios from "axios";

function App() {
  const [data, setData] = useState<AxiosResponse | null>(null);

  const accessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDMzNDIzNSwiZXhwIjoxNzYwNDIwNjM1fQ.iMLMqZLd1AFumXCMNC6cUvUkDt3cdzs-MimNTyrxURs";

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://pickle.obigo.ai/admin/episode?episodeName=%EC%9A%B0%EB%A6%AC%EB%8A%94+%EC%99%9C&page=1&size=10",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setData(response.data);
    };

    fetchData();
  }, []);

  console.log(data?.data);

  return <div onClick={() => exportAllDataToExcel()}>다운로드</div>;
}

export default App;
