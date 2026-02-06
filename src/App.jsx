import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as echarts from "echarts";
import IrrigationMap from "./components/IrrigationMap";
import "leaflet/dist/leaflet.css";
import "./App.css";

// Replace with your backend base URL
const BASE_URL = "https://final-model-kj-production.up.railway.app/predict";

// Chart Component
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

// Metric Card Component
const MetricCard = ({ icon, label, value, unit }) => (
  <div className="metric-card bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transition-colors">
    <div className="text-2xl">{icon}</div>
    <div className="text-sm font-semibold text-gray-800 dark:text-gray-50 mt-2">{label}</div>
    <div className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-1">{value}</div>
    {unit && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit}</div>}
  </div>
);

// Next Irrigation Card
const NextIrrigationCard = ({ latest }) => {
  if (!latest || latest.soilMoisture === undefined) {
    return (
      <div className="metric-card bg-white dark:bg-zinc-800 rounded-xl shadow-md p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Next Irrigation</div>
        <div className="text-xl font-bold mt-2">--</div>
      </div>
    );
  }

  const moisture = latest.soilMoisture;
  let minutesUntil = 720; // default 12h
  let reason = "Scheduled";
  if (moisture < 25) {
    minutesUntil = 30;
    reason = "Low soil moisture";
  } else if (moisture < 40) {
    minutesUntil = 180;
    reason = "Moderate soil moisture";
  }

  return (
    <div className="metric-card bg-white dark:bg-zinc-800 rounded-xl shadow-md p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">Next Irrigation</div>
      <div className="text-xl font-bold mt-2">{minutesUntil} mins</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reason}</div>
    </div>
  );
};

// Chart Wrapper
const ChartWrapper = ({ title, children, height = 300 }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 md:p-6 flex flex-col" style={{ height }}>
    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h2>
    <div style={{ height: "100%" }}>{children}</div>
  </div>
);

// FilterSection component
const FilterSection = ({ filters, setFilters }) => {
  const crops = ["Wheat", "Corn", "Rice", "Soybean"];
  const soilTypes = ["Clay", "Sandy", "Loamy", "Silty"];
  const slopes = ["Flat", "Gentle", "Steep"];
  const growthStages = ["Seedling", "Vegetative", "Flowering", "Maturity"];

  const handleChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Select Parameters
      </h3>
      <div className="flex flex-col gap-3">
        <label>
          Crop
          <select value={filters.crop} onChange={handleChange("crop")} className="w-full mt-1 p-1 border rounded">
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Soil Type
          <select value={filters.soilType} onChange={handleChange("soilType")} className="w-full mt-1 p-1 border rounded">
            {soilTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Slope
          <select value={filters.slope} onChange={handleChange("slope")} className="w-full mt-1 p-1 border rounded">
            {slopes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Growth Stage
          <select value={filters.growthStage} onChange={handleChange("growthStage")} className="w-full mt-1 p-1 border rounded">
            {growthStages.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [deviceStatus, setDeviceStatus] = useState("active");
  const [filters, setFilters] = useState({
    crop: "Wheat",
    soilType: "Clay",
    slope: "Flat",
    growthStage: "Seedling",
  });

  const [data, setData] = useState([]);
  const [latest, setLatest] = useState({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/data`); // Assuming /data returns array of points
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
        setLatest(response.data[response.data.length - 1] || {});
      }
    } catch (error) {
      console.error("Failed to fetch data from backend:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Simulate device status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const s = ["active", "sleep", "off"];
      setDeviceStatus(s[Math.floor(Math.random() * 3)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const commonGrid = { left: "12%", right: "5%", top: "15%", bottom: "15%" };
  const colors = {
    primary: "#3b82f6",   // main ETc line
    secondary: "#10b981", // Predicted ETc or soil moisture
    warning: "#facc15",
    danger: "#ef4444",
    temp: "#3b82f6",
    hum: "#3b82f6",
    wind: "#3b82f6",
  };

  const getEt0Option = () => ({
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        const date = new Date(p.value[0]);
        return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<br/>ET<sub>c</sub>: ${p.value[1]?.toFixed(3)}`;
      },
    },
    grid: commonGrid,
    xAxis: { type: "time", boundaryGap: false, splitLine: { show: true } },
    yAxis: { type: "value", name: "ET\nc (mm/day)", splitLine: { show: false } },
    series: [
      {
        type: "line",
        showSymbol: false,
        data: data.map((d) => [d.timestamp, d.et0]),
        smooth: true,
        lineStyle: { color: colors.primary, width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
          { offset: 1, color: "rgba(59, 130, 246, 0)" },
        ]) },
      },
    ],
  });

  const getSoilMoistureOption = () => ({
    tooltip: { trigger: "axis" },
    grid: commonGrid,
    xAxis: { type: "time", boundaryGap: false },
    yAxis: { type: "value", name: "Soil Moisture (%)", min: 0, max: 100 },
    series: [
      {
        type: "line",
        showSymbol: false,
        data: data.map((d) => [d.timestamp, d.soilMoisture]),
        smooth: true,
        lineStyle: { color: "#16a34a", width: 2 },
        areaStyle: { color: "rgba(22,163,74,0.08)" },
      },
    ],
  });

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-zinc-950 transition-colors overflow-hidden p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Autonomous Zonal Irrigation Hub
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Date: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button
            onClick={() => alert("PDF downloaded!")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            ⬇️ Download
          </button>
          <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm ${
            deviceStatus === "active" ? "bg-green-500 text-white" :
            deviceStatus === "sleep" ? "bg-yellow-400 text-white" :
            "bg-red-500 text-white"
          }`}>
            {deviceStatus === "active" ? "🟢 Active" : deviceStatus === "sleep" ? "🟡 Sleep" : "🔴 Off"}
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="dashboard-grid flex flex-col lg:flex-row gap-4">
        {/* Charts Left */}
        <div className="charts flex-1 flex flex-col gap-6">
          <ChartWrapper title="Soil Moisture vs Time" height={360}>
            <Chart option={getSoilMoistureOption()} />
          </ChartWrapper>

          <ChartWrapper title={<span>ET<sub>c</sub> vs Time (Daily)</span>}>
            <Chart option={getEt0Option()} />
          </ChartWrapper>

          <ChartWrapper title="Field Location Map" height={360}>
            <IrrigationMap />
          </ChartWrapper>
        </div>

        {/* Cards Right */}
        <div className="cards flex flex-col gap-4 w-full lg:w-64">
          <FilterSection filters={filters} setFilters={setFilters} />
          <MetricCard icon="💧" label={<span>ET<sub>c</sub></span>} value={latest.et0?.toFixed(2) || "--"} unit="mm/day" />
          <MetricCard icon="🌡️" label="TEMP" value={latest.temp?.toFixed(1) || "--"} unit="°C" />
          <MetricCard icon="💨" label="HUM" value={latest.humidity?.toFixed(0) || "--"} unit="%" />
          <MetricCard icon="🌪️" label="WIND" value={latest.wind?.toFixed(1) || "--"} unit="m/s" />
          <MetricCard icon="☀️" label="SOLAR" value={latest.solar?.toFixed(0) || "--"} unit="W/m²" />
          <NextIrrigationCard latest={latest} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
