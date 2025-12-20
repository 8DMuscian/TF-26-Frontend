import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import "./App.css";

// Chart Component (unchanged)
const Chart = ({ option, height = "100%" }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const instance = echarts.init(chartRef.current);
      chartInstance.current = instance;
      instance.setOption(option);

      const handleResize = () => instance.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        instance.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option);
    }
  }, [option]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
};

const Dashboard = () => {
  // Theme toggle state
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
   const [deviceStatus, setDeviceStatus] = useState("active");
   // status indicator
  
   useEffect(() => {
  const interval = setInterval(() => {
    const s = ["active", "sleep", "off"];
    setDeviceStatus(s[Math.floor(Math.random() * 3)]);
  }, 20000); // every 20 sec
   return () => clearInterval(interval);
}, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const dataRef = useRef([]);
  const [tick, setTick] = useState(0);

  const INTERVAL_MS = 15 * 60 * 1000;
  const todayStart = useRef(new Date().setHours(0, 0, 0, 0));
  const todayEnd = useRef(new Date().setHours(24, 0, 0, 0));

  // Data generator
  const generatePoint = (timestamp) => {
    const timeObj = new Date(timestamp);
    const hour = timeObj.getHours();

    const et0 = Math.max(
      0,
      0.5 + Math.sin(((hour - 6) * Math.PI) / 12) * 0.4 + Math.random() * 0.1
    );
    const temp = 15 + Math.sin(((hour - 6) * Math.PI) / 12) * 10 + Math.random() * 2;
    const humidity = Math.min(
      100,
      Math.max(0, 60 - Math.sin(((hour - 6) * Math.PI) / 12) * 20 + Math.random() * 5)
    );
    const wind = 2 + Math.random() * 3;
    const solar = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12) * 800 + Math.random() * 100);
    const predicted = Math.max(0, et0 + (Math.random() - 0.5) * 0.2);

   

 



    return {
      name: timeObj.toString(),
      value: [timestamp, et0],
      temp,
      humidity,
      wind,
      solar,
      predicted,
    };
  };

  useEffect(() => {
    const now = Date.now();
    let iteratorTime = todayStart.current;
    let initialData = [];

    while (iteratorTime <= now) {
      initialData.push(generatePoint(iteratorTime));
      iteratorTime += INTERVAL_MS;
    }

    dataRef.current = initialData;
    setTick(1);

    const checkInterval = setInterval(() => {
      const now = Date.now();
      let lastPointTime =
        dataRef.current.length > 0
          ? dataRef.current[dataRef.current.length - 1].value[0]
          : todayStart.current;

      let nextPointTime = lastPointTime + INTERVAL_MS;
      let needsUpdate = false;

      while (nextPointTime <= now && nextPointTime <= todayEnd.current) {
        dataRef.current = [...dataRef.current, generatePoint(nextPointTime)];
        lastPointTime = nextPointTime;
        nextPointTime += INTERVAL_MS;
        needsUpdate = true;
      }

      if (needsUpdate) setTick((t) => t + 1);
    }, 5000);

    return () => clearInterval(checkInterval);
  }, []);

  const commonGrid = { left: "12%", right: "5%", top: "15%", bottom: "15%" };
  const colors = {
    primary: "#3b82f6",
    accent: "#10b981",
    temp: "#ef4444",
    hum: "#06b6d4",
    wind: "#a855f7",
  };

  const getEt0Option = () => ({
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        const date = new Date(p.value[0]);
        return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<br/>ET₀: ${p.value[1].toFixed(3)}`;
      },
    },
    grid: commonGrid,
    xAxis: {
      type: "time",
      min: todayStart.current,
      max: todayEnd.current,
      boundaryGap: false,
      splitLine: { show: true, lineStyle: { color: "#f3f4f6" } },
      axisLabel: { formatter: "{HH}:{mm}", color: "#666" },
    },
    yAxis: { type: "value", name: "ET₀ (mm/day)", splitLine: { show: false } },
    series: [
      {
        name: "ET₀",
        type: "line",
        showSymbol: false,
        data: dataRef.current,
        smooth: true,
        lineStyle: { color: colors.primary, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
            { offset: 1, color: "rgba(59, 130, 246, 0)" },
          ]),
        },
      },
    ],
  });

  const getScatterOption = (xKey, xName, color) => ({
    tooltip: {
      trigger: "item",
      formatter: (p) => `${xName}: ${p.value[0].toFixed(1)}<br/>ET₀: ${p.value[1].toFixed(3)}`,
    },
    grid: commonGrid,
    xAxis: { type: "value", name: xName, scale: true, splitLine: { show: false } },
    yAxis: { type: "value", name: "ET₀", splitLine: { show: false } },
    series: [
      {
        type: "scatter",
        symbolSize: 8,
        itemStyle: { color: color, opacity: 0.6 },
        data: dataRef.current.map((item) => [item[xKey], item.value[1]]),
      },
    ],
  });

  const getComparisonOption = () => ({
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: "5%", right: "5%", top: "20%", bottom: "15%" },
    xAxis: {
      type: "time",
      min: todayStart.current,
      max: todayEnd.current,
      axisLabel: { formatter: "{HH}:{mm}" },
      splitLine: { show: true, lineStyle: { color: "#f3f4f6" } },
    },
    yAxis: { type: "value", splitLine: { show: false } },
    series: [
      { name: "Actual", type: "line", showSymbol: false, smooth: true, lineStyle: { color: colors.primary }, data: dataRef.current },
      { name: "Predicted", type: "line", showSymbol: false, smooth: true, lineStyle: { color: colors.accent, type: "dashed" }, data: dataRef.current.map((d) => [d.value[0], d.predicted]) },
    ],
  });

  const latest = dataRef.current.length > 0 ? dataRef.current[dataRef.current.length - 1] : {};

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-zinc-950 transition-colors overflow-hidden">
      <div className="main-content max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Weather Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">Daily View (00:00 - 24:00)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: <span className="font-mono">{new Date().toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-4 py-2 rounded-lg text-sm font-medium
              bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100 transition-colors"
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <button
              onClick={() => {
                alert("PDF downloaded!");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium
              bg-gray-200 text-gray-900 dark:bg-zinc-800 dark:text-gray-100 transition-colors"
            >
              ⬇️ Download
            </button>
          </div>



        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          
          <MetricCard icon="💧" label="ET₀" value={latest.value?.[1]?.toFixed(2) || "--"} unit="mm/day" textColor="text-gray-800  dark:text-gray-200" bgColor="bg-white dark:bg-zinc-800" colorClass="text-blue-600 bg-blue-900" />
          <MetricCard icon="🌡️" label="TEMP" value={latest.temp?.toFixed(1) || "--"} unit="°C" textColor="text-gray-800  dark:text-gray-200" bgColor="bg-white dark:bg-zinc-800" colorClass="text-red-600 bg-red-900" />
          <MetricCard icon="💨" label="HUM" value={latest.humidity?.toFixed(0) || "--"} unit="%" textColor="text-gray-800  dark:text-gray-200" bgColor="bg-white dark:bg-zinc-800" colorClass="text-cyan-600 bg-cyan-100" />
          <MetricCard icon="🌪️" label="WIND" value={latest.wind?.toFixed(1) || "--"} unit="m/s" textColor="text-gray-800  dark:text-gray-200" bgColor="bg-white dark:bg-zinc-800" colorClass="text-purple-600 bg-purple-100" />
          <MetricCard icon="☀️" label="SOLAR" value={latest.solar?.toFixed(0) || "--"} unit="W/m²" textColor="text-gray-800  dark:text-gray-200" bgColor="bg-white dark:bg-zinc-800" colorClass="text-yellow-600 bg-yellow-100" />
          <DeviceStatusCard status={deviceStatus} />
        </div>
        

        {/* Charts */}
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper title="ET₀ vs Time (Daily)">
            <Chart option={getEt0Option()} />
          </ChartWrapper>

          <ChartWrapper title="Temperature vs ET₀">
            <Chart option={getScatterOption("temp", "Temperature (°C)", colors.temp)} />
          </ChartWrapper>

          <ChartWrapper title="Humidity vs ET₀">
            <Chart option={getScatterOption("humidity", "Humidity (%)", colors.hum)} />
          </ChartWrapper>

          <ChartWrapper title="Wind Speed vs ET₀">
            <Chart option={getScatterOption("wind", "Wind Speed (m/s)", colors.wind)} />
          </ChartWrapper>

          {/* Full-width Actual vs Predicted ET₀ chart */}
          <div className="lg:col-span-2">
            <ChartWrapper title="Actual vs Predicted ET₀" height={360}>
              <Chart option={getComparisonOption()} />
            </ChartWrapper>
          </div>
        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, unit, textColor, bgColor, colorClass }) => (
  <div className={`metric-card ${bgColor} rounded-xl shadow-md p-4`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-semibold ${colorClass} px-2 py-1 rounded`}>{label}</span>
    </div>
    <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit}</div>
  </div>
);
const DeviceStatusCard = ({ status }) => {
  const map = {
    active: "🟢 Active",
    sleep: "🟡 Sleep",
    off: "🔴 Off",
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Device Status
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
        {map[status]}
      </div>
    </div>
  );
};



const ChartWrapper = ({ title, children, height = 320 }) => (
  <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 md:p-6`} style={{ height }}>
    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h2>
    <div className="chart-container" style={{ height: '100%' }}>
      {children}
    </div>
  </div>
);

export default Dashboard;
