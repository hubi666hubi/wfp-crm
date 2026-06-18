import React, { useRef, useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceArea,
  ReferenceLine,
  Bar,
  Line,
  LabelList,
} from "recharts";
import {
  Target,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  CheckCircle2,
  Save,
  X,
  History,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toPng } from 'html-to-image';
import { toast } from "sonner";
import { useVslStore } from "../../store/vslStore";

import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

interface ConversionData {
  date: string;
  conversions: number;
  facebook?: number;
  linkedin?: number;
  direct?: number;
}

interface Props {
  data: ConversionData[];
}

interface AnomalyLog {
  id: string;
  userId: string;
  date: string;
  conversions: number;
  timestamp: string;
  note?: string;
  tag?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const current = payload.find(
      (p: any) => p.dataKey === "conversions" || p.name?.includes("konwersji"),
    );
    const prev = payload.find(
      (p: any) =>
        p.dataKey === "prevMonthConversions" || p.name?.includes("Poprzedni"),
    );

    return (
      <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg shadow-xl shadow-black/50 text-sm min-w-[220px]">
        <p className="text-neutral-400 font-medium mb-3 pb-2 border-b border-neutral-800">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const isCVR = entry.name?.includes("CVR") || false;
            const val = isCVR
              ? `${Number(entry.value).toFixed(1)}%`
              : entry.value;

            const showComparison =
              entry.dataKey === "conversions" && prev && current;
            let diff = 0;
            let diffPercent = 0;
            if (showComparison) {
              diff = current.value - prev.value;
              diffPercent = prev.value === 0 ? 0 : (diff / prev.value) * 100;
            }

            return (
              <div key={`item-${index}`} className="flex flex-col">
                <div className="flex justify-between items-center text-xs">
                  <span
                    style={{ color: entry.color || "#ccc" }}
                    className="font-medium mr-4"
                  >
                    {entry.name}:
                  </span>
                  <span className="text-white font-bold">{val}</span>
                </div>
                {showComparison && (
                  <div className="flex justify-end mt-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        diff >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff} ({diff >= 0 ? "+" : ""}
                      {diffPercent.toFixed(1)}%) vs Poprzedni okres
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function CampaignConversionChart({ data: originalData }: Props) {
  const [dateRange, setDateRange] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [frozenData, setFrozenData] = useState<ConversionData[]>([]);

  const data = React.useMemo(() => {
    const sourceData = autoRefresh ? originalData : frozenData;
    if (!sourceData) return [];
    return sourceData.slice(-dateRange);
  }, [originalData, frozenData, autoRefresh, dateRange]);

  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPrevMonth, setShowPrevMonth] = useState(true);
  const [showRegressionLine, setShowRegressionLine] = useState(false);
  const [showCorrelation, setShowCorrelation] = useState(false);
  const [showExternalTraffic, setShowExternalTraffic] = useState(false);
  const [showBullish, setShowBullish] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [aov, setAov] = useState(150);
  const [dailyBudget, setDailyBudget] = useState(500);
  const [annotationModal, setAnnotationModal] = useState<{
    isOpen: boolean;
    date: string;
    note: string;
    isDrop: boolean;
  } | null>(null);

  const [anomalyThreshold, setAnomalyThreshold] = useState(30);
  const [anomaliesStatus, setAnomaliesStatus] = useState<
    Record<string, "ignored" | "reported">
  >({});
  const [activeAnomaly, setActiveAnomaly] = useState<{
    date: string;
    cx: number;
    cy: number;
  } | null>(null);
  const [anomalyNote, setAnomalyNote] = useState("");
  const [anomalyTag, setAnomalyTag] = useState("");
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [anomalyLogs, setAnomalyLogs] = useState<AnomalyLog[]>([]);
  const notifiedAnomalies = useRef<Set<string>>(new Set());
  const [manualAnnotations, setManualAnnotations] = useState<
    { date: string; note: string }[]
  >([]);

  useEffect(() => {
    if (!auth.currentUser || !showLogsModal) return;
    const q = query(
      collection(db, "anomaly_logs"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAnomalyLogs(logs);
    });
    return () => unsub();
  }, [showLogsModal]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(
      doc(db, "anomalies", auth.currentUser.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setAnomaliesStatus(snapshot.data().statusMap || {});
        }
      },
    );
    return () => unsub();
  }, []);

  const anomalyDatesString = React.useMemo(() => {
    if (!data || data.length === 0) return "";
    return data
      .filter((item, index) => {
        if (index > 0) {
          const prev = data[index - 1].conversions;
          if (
            prev > 0 &&
            item.conversions <= prev * (1 - anomalyThreshold / 100)
          ) {
            return true;
          }
        }
        return false;
      })
      .map((item) => item.date)
      .join(",");
  }, [data, anomalyThreshold]);

  const anomalySpikeDatesString = React.useMemo(() => {
    if (!data || data.length === 0) return "";
    return data
      .filter((item, index) => {
        if (index > 0) {
          const prev = data[index - 1].conversions;
          if (
            prev > 0 &&
            item.conversions >= prev * (1 + anomalyThreshold / 100)
          ) {
            return true;
          }
        }
        return false;
      })
      .map((item) => item.date)
      .join(",");
  }, [data, anomalyThreshold]);

  useEffect(() => {
    if (!anomalyDatesString) return;
    const dates = anomalyDatesString.split(",");
    dates.forEach((date) => {
      if (
        !anomaliesStatus[date] &&
        !notifiedAnomalies.current.has(`drop-${date}`)
      ) {
        notifiedAnomalies.current.add(`drop-${date}`);
        toast.error("Wykryto nową anomalię", {
          description: `Zanotowano znaczący spadek (>${anomalyThreshold}%) dnia ${date}.`,
          icon: <AlertTriangle className="text-red-500" size={16} />,
          duration: 5000,
        });
      }
    });
  }, [anomalyDatesString, anomaliesStatus, anomalyThreshold]);

  useEffect(() => {
    if (!anomalySpikeDatesString) return;
    const dates = anomalySpikeDatesString.split(",");
    dates.forEach((date) => {
      if (
        !anomaliesStatus[date] &&
        !notifiedAnomalies.current.has(`spike-${date}`)
      ) {
        notifiedAnomalies.current.add(`spike-${date}`);
        toast.success("Wykryto skok konwersji!", {
          description: `Zanotowano wzrost (>${anomalyThreshold}%) dnia ${date}.`,
          icon: <TrendingUp className="text-emerald-500" size={16} />,
          duration: 5000,
        });
      }
    });
  }, [anomalySpikeDatesString, anomaliesStatus, anomalyThreshold]);

  const handleAnomalyAction = async (action: "ignored" | "reported") => {
    if (!auth.currentUser || !activeAnomaly) return;
    try {
      const newMap = { ...anomaliesStatus, [activeAnomaly.date]: action };
      await setDoc(
        doc(db, "anomalies", auth.currentUser.uid),
        { statusMap: newMap },
        { merge: true },
      );
      setActiveAnomaly(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogAnomaly = async () => {
    if (!auth.currentUser || !activeAnomaly) return;
    try {
      const anomalyData = data.find((item) => item.date === activeAnomaly.date);
      await addDoc(collection(db, "anomaly_logs"), {
        userId: auth.currentUser.uid,
        date: activeAnomaly.date,
        conversions: anomalyData?.conversions || 0,
        timestamp: new Date().toISOString(),
        note: anomalyNote,
        tag: anomalyTag,
      });
      setActiveAnomaly(null);
      setAnomalyNote("");
      setAnomalyTag("");
    } catch (error) {
      console.error("Błąd podczas zapisywania logu:", error);
    }
  };

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    try {
      const headers = ["Data", "Liczba konwersji"];
      const rows = data.map((item) => `${item.date},${item.conversions}`);
      const csvContent = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "trendy-konwersji.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Błąd podczas eksportu do CSV:", error);
    }
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#171717",
        pixelRatio: 2,
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      const chartWidth = pdfWidth - 2 * margin;
      const chartHeight = (imgProps.height * chartWidth) / imgProps.width;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(40, 44, 52);
      pdf.text("Raport: Trendy konwersji", margin, 20);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Wygenerowano: ${new Date().toLocaleString("pl-PL")}`,
        margin,
        28,
      );

      pdf.addImage(dataUrl, "PNG", margin, 35, chartWidth, chartHeight);

      let startY = 35 + chartHeight + 15;

      const totalConversions = data.reduce(
        (acc, curr) => acc + curr.conversions,
        0,
      );
      const averageConversions = (totalConversions / data.length).toFixed(2);

      let maxDrop = 0;
      let maxDropDate = "";
      let peakConversions = 0;
      let peakDate = "";

      for (let i = 1; i < data.length; i++) {
        const drop = data[i - 1].conversions - data[i].conversions;
        if (drop > maxDrop) {
          maxDrop = drop;
          maxDropDate = data[i].date;
        }
        if (data[i].conversions > peakConversions) {
          peakConversions = data[i].conversions;
          peakDate = data[i].date;
        }
      }

      // Check the first element for peak
      if (data[0] && data[0].conversions > peakConversions) {
        peakConversions = data[0].conversions;
        peakDate = data[0].date;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(40, 44, 52);
      pdf.text("Podsumowanie kluczowych metryk", margin, startY);

      const metricsData = [
        ["Calkowita liczba konwersji", String(totalConversions)],
        ["Srednia dzienna", String(averageConversions)],
        [
          "Najwiekszy spadek",
          maxDrop > 0 ? `${maxDrop} (dnia: ${maxDropDate})` : "Brak spadek",
        ],
        [
          "Najlepszy dzien (szczyt)",
          peakConversions > 0
            ? `${peakConversions} (dnia: ${peakDate})`
            : "Brak danych",
        ],
      ];

      startY += 8;

      (pdf as any).autoTable({
        startY: startY,
        head: [["Metryka", "Wartość"]],
        body: metricsData,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
        margin: { left: margin, right: margin },
      });

      startY = (pdf as any).lastAutoTable.finalY + 15;

      pdf.setFontSize(16);
      pdf.text("Szczegolowe dane dzienne", margin, startY);

      startY += 8;

      const tableData = data.map((item) => [
        item.date,
        String(item.conversions),
      ]);

      (pdf as any).autoTable({
        startY: startY,
        head: [["Data", "Liczba konwersji"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { left: margin, right: margin },
      });

      pdf.save(
        `Raport_Konwersji_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Błąd podczas eksportu do PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data || data.length === 0) return null;

  const processedData = data.map((item, index) => {
    let isAnomalyDrop = false;
    let isAnomalySpike = false;
    if (index > 0) {
      const prev = data[index - 1].conversions;
      const curr = item.conversions;
      if (prev > 0) {
        if (curr <= prev * (1 - anomalyThreshold / 100)) {
          isAnomalyDrop = true;
        } else if (curr >= prev * (1 + anomalyThreshold / 100)) {
          isAnomalySpike = true;
        }
      }
    }
    const pseudoRandomOffset = (index % 5) * 4 - 8;
    const prevMonthConversions = Math.max(
      0,
      item.conversions + pseudoRandomOffset,
    );

    // Funnel CVR per stage
    const baseCvr = 30 + (index % 7) * 2;
    const stageAwareness = baseCvr + ((index * 3) % 5);
    const stageConsideration = baseCvr * 0.6 + ((index * 7) % 4);
    const stageAction = baseCvr * 0.3 + ((index * 11) % 3);
    const traffic = item.conversions * 12 + ((index * 23) % 150) + 200;
    const externalTraffic = item.conversions * 15 + ((index * 37) % 300) + 500;

    return {
      ...item,
      isAnomalyDrop,
      isAnomalySpike,
      prevMonthConversions,
      stageAwareness,
      stageConsideration,
      stageAction,
      isPeak: false,
      traffic,
      externalTraffic,
    };
  });

  const xMean =
    processedData.reduce((acc, curr) => acc + curr.conversions, 0) /
    processedData.length;
  const yMean =
    processedData.reduce((acc, curr) => acc + curr.prevMonthConversions, 0) /
    processedData.length;
  const trafficMean =
    processedData.reduce((acc, curr) => acc + curr.traffic, 0) /
    processedData.length;

  processedData.forEach((item, index) => {
    if (index > 0 && index < processedData.length - 1) {
      const prev = processedData[index - 1].conversions;
      const curr = item.conversions;
      const next = processedData[index + 1].conversions;
      if (curr > prev && curr > next && curr > xMean * 1.1) {
        item.isPeak = true;
      }
    }
  });

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  let trafficNumerator = 0;
  let trafficDenom2 = 0;

  for (let i = 0; i < processedData.length; i++) {
    const xDiff = processedData[i].conversions - xMean;
    const yDiff = processedData[i].prevMonthConversions - yMean;
    const tDiff = processedData[i].traffic - trafficMean;
    numerator += xDiff * yDiff;
    denom1 += xDiff * xDiff;
    denom2 += yDiff * yDiff;
    trafficNumerator += xDiff * tDiff;
    trafficDenom2 += tDiff * tDiff;
  }

  const correlation =
    Math.sqrt(denom1 * denom2) === 0
      ? 0
      : numerator / Math.sqrt(denom1 * denom2);
  const trafficCorrelation =
    Math.sqrt(denom1 * trafficDenom2) === 0
      ? 0
      : trafficNumerator / Math.sqrt(denom1 * trafficDenom2);

  const calculateWeeklyDelta = () => {
    const last7Days = originalData.slice(-7);
    const prev7Days = originalData.slice(-14, -7);
    const last7DaysTotal = last7Days.reduce(
      (acc, curr) => acc + curr.conversions,
      0,
    );
    const prev7DaysTotal = prev7Days.reduce(
      (acc, curr) => acc + curr.conversions,
      0,
    );
    const popChange =
      prev7DaysTotal === 0
        ? 0
        : ((last7DaysTotal - prev7DaysTotal) / prev7DaysTotal) * 100;
    return { popChange, hasEnoughData: prev7Days.length === 7 };
  };

  const { popChange, hasEnoughData } = calculateWeeklyDelta();

  const upTrends: { start: string; end: string }[] = [];
  let currentTrendStart = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i].conversions > data[i - 1].conversions) {
      if (currentTrendStart === -1) {
        currentTrendStart = i - 1;
      }
    } else {
      if (currentTrendStart !== -1) {
        if (i - currentTrendStart >= 3) {
          upTrends.push({
            start: data[currentTrendStart].date,
            end: data[i - 1].date,
          });
        }
        currentTrendStart = -1;
      }
    }
  }
  if (currentTrendStart !== -1 && data.length - currentTrendStart >= 3) {
    upTrends.push({
      start: data[currentTrendStart].date,
      end: data[data.length - 1].date,
    });
  }

  const finalChartData: Array<{
    date: string;
    conversions?: number;
    isAnomalyDrop?: boolean;
    isAnomalySpike?: boolean;
    isPeak?: boolean;
    prevMonthConversions?: number;
    projectedConversions?: number;
    isProjection?: boolean;
    stageAwareness?: number;
    stageConsideration?: number;
    stageAction?: number;
    regressionValue?: number;
    traffic?: number;
    externalTraffic?: number;
    movingAverage?: number;
    roas?: number;
    cpa?: number;
    revenue?: number;
  }> = processedData.map((item, index) => {
    let movingAverage: number | undefined;
    if (index >= 6) {
      let sum = 0;
      for (let i = index - 6; i <= index; i++) {
        sum += processedData[i].conversions;
      }
      movingAverage = Number((sum / 7).toFixed(1));
    }
    const revenue = item.conversions * aov;
    const roas = Number((revenue / dailyBudget).toFixed(2));
    const cpa =
      item.conversions > 0
        ? Number((dailyBudget / item.conversions).toFixed(2))
        : dailyBudget;
    return { ...item, movingAverage, roas, cpa, revenue };
  });
  if (processedData.length > 0) {
    const recent = processedData.slice(-7);
    const n = recent.length;
    if (n >= 2) {
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;
      recent.forEach((pt, i) => {
        sumX += i;
        sumY += pt.conversions;
        sumXY += i * pt.conversions;
        sumX2 += i * i;
      });
      const slope =
        n * sumX2 - sumX * sumX === 0
          ? 0
          : (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const lastPoint = finalChartData[finalChartData.length - 1];
      const lastValue = lastPoint.conversions;
      const lastDate = new Date(lastPoint.date);

      finalChartData[finalChartData.length - 1] = {
        ...lastPoint,
        projectedConversions: showForecast ? lastValue : undefined,
      };

      if (showForecast) {
        for (let i = 1; i <= 7; i++) {
          const nextDate = new Date(lastDate);
          nextDate.setDate(lastDate.getDate() + i);
          const projectedVal = Math.max(0, Math.round(lastValue + slope * i));
          finalChartData.push({
            date: nextDate.toISOString().split("T")[0],
            projectedConversions: projectedVal,
            isProjection: true,
          });
        }
      }
    }
  }

  if (processedData.length >= 2) {
    let globalSumX = 0,
      globalSumY = 0,
      globalSumXY = 0,
      globalSumX2 = 0;
    const gn = processedData.length;
    processedData.forEach((pt, i) => {
      globalSumX += i;
      globalSumY += pt.conversions;
      globalSumXY += i * pt.conversions;
      globalSumX2 += i * i;
    });
    const denom = gn * globalSumX2 - globalSumX * globalSumX;
    const globalSlope =
      denom === 0 ? 0 : (gn * globalSumXY - globalSumX * globalSumY) / denom;
    const globalIntercept = (globalSumY - globalSlope * globalSumX) / gn;

    finalChartData.forEach((pt, i) => {
      pt.regressionValue = Math.max(
        0,
        Math.round(globalIntercept + globalSlope * i),
      );
    });
  }

  const weekendPeriods: Array<{ start: string; end: string }> = [];
  let currentWeekend: { start: string; end: string } | null = null;

  finalChartData.forEach((d) => {
    if (!d.date) return;
    const dateObj = new Date(d.date);
    const day = dateObj.getDay();
    if (day === 0 || day === 6) {
      // Sunday or Saturday
      if (!currentWeekend) {
        currentWeekend = { start: d.date, end: d.date };
      } else {
        currentWeekend.end = d.date;
      }
    } else {
      if (currentWeekend) {
        weekendPeriods.push(currentWeekend);
        currentWeekend = null;
      }
    }
  });
  if (currentWeekend) {
    weekendPeriods.push(currentWeekend);
  }

  const customDot = (props: {
    cx?: number;
    cy?: number;
    payload?: {
      isAnomalyDrop?: boolean;
      isAnomalySpike?: boolean;
      isPeak?: boolean;
      date?: string;
    };
    value?: number;
  }) => {
    const { cx, cy, payload } = props;
    if (payload?.isAnomalyDrop && payload.date) {
      const status = anomaliesStatus[payload.date];
      const isHandled = !!status;
      const fillColor =
        status === "reported"
          ? "#f59e0b"
          : status === "ignored"
            ? "#6b7280"
            : "#ef4444";
      const labelText =
        status === "reported"
          ? "Zgłoszono błąd"
          : status === "ignored"
            ? "Zignorowano"
            : `Anomalia (>${anomalyThreshold}%)`;

      return (
        <g
          key={`dot-${payload.date}`}
          onClick={(e) => {
            e.stopPropagation();
            if (cx !== undefined && cy !== undefined && !isHandled) {
              setActiveAnomaly({ date: payload.date, cx, cy });
            }
          }}
          className={!isHandled ? "cursor-pointer" : ""}
        >
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={fillColor}
            stroke="#171717"
            strokeWidth={2}
          />
          {(!activeAnomaly || activeAnomaly.date !== payload.date) && (
            <text
              x={cx}
              y={(cy || 0) - 15}
              textAnchor="middle"
              fill={fillColor}
              fontSize={11}
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              {labelText}
            </text>
          )}
        </g>
      );
    }

    if (payload?.isAnomalySpike && payload.date) {
      return (
        <g key={`dot-spike-${payload.date}`} className="pointer-events-none">
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#10b981"
            stroke="#171717"
            strokeWidth={2}
          />
          <text
            x={cx}
            y={(cy || 0) - 15}
            textAnchor="middle"
            fill="#10b981"
            fontSize={11}
            fontWeight="bold"
          >
            Spike!
          </text>
        </g>
      );
    }

    if (payload?.isPeak && payload.date) {
      return (
        <g key={`dot-peak-${payload.date}`} className="pointer-events-none">
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#a855f7"
            stroke="#171717"
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="transparent"
            stroke="#a855f7"
            strokeWidth={1}
            strokeDasharray="2 2"
            className="animate-[spin_4s_linear_infinite]"
          />
          <text
            x={cx}
            y={(cy || 0) - 20}
            textAnchor="middle"
            fill="#a855f7"
            fontSize={11}
            fontWeight="bold"
          >
            Szczyt
          </text>
        </g>
      );
    }

    return (
      <g
        key={`dot-value-${payload?.date || `${cx}-${cy}`}`}
        className="pointer-events-none"
      >
        <text
          x={cx}
          y={(cy || 0) - 10}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={10}
        >
          {props.value}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={chartRef}
      className="CampaignConversionChart bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-6 shadow-xl relative z-10 transition-all duration-300 overflow-visible"
      id="center"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Target size={18} className="text-emerald-500" />
            Trendy Konwersji
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="ml-2 bg-neutral-800 border-none text-xs text-neutral-300 rounded focus:ring-1 focus:ring-emerald-500 py-1 pl-2 pr-6 cursor-pointer"
            >
              <option value={7}>Ostatnie 7 dni</option>
              <option value={30}>Ostatnie 30 dni</option>
              <option value={90}>Ostatnie 90 dni</option>
            </select>
            {showPrevMonth && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-2">
                Korelacja m/m: {correlation > 0 ? "+" : ""}
                {correlation.toFixed(2)}
              </span>
            )}
            {showCorrelation && (
              <span
                className="text-xs font-normal text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full ml-2"
                title="Współczynnik korelacji między konwersjami a ruchem (Pearson)"
              >
                Korelacja (ruch): {trafficCorrelation > 0 ? "+" : ""}
                {trafficCorrelation.toFixed(2)}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-bold text-white">
              {data.reduce((acc, curr) => acc + curr.conversions, 0)}
            </span>
            {hasEnoughData && (
              <span
                className={`group relative text-sm font-medium pr-2 pl-0.5 py-0.5 rounded-full flex items-center gap-1.5 cursor-default ${popChange >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}
              >
                <span
                  className={`p-1 rounded-full text-white ${popChange > 0 ? "bg-emerald-500" : popChange < 0 ? "bg-rose-500" : "bg-neutral-500"}`}
                >
                  {popChange > 0 ? (
                    <TrendingUp size={12} />
                  ) : popChange < 0 ? (
                    <TrendingDown size={12} />
                  ) : (
                    <Minus size={12} />
                  )}
                </span>
                {Math.abs(popChange).toFixed(1)}% t/t
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] text-center px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Porównanie ostatnich 7 dni do poprzedniego tygodnia
                </div>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400">
              Czułość anomalii:
            </label>
            <select
              value={anomalyThreshold}
              onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
              className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value={10}>10% spadku</option>
              <option value={20}>20% spadku</option>
              <option value={30}>30% spadku</option>
              <option value={40}>40% spadku</option>
              <option value={50}>50% spadku</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showPrevMonth}
              onChange={(e) => setShowPrevMonth(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Porównaj z poprz. okresem
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showRegressionLine}
              onChange={(e) => setShowRegressionLine(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Linia regresji
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showCorrelation}
              onChange={(e) => setShowCorrelation(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Korelacja (Ruch)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showExternalTraffic}
              onChange={(e) => setShowExternalTraffic(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Ruch zewnętrzny
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showDataLabels}
              onChange={(e) => setShowDataLabels(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Etykiety danych
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showBullish}
              onChange={(e) => setShowBullish(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Bullish Segments
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showForecast}
              onChange={(e) => setShowForecast(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Prognoza (7 dni)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={(e) => setShowMovingAverage(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Średnia (7 dni)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 font-medium whitespace-nowrap hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              checked={showSources}
              onChange={(e) => setShowSources(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-neutral-900 h-4 w-4 cursor-pointer"
            />
            Źródła ruchu (Social)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (autoRefresh) {
                  setFrozenData(originalData || []);
                }
                setAutoRefresh(!autoRefresh);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${autoRefresh ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400"}`}
              title="Automatyczne odświeżanie w czasie rzeczywistym"
            >
              <RefreshCw
                size={14}
                className={
                  autoRefresh ? "text-emerald-400" : "text-neutral-500"
                }
              />
              {autoRefresh ? "Live" : "Wstrzymano"}
            </button>
            <button
              onClick={() => setShowLogsModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition"
            >
              <History size={14} />
              Historia anomalii
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition"
            >
              <FileSpreadsheet size={14} />
              Eksportuj CSV
            </button>
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? "Eksportowanie..." : "Eksportuj PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 bg-neutral-950/50 border border-neutral-800/80 p-3 rounded-lg overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max">
          <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            AOV (Wartość Zam.)
          </label>
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
            <span className="text-neutral-500 px-2 text-xs">$</span>
            <input
              type="number"
              value={aov}
              onChange={(e) => setAov(Number(e.target.value))}
              className="w-16 bg-transparent border-none px-1 py-1.5 text-sm text-white focus:ring-0 outline-none"
            />
          </div>
        </div>

        <div className="w-px h-6 bg-neutral-800"></div>

        <div className="flex items-center gap-3 min-w-max">
          <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            Dzienny Budżet Ad
          </label>
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
            <span className="text-neutral-500 px-2 text-xs">$</span>
            <input
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              className="w-16 bg-transparent border-none px-1 py-1.5 text-sm text-white focus:ring-0 outline-none"
            />
          </div>
        </div>

        {finalChartData.length > 0 && (
          <div className="flex items-center ml-auto gap-6 pr-2">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                Średni ROAS
              </span>
              <span className="text-base font-bold text-emerald-400">
                {(
                  finalChartData.reduce(
                    (curr, acc) => curr + (acc.roas || 0),
                    0,
                  ) / finalChartData.length
                ).toFixed(2)}
                x
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                Średnie CPA
              </span>
              <span className="text-base font-bold text-indigo-400">
                $
                {(
                  finalChartData.reduce(
                    (curr, acc) => curr + (acc.cpa || 0),
                    0,
                  ) / finalChartData.length
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="h-[300px] w-full mt-2 relative">
        {activeAnomaly && (
          <div
            className="absolute z-50 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-xl w-[220px] overflow-hidden"
            style={{
              left: activeAnomaly.cx,
              top: activeAnomaly.cy - 15,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-neutral-800/50 px-3 py-2 border-b border-neutral-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                Szczegóły anomalii
              </span>
              <button
                onClick={() => {
                  setActiveAnomaly(null);
                  setAnomalyNote("");
                }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <div className="mb-1 px-1">
                <label className="text-[10px] text-neutral-400 mb-1 block">
                  Typ zdarzenia
                </label>
                <select
                  value={anomalyTag}
                  onChange={(e) => setAnomalyTag(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded p-1.5 focus:ring-1 focus:ring-emerald-500 outline-none mb-2"
                >
                  <option value="">Wybierz kategorię...</option>
                  <option value="Awaria techniczna">Awaria techniczna</option>
                  <option value="Kampania marketingowa">
                    Kampania marketingowa
                  </option>
                  <option value="Błąd śledzenia">Błąd śledzenia</option>
                  <option value="Sezonowość">Sezonowość</option>
                  <option value="Inne">Inne</option>
                </select>
                <label className="text-[10px] text-neutral-400 mb-1 block">
                  Notatka do zdarzenia
                </label>
                <textarea
                  value={anomalyNote}
                  onChange={(e) => setAnomalyNote(e.target.value)}
                  placeholder="np. awaria serwera, błąd śledzenia..."
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded p-1.5 focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-[50px] placeholder-neutral-500"
                />
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 mb-1 px-1">
                Szybkie akcje
              </p>
              <button
                onClick={handleLogAnomaly}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded transition text-left"
              >
                <Save size={14} className="text-indigo-400" />
                Zapisz do logów
              </button>
              <button
                onClick={() => {
                  /* placeholder */
                  setActiveAnomaly(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded transition text-left"
              >
                <FileText size={14} className="text-cyan-400" />
                Pokaż logi
              </button>
              <button
                onClick={() => handleAnomalyAction("ignored")}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white rounded transition text-left"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                Zatwierdź
              </button>
              <button
                onClick={() => handleAnomalyAction("reported")}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium bg-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded transition text-left"
              >
                <AlertTriangle size={14} />
                Zgłoś błąd
              </button>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={finalChartData}
            margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                const clickedDate = String(e.activeLabel);
                const clickedData = finalChartData.find(
                  (d) => d.date === clickedDate,
                );
                const existingNote = manualAnnotations.find(
                  (a) => a.date === clickedDate,
                );

                if (
                  !existingNote &&
                  (clickedData?.isAnomalyDrop || clickedData?.isAnomalySpike)
                ) {
                  const autoNote = clickedData.isAnomalyDrop
                    ? "Spadek konwersji - do analizy"
                    : "Wzrost konwersji - optymalizacja działa";
                  setManualAnnotations((prev) => [
                    ...prev,
                    { date: clickedDate, note: autoNote },
                  ]);
                  toast.success(
                    `Automatycznie przypięto notatkę dla ${clickedDate}`,
                  );
                }

                setAnnotationModal({
                  isOpen: true,
                  date: clickedDate,
                  note: existingNote?.note || "",
                  isDrop: !!clickedData?.isAnomalyDrop,
                });
              }
            }}
          >
            {manualAnnotations.map((annotation) => (
              <ReferenceLine
                yAxisId="left"
                key={`annotation-${annotation.date}`}
                x={annotation.date}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label={{
                  position: "insideTopLeft",
                  value: annotation.note,
                  fill: "#60a5fa",
                  fontSize: 11,
                }}
              />
            ))}
            <defs>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrevMonth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
              tickMargin={10}
              minTickGap={30}
              label={{
                value: "Data",
                position: "insideBottom",
                offset: -15,
                fill: "#999",
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="left"
              stroke="#666"
              tick={{ fill: "#666", fontSize: 12 }}
              domain={["auto", "auto"]}
              tickMargin={10}
              label={{
                value: "Liczba konwersji",
                angle: -90,
                position: "insideLeft",
                offset: -10,
                fill: "#999",
                fontSize: 12,
                style: { textAnchor: "middle" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#666"
              tick={{ fill: "#666", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              tickMargin={10}
              label={{
                value: "CVR (%)",
                angle: 90,
                position: "insideRight",
                offset: -10,
                fill: "#999",
                fontSize: 12,
                style: { textAnchor: "middle" },
              }}
            />
            <YAxis yAxisId="traffic" orientation="right" hide={true} />
            <Tooltip content={<CustomTooltip />} />
            {weekendPeriods.map((period, idx) => (
              <ReferenceArea
                yAxisId="left"
                key={`weekend-${idx}`}
                x1={period.start}
                x2={period.end}
                strokeOpacity={0}
                fill="#3b82f6"
                fillOpacity={0.05}
              />
            ))}
            {showBullish &&
              upTrends.map((trend, idx) => (
                <ReferenceArea
                  yAxisId="left"
                  key={`uptrend-${idx}`}
                  x1={trend.start}
                  x2={trend.end}
                  strokeOpacity={0.3}
                  fill="#10b981"
                  fillOpacity={0.1}
                  label={{
                    position: "top",
                    value: "Trend wzrostowy (Bullish)",
                    fill: "#10b981",
                    fontSize: 11,
                    fontWeight: "bold",
                  }}
                />
              ))}
            {finalChartData.map((d, idx) => {
              const elements = [];
              if (d.isAnomalyDrop && idx > 0) {
                elements.push(
                  <React.Fragment key={`anomaly-group-${d.date}`}>
                    <ReferenceArea
                      yAxisId="left"
                      x1={finalChartData[idx - 1].date}
                      x2={d.date}
                      strokeOpacity={0}
                      fill="#ef4444"
                      fillOpacity={0.15}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      x={d.date}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: "Spadek!",
                        position: "insideTopRight",
                        fill: "#ef4444",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                  </React.Fragment>,
                );
              }
              if (d.isAnomalySpike && idx > 0) {
                elements.push(
                  <React.Fragment key={`spike-group-${d.date}`}>
                    <ReferenceArea
                      yAxisId="left"
                      x1={finalChartData[idx - 1].date}
                      x2={d.date}
                      strokeOpacity={0}
                      fill="#10b981"
                      fillOpacity={0.15}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      x={d.date}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: "Skok!",
                        position: "insideTopRight",
                        fill: "#10b981",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                  </React.Fragment>,
                );
              }
              return elements.length > 0 ? elements : null;
            })}

            <Bar
              yAxisId="right"
              dataKey="stageAwareness"
              stackId="a"
              fill="#3b82f6"
              fillOpacity={0.2}
              name="Świadomość (CVR)"
            />
            <Bar
              yAxisId="right"
              dataKey="stageConsideration"
              stackId="a"
              fill="#8b5cf6"
              fillOpacity={0.2}
              name="Rozważanie (CVR)"
            />
            <Bar
              yAxisId="right"
              dataKey="stageAction"
              stackId="a"
              fill="#ec4899"
              fillOpacity={0.2}
              name="Akcja (CVR)"
              radius={[4, 4, 0, 0]}
            />

            {showPrevMonth && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="prevMonthConversions"
                name="Poprzedni okres"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorPrevMonth)"
                activeDot={{
                  r: 4,
                  fill: "#6366f1",
                  stroke: "#171717",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
            {showSources ? (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="facebook"
                  name="Facebook"
                  stackId="sources"
                  fill="#1877F2"
                  isAnimationActive={false}
                />
                <Bar
                  yAxisId="left"
                  dataKey="linkedin"
                  name="LinkedIn"
                  stackId="sources"
                  fill="#0A66C2"
                  isAnimationActive={false}
                />
                <Bar
                  yAxisId="left"
                  dataKey="direct"
                  name="Bezpośrednie/Inne"
                  stackId="sources"
                  fill="#64748b"
                  isAnimationActive={false}
                >
                  {showDataLabels && (
                    <LabelList
                      dataKey="conversions"
                      position="top"
                      fill="#9ca3af"
                      fontSize={10}
                    />
                  )}
                </Bar>
              </>
            ) : (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="conversions"
                name="Konwersje"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConversions)"
                activeDot={{
                  r: 6,
                  fill: "#10b981",
                  stroke: "#171717",
                  strokeWidth: 2,
                }}
                dot={customDot as unknown as React.ReactElement}
                isAnimationActive={false}
              >
                {showDataLabels && (
                  <LabelList
                    dataKey="conversions"
                    position="top"
                    fill="#9ca3af"
                    fontSize={10}
                  />
                )}
              </Area>
            )}
            {showForecast && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="projectedConversions"
                name="Prognoza (7 dni)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
                fill="none"
                activeDot={{
                  r: 4,
                  fill: "#f59e0b",
                  stroke: "#171717",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
            {showRegressionLine && (
              <Line
                yAxisId="left"
                type="linear"
                dataKey="regressionValue"
                name="Trend długoterminowy"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
            )}
            {showMovingAverage && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="movingAverage"
                name="Średnia 7-dniowa"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#f43f5e",
                  stroke: "#171717",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
            {showExternalTraffic && (
              <Line
                yAxisId="traffic"
                type="monotone"
                dataKey="externalTraffic"
                name="Ruch zewnętrzny"
                stroke="#d946ef"
                strokeWidth={2}
                dot={{ r: 3, fill: "#d946ef" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            )}
            {showCorrelation && (
              <Line
                yAxisId="traffic"
                type="monotone"
                dataKey="traffic"
                name="Ruch (estymacja)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#3b82f6",
                  stroke: "#171717",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {showLogsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <History size={18} className="text-indigo-400" />
                Historia zgłoszonych anomalii
              </h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {anomalyLogs.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">
                  Brak zapisanych logów.
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-rose-400">
                            {log.date}
                          </span>
                          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                            {log.conversions} konwersji
                          </span>
                          {log.tag && (
                            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                              {log.tag}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(log.timestamp).toLocaleString("pl-PL")}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-sm text-neutral-300 mt-2 bg-neutral-900/50 p-2 rounded border border-neutral-800/50">
                          <span className="text-xs font-semibold text-neutral-500 block mb-1">
                            NOTATKA
                          </span>
                          {log.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {annotationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 hover:bg-neutral-800/20 transition-colors">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                Adnotacja: {annotationModal.date}
              </h3>
              <button
                onClick={() => setAnnotationModal(null)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Zamknij"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <textarea
                value={annotationModal.note}
                onChange={(e) =>
                  setAnnotationModal({
                    ...annotationModal,
                    note: e.target.value,
                  })
                }
                className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="Wpisz treść adnotacji..."
              />
              <div className="flex justify-end gap-2">
                {annotationModal.note && (
                  <button
                    onClick={() => {
                      setManualAnnotations((prev) =>
                        prev.filter((a) => a.date !== annotationModal.date),
                      );
                      toast.success(
                        `Usunięto adnotację dla ${annotationModal.date}`,
                      );
                      setAnnotationModal(null);
                    }}
                    className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded transition-colors mr-auto"
                  >
                    Usuń
                  </button>
                )}
                <button
                  onClick={() => setAnnotationModal(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    if (annotationModal.note.trim() === "") {
                      setManualAnnotations((prev) =>
                        prev.filter((a) => a.date !== annotationModal.date),
                      );
                    } else {
                      setManualAnnotations((prev) => [
                        ...prev.filter((a) => a.date !== annotationModal.date),
                        {
                          date: annotationModal.date,
                          note: annotationModal.note,
                        },
                      ]);
                    }
                    setAnnotationModal(null);
                    toast.success("Zapisano adnotację");
                  }}
                  className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors font-medium"
                >
                  Zapisz
                </button>
              </div>

              {annotationModal.isDrop && (
                <div className="mt-2 pt-4 border-t border-rose-900/30">
                  <span className="text-xs font-semibold text-rose-500 mb-2 block uppercase tracking-wider">
                    Fix The Funnel
                  </span>
                  <button
                    onClick={() => {
                      const newTask = {
                        type: "text" as const,
                        partIndex: 0,
                        prompt: `[PIVOT] Zauważyliśmy spadek konwersji w dniu ${annotationModal.date}. Wygeneruj nowy, agresywny hook do VSL, który zniweluje obiekcje klientów i natychmiast przyciągnie uwagę zimnego ruchu. Zachowaj wysoką dynamikę i mocny call to action.`,
                        status: "pending" as const,
                        priority: 10,
                        options: { hookOnly: true },
                      };
                      useVslStore.getState().enqueueTask(newTask);
                      toast.success(
                        "🚀 Zlecenie naprawcze VSL dodane do kolejki!",
                      );
                      setAnnotationModal(null);
                    }}
                    className="w-full flex justify-center items-center gap-2 px-3 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-bold shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] border border-rose-500"
                  >
                    Zrób Pivot - Wygeneruj nowy Hook VSL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
