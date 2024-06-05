import { useEffect } from "react";
import { Chart } from "chart.js";

const LineChart = ({ datasets }: any) => {
  useEffect(() => {
    const ctx = document?.getElementById("myChart")?.getContext("2d");

    const labels = Array.from(Array(24).keys()).map((x) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - x) + 2);
      return date.getHours() + ":00";
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasets,
      },
    });
  }, [datasets]);

  return <canvas id="myChart"></canvas>;
};

export default LineChart;
