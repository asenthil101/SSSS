"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import LeftTitle from "../_components/common/LeftTitle";
import LineChart from "../_components/dashboard/LineChart";
import Tile from "../_components/common/Tile";
import BreakingNotification from "../_components/dashboard/BreakingNotification";

export default function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [basicData, setBasicData] = useState<BasicData>();
  const [breakingData, setBreakingData] = useState<BreakingData[]>();

  useEffect(() => {
    const getDataset = async () => {
      const { data } = await axios.get("http://localhost:3000/stats/last_day");
      setChartData(data);
    };

    const getBasicData = async () => {
      const { data } = await axios.get(
        "http://localhost:3000/stats/photo_logs/all"
      );
      setBasicData(data);
    };

    const getBreakingData = async () => {
      const { data } = await axios.get("http://localhost:3000/breaking_logs");
      setBreakingData(data);
    };

    getDataset();
    getBasicData();
    getBreakingData();
  }, []);

  if (!chartData || !basicData) return <div>Loading...</div>;
  console.log(basicData.byUser);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <LeftTitle title={`/dashboard`} />
      <>
        <div className="grid grid-cols-3 gap-4   mx-auto">
          <Tile label="Users" data={chartData.length} />
          <Tile label="Logins" data={basicData.total} />
          <Tile label="Breakings" data={basicData.byUser["unknown"]} />
        </div>

        <h1 className="mx-auto text:md md:text-xl font-semibold capitalize my-4">
          Breaking
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4  w-full">
          {breakingData &&
            breakingData.map((data: BreakingData) => {
              return <BreakingNotification breakingLog={data} />;
            })}
        </div>

        {/* line chart */}
        <h1 className="mx-auto text-md md:text-xl font-semibold capitalize my-4">
          Last day
        </h1>
        <div className="md:w-full  flex mx-auto justify-center ">
          <div className="border border-gray-400 pt-0 rounded-xl w-full  shadow-xl rotate-90 md:rotate-0">
            {/* Use the LineChart component and pass chartData as a prop */}
            <LineChart datasets={chartData} />
          </div>
        </div>
      </>
    </main>
  );
}
