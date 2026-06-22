import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { toPng } from 'html-to-image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  Network,
  ThumbsUp,
  Eye,
  TrendingUp,
  Users,
  Download,
} from "lucide-react";
import { motion } from "motion/react";

const generateMockData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split("T")[0],
      fbReach: Math.floor(Math.random() * 5000) + 2000,
      fbEngagement: Math.floor(Math.random() * 500) + 100,
      fbCvr: Number((Math.random() * 2 + 1).toFixed(2)),
      fbCompetitorReach: Math.floor(Math.random() * 6000) + 1000,
      fbCompetitorEngagement: Math.floor(Math.random() * 600) + 50,
      fbCompetitorCvr: Number((Math.random() * 2 + 0.5).toFixed(2)),
      liReach: Math.floor(Math.random() * 3000) + 1000,
      liEngagement: Math.floor(Math.random() * 400) + 80,
      liCvr: Number((Math.random() * 4 + 2).toFixed(2)),
      liCompetitorReach: Math.floor(Math.random() * 4000) + 800,
      liCompetitorEngagement: Math.floor(Math.random() * 300) + 100,
      liCompetitorCvr: Number((Math.random() * 3 + 1).toFixed(2)),
      xReach: Math.floor(Math.random() * 8000) + 3000,
      xEngagement: Math.floor(Math.random() * 800) + 200,
      xCvr: Number((Math.random() * 1.5 + 0.5).toFixed(2)),
      xCompetitorReach: Math.floor(Math.random() * 9000) + 2000,
      xCompetitorEngagement: Math.floor(Math.random() * 900) + 100,
      xCompetitorCvr: Number((Math.random() * 1.5 + 0.2).toFixed(2)),
    });
  }
  return data;
};

const mockData = generateMockData();

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden"
  >
    <div
      className={`absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl`}
    />
    <dt>
      <div className="absolute rounded-md p-3 bg-neutral-950 border border-neutral-800">
        <Icon className={`h-6 w-6 ${color.split(" ")[0]}`} aria-hidden="true" />
      </div>
      <p className="ml-16 truncate text-sm font-medium text-neutral-400">
        {title}
      </p>
    </dt>
    <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
      <p className="text-2xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p
        className={`ml-2 flex items-center gap-0.5 text-sm font-semibold ${
          change >= 0 ? "text-emerald-500" : "text-rose-500"
        }`}
      >
        {change >= 0 ? "+" : ""}
        {change}%
      </p>
    </dd>
  </motion.div>
);

export function SocialMedia() {
  const [platform, setPlatform] = useState<
    "all" | "facebook" | "linkedin" | "x"
  >("all");
  const [showCompetitor, setShowCompetitor] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);
  const [cvrAlertThresholds, setCvrAlertThresholds] = useState({
    facebook: 1.5,
    linkedin: 1.5,
    x: 1.5,
  });
  const [dateRange, setDateRange] = useState<number>(30);

  const filteredData = React.useMemo(() => {
    return mockData.slice(-dateRange);
  }, [dateRange]);
  const notifiedThresholdRef = useRef<{ fb: boolean; li: boolean; x: boolean }>(
    { fb: false, li: false, x: false },
  );

  useEffect(() => {
    // Only check the most recent data point
    const latestData = filteredData[filteredData.length - 1];
    if (!latestData) return;

    if (
      (platform === "all" || platform === "facebook") &&
      latestData.fbCvr < cvrAlertThresholds.facebook
    ) {
      if (!notifiedThresholdRef.current.fb) {
        toast.error(
          `Krytyczny spadek CVR na Facebooku: ${latestData.fbCvr}% (próg: ${cvrAlertThresholds.facebook}%)`,
        );
        notifiedThresholdRef.current.fb = true;
      }
    } else {
      notifiedThresholdRef.current.fb = false;
    }

    if (
      (platform === "all" || platform === "linkedin") &&
      latestData.liCvr < cvrAlertThresholds.linkedin
    ) {
      if (!notifiedThresholdRef.current.li) {
        toast.error(
          `Krytyczny spadek CVR na LinkedIn: ${latestData.liCvr}% (próg: ${cvrAlertThresholds.linkedin}%)`,
        );
        notifiedThresholdRef.current.li = true;
      }
    } else {
      notifiedThresholdRef.current.li = false;
    }

    if (
      (platform === "all" || platform === "x") &&
      latestData.xCvr < cvrAlertThresholds.x
    ) {
      if (!notifiedThresholdRef.current.x) {
        toast.error(
          `Krytyczny spadek CVR na X (Twitter): ${latestData.xCvr}% (próg: ${cvrAlertThresholds.x}%)`,
        );
        notifiedThresholdRef.current.x = true;
      }
    } else {
      notifiedThresholdRef.current.x = false;
    }
  }, [platform, cvrAlertThresholds, filteredData]);

  const handleImportBenchmark = () => {
    setIsImporting(true);
    setTimeout(() => {
      setShowCompetitor(true);
      setIsImporting(false);
    }, 1200);
  };

  const handleExportPDF = async () => {
    if (!chartsRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(chartsRef.current, {
        backgroundColor: "#171717",
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("raport-social-media.pdf");
      toast.success("Raport wyeksportowany do PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Błąd podczas eksportu do PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Network className="text-indigo-500" size={32} />
            Analiza Social Media
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Szczegółowe monitorowanie zasięgów i zaangażowania w kanałach
            społecznościowych.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <div className="animate-spin h-4 w-4 border-2 border-neutral-400 border-t-transparent rounded-full" />
            ) : (
              <Download size={16} />
            )}
            PDF
          </button>
          <button
            onClick={handleImportBenchmark}
            disabled={isImporting || showCompetitor}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
              showCompetitor
                ? "bg-neutral-800 border-neutral-700 text-neutral-400 cursor-not-allowed"
                : "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20"
            }`}
          >
            {isImporting ? (
              <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
            ) : showCompetitor ? (
              <Network size={16} />
            ) : (
              <Network size={16} />
            )}
            {showCompetitor ? "Benchmark załadowany" : "Wczytaj benchmarki"}
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
          >
            <option value={7}>Ostatnie 7 dni</option>
            <option value={14}>Ostatnie 14 dni</option>
            <option value={30}>Ostatnie 30 dni</option>
          </select>
          <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
            {[
              { id: "all", label: "Wszystkie" },
              { id: "facebook", label: "Facebook" },
              { id: "linkedin", label: "LinkedIn" },
              { id: "x", label: "X (Twitter)" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  setPlatform(p.id as "all" | "facebook" | "linkedin" | "x")
                }
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  platform === p.id
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={chartsRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Całkowity Zasięg"
            value={425120}
            change={12.4}
            icon={Eye}
            color="text-indigo-500 from-indigo-500"
          />
          <StatCard
            title="Aktywni Obserwujący"
            value={14205}
            change={5.2}
            icon={Users}
            color="text-blue-500 from-blue-500"
          />
          <StatCard
            title="Suma Interakcji"
            value={54920}
            change={18.1}
            icon={ThumbsUp}
            color="text-rose-500 from-rose-500"
          />
          <StatCard
            title="Współczynnik (ER)"
            value="8.4%"
            change={-1.2}
            icon={TrendingUp}
            color="text-amber-500 from-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h3 className="text-lg font-medium text-white mb-6">
              Zasięg Platform (Reach)
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A66C2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0A66C2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    tick={{ fill: "#666", fontSize: 12 }}
                  />
                  <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#333",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ fontSize: 13 }}
                  />
                  <Legend />
                  {(platform === "all" || platform === "facebook") && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="fbReach"
                        name="Facebook"
                        stroke="#1877F2"
                        fillOpacity={1}
                        fill="url(#colorFb)"
                        strokeWidth={2}
                      />
                      {showCompetitor && (
                        <Area
                          type="monotone"
                          dataKey="fbCompetitorReach"
                          name="Facebook (Konkurencja)"
                          stroke="#1877F2"
                          strokeDasharray="5 5"
                          fill="none"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                  {(platform === "all" || platform === "linkedin") && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="liReach"
                        name="LinkedIn"
                        stroke="#0A66C2"
                        fillOpacity={1}
                        fill="url(#colorLi)"
                        strokeWidth={2}
                      />
                      {showCompetitor && (
                        <Area
                          type="monotone"
                          dataKey="liCompetitorReach"
                          name="LinkedIn (Konkurencja)"
                          stroke="#0A66C2"
                          strokeDasharray="5 5"
                          fill="none"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                  {(platform === "all" || platform === "x") && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="xReach"
                        name="X (Twitter)"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorX)"
                        strokeWidth={2}
                      />
                      {showCompetitor && (
                        <Area
                          type="monotone"
                          dataKey="xCompetitorReach"
                          name="X (Konkurencja)"
                          stroke="#8b5cf6"
                          strokeDasharray="5 5"
                          fill="none"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h3 className="text-lg font-medium text-white mb-6">
              Zaangażowanie (Engagement)
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    tick={{ fill: "#666", fontSize: 12 }}
                  />
                  <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#333",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ fontSize: 13 }}
                    cursor={{ fill: "#262626" }}
                  />
                  <Legend />
                  {(platform === "all" || platform === "facebook") && (
                    <>
                      <Bar
                        dataKey="fbEngagement"
                        name="Facebook"
                        stackId="fb"
                        fill="#1877F2"
                        radius={[4, 4, 0, 0]}
                      />
                      {showCompetitor && (
                        <Bar
                          dataKey="fbCompetitorEngagement"
                          name="Facebook (Konkurencja)"
                          stackId="fbComp"
                          fill="#1877F2"
                          fillOpacity={0.6}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </>
                  )}
                  {(platform === "all" || platform === "linkedin") && (
                    <>
                      <Bar
                        dataKey="liEngagement"
                        name="LinkedIn"
                        stackId="li"
                        fill="#0A66C2"
                        radius={[4, 4, 0, 0]}
                      />
                      {showCompetitor && (
                        <Bar
                          dataKey="liCompetitorEngagement"
                          name="LinkedIn (Konkurencja)"
                          stackId="liComp"
                          fill="#0A66C2"
                          fillOpacity={0.6}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </>
                  )}
                  {(platform === "all" || platform === "x") && (
                    <>
                      <Bar
                        dataKey="xEngagement"
                        name="X (Twitter)"
                        stackId="x"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                      {showCompetitor && (
                        <Bar
                          dataKey="xCompetitorEngagement"
                          name="X (Konkurencja)"
                          stackId="xComp"
                          fill="#8b5cf6"
                          fillOpacity={0.6}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h3 className="text-lg font-medium text-white">
              Współczynnik Konwersji (CVR)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-400">
                Progi alertu CVR (%):
              </span>
              <div className="flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md border border-neutral-800">
                <span className="text-xs font-semibold text-blue-500">FB</span>
                <input
                  type="number"
                  step="0.1"
                  value={cvrAlertThresholds.facebook}
                  onChange={(e) =>
                    setCvrAlertThresholds((prev) => ({
                      ...prev,
                      facebook: Number(e.target.value),
                    }))
                  }
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md border border-neutral-800">
                <span className="text-xs font-semibold text-blue-600">LI</span>
                <input
                  type="number"
                  step="0.1"
                  value={cvrAlertThresholds.linkedin}
                  onChange={(e) =>
                    setCvrAlertThresholds((prev) => ({
                      ...prev,
                      linkedin: Number(e.target.value),
                    }))
                  }
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md border border-neutral-800">
                <span className="text-xs font-semibold text-purple-500">X</span>
                <input
                  type="number"
                  step="0.1"
                  value={cvrAlertThresholds.x}
                  onChange={(e) =>
                    setCvrAlertThresholds((prev) => ({
                      ...prev,
                      x: Number(e.target.value),
                    }))
                  }
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ fontSize: 13 }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Legend />
                {(platform === "all" || platform === "facebook") && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="fbCvr"
                      name="Facebook (CVR)"
                      stroke="#1877F2"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    {showCompetitor && (
                      <Line
                        type="monotone"
                        dataKey="fbCompetitorCvr"
                        name="Facebook Konkurencja (CVR)"
                        stroke="#1877F2"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </>
                )}
                {(platform === "all" || platform === "linkedin") && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="liCvr"
                      name="LinkedIn (CVR)"
                      stroke="#0A66C2"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    {showCompetitor && (
                      <Line
                        type="monotone"
                        dataKey="liCompetitorCvr"
                        name="LinkedIn Konkurencja (CVR)"
                        stroke="#0A66C2"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </>
                )}
                {(platform === "all" || platform === "x") && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="xCvr"
                      name="X (CVR)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    {showCompetitor && (
                      <Line
                        type="monotone"
                        dataKey="xCompetitorCvr"
                        name="X Konkurencja (CVR)"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
