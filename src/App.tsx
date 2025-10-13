import { useEffect, useState } from "react";
import "./App.css";
import axios, { type AxiosResponse } from "axios";

function App() {
  const [data, setData] = useState<AxiosResponse | null>(null);

  const accessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDMzNDIzNSwiZXhwIjoxNzYwNDIwNjM1fQ.iMLMqZLd1AFumXCMNC6cUvUkDt3cdzs-MimNTyrxURs";

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://pickle.obigo.ai/admin/episode?page=1&size=10",
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

  console.log(data);

  return <div></div>;
}

export default App;
