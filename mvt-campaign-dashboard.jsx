import { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

// ============================================================
// CONFIG — Thay SHEET_ID sau khi setup Google Ads Script
// ============================================================
const SHEET_CONFIG = {
  // Thay bằng Google Sheet ID thực tế sau khi setup
  SHEET_ID: "1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY",
  // Tab names (phải match với google-ads-script.js)
  DAILY_TAB: "DailyData",
  SUMMARY_TAB: "Summary",
  // Auto-refresh interval (milliseconds). 0 = tắt auto-refresh
  REFRESH_INTERVAL: 0, // Set 300000 for 5 min auto-refresh
};

const buildSheetUrl = (tab) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tab}`;

// ============================================================
// BENCHMARKS — Ngành Travel (AU → Vietnam)
// ============================================================
const BENCHMARKS = {
  ctr: { good: 5, warn: 3, label: "CTR (%)", unit: "%", inverse: false },
  cpc: { good: 50000, warn: 80000, label: "CPC (₫)", unit: "₫", inverse: true },
  convRate: { good: 3, warn: 1, label: "Conv Rate (%)", unit: "%", inverse: false },
  cpa: { good: 800000, warn: 1500000, label: "CPA (₫)", unit: "₫", inverse: true },
  imprShare: { good: 60, warn: 30, label: "Impr Share (%)", unit: "%", inverse: false },
};

// ============================================================
// UTILITIES
// ============================================================
const fmt = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
};

const fmtVND = (n) => (n != null && !isNaN(n) && n > 0 ? fmt(n) + "₫" : "—");
const fmtPct = (n) => (n != null && !isNaN(n) && n > 0 ? n.toFixed(2) + "%" : "—");

const parseCSV = (text) => {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  return lines.slice(1).map((line) => {
    const vals = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      let v = (vals[i] || "").replace(/"/g, "").trim();
      obj[h] = isNaN(v) || v === "" ? v : parseFloat(v);
    });
    return obj;
  });
};

const statusColor = (s) => {
  const map = {
    ENABLED: "bg-green-900/60 text-green-300 border-green-700",
    PAUSED: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
    REMOVED: "bg-red-900/60 text-red-300 border-red-700",
    active: "bg-green-900/60 text-green-300 border-green-700",
    draft: "bg-gray-800 text-gray-400 border-gray-600",
  };
  return map[s] || map.draft;
};

const kpiColor = (val, bench, inverse) => {
  if (val == null || val === 0 || !bench) return { text: "text-gray-300", bg: "bg-gray-800/50" };
  if (inverse) {
    if (val <= bench.good) return { text: "text-green-400", bg: "bg-green-950/40" };
    if (val <= bench.warn) return { text: "text-yellow-400", bg: "bg-yellow-950/40" };
    return { text: "text-red-400", bg: "bg-red-950/40" };
  }
  if (val >= bench.good) return { text: "text-green-400", bg: "bg-green-950/40" };
  if (val >= bench.warn) return { text: "text-yellow-400", bg: "bg-yellow-950/40" };
  return { text: "text-red-400", bg: "bg-red-950/40" };
};

// ============================================================
// COMPONENTS
// ============================================================
const Badge = ({ children, className = "" }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{children}</span>
);

const KpiCard = ({ label, value, displayValue, benchmark, inverse, small }) => {
  const c = kpiColor(value, benchmark, inverse);
  return (
    <div className={`${c.bg} border border-gray-700/60 rounded-xl ${small ? "p-3" : "p-4"}`}>
      <div className={`${small ? "text-[10px]" : "text-xs"} text-gray-400 uppercase tracking-wider mb-1`}>{label}</div>
      <div className={`${small ? "text-lg" : "text-2xl"} font-bold ${c.text}`}>{displayValue || "—"}</div>
      {benchmark && (
        <div className="text-[10px] text-gray-500 mt-1">
          Target: {inverse ? "<" : ">"}{" "}
          {benchmark.unit === "₫" ? fmtVND(benchmark.good) : benchmark.good + benchmark.unit}
        </div>
      )}
    </div>
  );
};

const DataSourceIndicator = ({ mode, lastUpdate, isLoading, onRefresh, onToggle }) => (
  <div className="flex items-center gap-2 text-xs">
    <button
      onClick={onToggle}
      className={`px-2 py-1 rounded-md border transition ${
        mode === "auto"
          ? "bg-green-950 border-green-700 text-green-300"
          : "bg-gray-800 border-gray-600 text-gray-400"
      }`}
    >
      {mode === "auto" ? "● Auto" : "○ Manual"}
    </button>
    {mode === "auto" && (
      <>
        <button onClick={onRefresh} disabled={isLoading} className="px-2 py-1 rounded-md bg-gray-800 border border-gray-600 text-gray-400 hover:text-white transition disabled:opacity-50">
          {isLoading ? "↻ Loading..." : "↻ Refresh"}
        </button>
        {lastUpdate && <span className="text-gray-500">Updated: {lastUpdate}</span>}
      </>
    )}
  </div>
);

const ChartCard = ({ title, children, height = 260 }) => (
  <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
    <div className="text-sm font-semibold text-gray-300 mb-3">{title}</div>
    <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
  </div>
);

const tooltipStyle = { background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 12 };

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function MVTDashboard() {
  const [mode, setMode] = useState("manual"); // "auto" | "manual"
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Data states
  const [dailyData, setDailyData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [manualCampaigns, setManualCampaigns] = useState([
    { id: "high-intent", name: "MVT - Escape - High Intent", status: "active", budget: 800000, bidding: "Maximize Clicks", data: [] },
    { id: "destination", name: "MVT - Escape - Destination", status: "draft", budget: 500000, bidding: "Maximize Clicks", data: [] },
  ]);

  const [selectedCampaign, setSelectedCampaign] = useState("__all__");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({ date: new Date().toISOString().split("T")[0], campaign: "high-intent", impressions: "", clicks: "", cost: "", conversions: "", qualityScore: "" });

  // ---- FETCH FROM GOOGLE SHEET ----
  const fetchData = useCallback(async () => {
    if (SHEET_CONFIG.SHEET_ID === "PASTE_YOUR_GOOGLE_SHEET_ID_HERE") {
      setError("Chưa cấu hình Sheet ID. Xem hướng dẫn setup bên dưới.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [dailyRes, summaryRes] = await Promise.all([
        fetch(buildSheetUrl(SHEET_CONFIG.DAILY_TAB)),
        fetch(buildSheetUrl(SHEET_CONFIG.SUMMARY_TAB)),
      ]);
      if (!dailyRes.ok || !summaryRes.ok) throw new Error("Failed to fetch sheet data");
      const [dailyCSV, summaryCSV] = await Promise.all([dailyRes.text(), summaryRes.text()]);
      setDailyData(parseCSV(dailyCSV));
      setSummaryData(parseCSV(summaryCSV));
      setLastUpdate(new Date().toLocaleTimeString("vi-VN"));
    } catch (e) {
      setError("Lỗi fetch data: " + e.message + ". Kiểm tra Sheet đã Publish to web chưa.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "auto") {
      fetchData();
      if (SHEET_CONFIG.REFRESH_INTERVAL > 0) {
        const id = setInterval(fetchData, SHEET_CONFIG.REFRESH_INTERVAL);
        return () => clearInterval(id);
      }
    }
  }, [mode, fetchData]);

  // ---- MANUAL DATA ENTRY ----
  const addManualEntry = () => {
    const entry = {
      date: manualForm.date,
      impressions: parseInt(manualForm.impressions) || 0,
      clicks: parseInt(manualForm.clicks) || 0,
      cost: parseInt(manualForm.cost) || 0,
      conversions: parseInt(manualForm.conversions) || 0,
      qualityScore: parseFloat(manualForm.qualityScore) || 0,
    };
    setManualCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== manualForm.campaign) return c;
        const idx = c.data.findIndex((d) => d.date === entry.date);
        const newData = idx >= 0 ? c.data.map((d, i) => (i === idx ? entry : d)) : [...c.data, entry];
        return { ...c, data: newData.sort((a, b) => a.date.localeCompare(b.date)) };
      })
    );
    setManualForm((p) => ({ ...p, impressions: "", clicks: "", cost: "", conversions: "", qualityScore: "" }));
  };

  // ---- COMPUTED DATA ----
  const campaigns = useMemo(() => {
    if (mode === "auto" && summaryData.length > 0) {
      return summaryData.map((s, i) => ({
        id: (s.CampaignName || "").replace(/\s+/g, "-").toLowerCase() || `camp-${i}`,
        name: s.CampaignName || `Campaign ${i + 1}`,
        status: (s.Status || "").toLowerCase().includes("enable") ? "active" : "paused",
        budget: s.Budget || 0,
        bidding: s.BiddingStrategy || "",
        impressions: s.TotalImpressions || 0,
        clicks: s.TotalClicks || 0,
        cost: s.TotalCost || 0,
        conversions: s.TotalConversions || 0,
        ctr: s.AvgCTR || 0,
        cpc: s.AvgCPC || 0,
        convRate: s.AvgConvRate || 0,
        cpa: s.AvgCPA || 0,
        imprShare: s.SearchImprShare || 0,
      }));
    }
    return manualCampaigns.map((c) => {
      const d = c.data.filter((r) => r.impressions > 0 || r.clicks > 0);
      const imp = d.reduce((s, r) => s + r.impressions, 0);
      const clk = d.reduce((s, r) => s + r.clicks, 0);
      const cst = d.reduce((s, r) => s + r.cost, 0);
      const conv = d.reduce((s, r) => s + r.conversions, 0);
      return {
        ...c,
        impressions: imp, clicks: clk, cost: cst, conversions: conv,
        ctr: imp > 0 ? (clk / imp) * 100 : 0,
        cpc: clk > 0 ? cst / clk : 0,
        convRate: clk > 0 ? (conv / clk) * 100 : 0,
        cpa: conv > 0 ? cst / conv : 0,
      };
    });
  }, [mode, summaryData, manualCampaigns]);

  const chartData = useMemo(() => {
    if (mode === "auto" && dailyData.length > 0) {
      let filtered = dailyData;
      if (selectedCampaign !== "__all__") {
        const camp = campaigns.find((c) => c.id === selectedCampaign);
        if (camp) filtered = dailyData.filter((d) => d.CampaignName === camp.name);
      }
      const byDate = {};
      filtered.forEach((r) => {
        const dt = r.Date;
        if (!byDate[dt]) byDate[dt] = { date: dt, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
        byDate[dt].impressions += r.Impressions || 0;
        byDate[dt].clicks += r.Clicks || 0;
        byDate[dt].cost += r.Cost || 0;
        byDate[dt].conversions += r.Conversions || 0;
      });
      return Object.values(byDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-parseInt(dateRange))
        .map((d) => ({
          ...d,
          dateShort: d.date.slice(5),
          ctr: d.impressions > 0 ? parseFloat(((d.clicks / d.impressions) * 100).toFixed(2)) : 0,
          cpc: d.clicks > 0 ? Math.round(d.cost / d.clicks) : 0,
          convRate: d.clicks > 0 ? parseFloat(((d.conversions / d.clicks) * 100).toFixed(2)) : 0,
        }));
    }
    // Manual mode
    const camp = selectedCampaign === "__all__" ? manualCampaigns : manualCampaigns.filter((c) => c.id === selectedCampaign);
    const byDate = {};
    camp.forEach((c) =>
      c.data.filter((r) => r.impressions > 0 || r.clicks > 0).forEach((r) => {
        if (!byDate[r.date]) byDate[r.date] = { date: r.date, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
        byDate[r.date].impressions += r.impressions;
        byDate[r.date].clicks += r.clicks;
        byDate[r.date].cost += r.cost;
        byDate[r.date].conversions += r.conversions;
      })
    );
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        dateShort: d.date.slice(5),
        ctr: d.impressions > 0 ? parseFloat(((d.clicks / d.impressions) * 100).toFixed(2)) : 0,
        cpc: d.clicks > 0 ? Math.round(d.cost / d.clicks) : 0,
        convRate: d.clicks > 0 ? parseFloat(((d.conversions / d.clicks) * 100).toFixed(2)) : 0,
      }));
  }, [mode, dailyData, manualCampaigns, selectedCampaign, campaigns, dateRange]);

  const totals = useMemo(() => {
    if (selectedCampaign === "__all__") {
      const imp = campaigns.reduce((s, c) => s + c.impressions, 0);
      const clk = campaigns.reduce((s, c) => s + c.clicks, 0);
      const cst = campaigns.reduce((s, c) => s + c.cost, 0);
      const conv = campaigns.reduce((s, c) => s + c.conversions, 0);
      return { impressions: imp, clicks: clk, cost: cst, conversions: conv, ctr: imp > 0 ? (clk / imp) * 100 : 0, cpc: clk > 0 ? cst / clk : 0, convRate: clk > 0 ? (conv / clk) * 100 : 0, cpa: conv > 0 ? cst / conv : 0 };
    }
    const c = campaigns.find((c) => c.id === selectedCampaign);
    return c || { impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0, cpc: 0, convRate: 0, cpa: 0 };
  }, [campaigns, selectedCampaign]);

  const recommendations = useMemo(() => {
    const recs = [];
    if (totals.impressions === 0) return [{ icon: "ℹ️", type: "info", text: "Chưa có dữ liệu. " + (mode === "manual" ? "Nhập data ở tab Data hoặc chuyển sang Auto mode." : "Kiểm tra Google Ads Script đã chạy chưa.") }];
    if (totals.ctr > 0 && totals.ctr < 3) recs.push({ icon: "⚠️", type: "warn", text: `CTR thấp (${totals.ctr.toFixed(2)}%). Cải thiện ad copy: thêm giá $2,099, Flights Included, urgency.` });
    else if (totals.ctr >= 5) recs.push({ icon: "✅", type: "good", text: `CTR tuyệt vời (${totals.ctr.toFixed(2)}%)! Ad copy hiệu quả.` });
    if (totals.cpc > 80000) recs.push({ icon: "⚠️", type: "warn", text: `CPC cao (${fmtVND(totals.cpc)}). Cải thiện Quality Score, thử long-tail keywords.` });
    else if (totals.cpc > 0 && totals.cpc <= 50000) recs.push({ icon: "✅", type: "good", text: `CPC tốt (${fmtVND(totals.cpc)})!` });
    if (totals.clicks > 50 && totals.convRate < 1) recs.push({ icon: "🔴", type: "bad", text: `Conv. Rate rất thấp (${totals.convRate.toFixed(2)}%). Kiểm tra landing page, form, mobile UX ngay!` });
    else if (totals.convRate >= 3) recs.push({ icon: "✅", type: "good", text: `Conv. Rate tốt (${totals.convRate.toFixed(2)}%)!` });
    if (totals.conversions >= 30 && totals.conversions < 50) recs.push({ icon: "🎯", type: "action", text: `${totals.conversions} conversions! Nên chuyển Maximize Conversions bidding.` });
    if (totals.conversions >= 50) recs.push({ icon: "🎯", type: "action", text: `${totals.conversions} conv! Chuyển Target CPA = ${fmtVND(totals.cpa)}.` });
    if (totals.cpa > 1500000) recs.push({ icon: "⚠️", type: "warn", text: `CPA quá cao (${fmtVND(totals.cpa)}). Xem lại keywords, landing page, audience targeting.` });
    if (recs.length === 0) recs.push({ icon: "ℹ️", type: "info", text: "Campaign đang ổn. Tiếp tục theo dõi hàng ngày." });
    return recs;
  }, [totals, mode]);

  const roi = useMemo(() => {
    const budget = totals.cost > 0 ? totals.cost : 800000 * 30;
    const estBookings = totals.conversions > 0 ? Math.max(1, Math.round(totals.conversions * 0.2)) : 3;
    const revenue = estBookings * 2099 * 25000;
    const roas = budget > 0 ? revenue / budget : 0;
    return { budget, estBookings, revenue, roas };
  }, [totals]);

  const recBg = { good: "border-green-800/60 bg-green-950/30", warn: "border-yellow-800/60 bg-yellow-950/30", bad: "border-red-800/60 bg-red-950/30", action: "border-blue-800/60 bg-blue-950/30", info: "border-gray-700/60 bg-gray-800/30" };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">MVT Campaign Dashboard</h1>
            <p className="text-sm text-gray-500">MyVivaTour | escape.myvivatour.com | Account: 806-163-1566</p>
          </div>
          <DataSourceIndicator
            mode={mode}
            lastUpdate={lastUpdate}
            isLoading={isLoading}
            onRefresh={fetchData}
            onToggle={() => setMode((m) => (m === "auto" ? "manual" : "auto"))}
          />
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 mb-4 text-sm text-red-300">{error}</div>
        )}

        {/* CAMPAIGN SELECTOR */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCampaign("__all__")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${selectedCampaign === "__all__" ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800/60 border-gray-700/60 text-gray-400 hover:bg-gray-700"}`}
          >
            Tất cả
          </button>
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampaign(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border flex items-center gap-2 ${selectedCampaign === c.id ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800/60 border-gray-700/60 text-gray-400 hover:bg-gray-700"}`}
            >
              {c.name.replace("MVT - Escape - ", "")}
              <Badge className={statusColor(c.status)}>{(c.status || "").toUpperCase()}</Badge>
            </button>
          ))}
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-800 mb-4 overflow-x-auto">
          {[
            { id: "overview", label: "Tổng Quan" },
            { id: "charts", label: "Biểu Đồ" },
            { id: "campaigns", label: "Campaigns" },
            { id: "roi", label: "ROI" },
            { id: "data", label: "Data" },
            { id: "guide", label: "Hướng Dẫn" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${activeTab === t.id ? "text-blue-400 border-blue-400" : "text-gray-500 border-transparent hover:text-gray-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ==================== TAB: OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              <KpiCard label="Impressions" value={totals.impressions} displayValue={fmt(totals.impressions)} small />
              <KpiCard label="Clicks" value={totals.clicks} displayValue={fmt(totals.clicks)} small />
              <KpiCard label="CTR" value={totals.ctr} displayValue={fmtPct(totals.ctr)} benchmark={BENCHMARKS.ctr} small />
              <KpiCard label="CPC" value={totals.cpc} displayValue={fmtVND(totals.cpc)} benchmark={BENCHMARKS.cpc} inverse small />
              <KpiCard label="Cost" value={totals.cost} displayValue={fmtVND(totals.cost)} small />
              <KpiCard label="Conversions" value={totals.conversions} displayValue={totals.conversions > 0 ? totals.conversions.toString() : "—"} small />
              <KpiCard label="Conv Rate" value={totals.convRate} displayValue={fmtPct(totals.convRate)} benchmark={BENCHMARKS.convRate} small />
              <KpiCard label="CPA" value={totals.cpa} displayValue={fmtVND(totals.cpa)} benchmark={BENCHMARKS.cpa} inverse small />
            </div>

            {chartData.length > 1 && (
              <ChartCard title="Clicks & Cost theo ngày" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dateShort" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={fmt} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="right" dataKey="cost" fill="#f59e0b" name="Cost (₫)" radius={[3, 3, 0, 0]} opacity={0.6} />
                </BarChart>
              </ChartCard>
            )}

            <div>
              <div className="text-sm font-semibold text-gray-400 mb-2">Gợi ý tối ưu</div>
              <div className="space-y-2">
                {recommendations.map((r, i) => (
                  <div key={i} className={`border rounded-lg p-3 text-sm ${recBg[r.type]}`}>
                    {r.icon} {r.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CHARTS ==================== */}
        {activeTab === "charts" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              {["7", "14", "30"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1 rounded text-xs transition ${dateRange === d ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}
                >
                  {d} ngày
                </button>
              ))}
            </div>

            {chartData.length < 2 ? (
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-12 text-center text-gray-500">
                Cần ít nhất 2 ngày data để hiển thị biểu đồ.
              </div>
            ) : (
              <>
                <ChartCard title="CTR & Conversion Rate Trend">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateShort" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="ctr" stroke="#3b82f6" strokeWidth={2} name="CTR (%)" dot={{ r: 3, fill: "#3b82f6" }} />
                    <Line type="monotone" dataKey="convRate" stroke="#10b981" strokeWidth={2} name="Conv Rate (%)" dot={{ r: 3, fill: "#10b981" }} />
                  </LineChart>
                </ChartCard>

                <ChartCard title="Impressions & Clicks">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateShort" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="impressions" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} name="Impressions" />
                    <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} name="Clicks" />
                  </AreaChart>
                </ChartCard>

                <ChartCard title="CPC theo ngày">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateShort" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={fmt} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtVND(v)} />
                    <Bar dataKey="cpc" fill="#8b5cf6" name="CPC (₫)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartCard>
              </>
            )}
          </div>
        )}

        {/* ==================== TAB: CAMPAIGNS ==================== */}
        {activeTab === "campaigns" && (
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/60">
                    {["Campaign", "Status", "Budget/day", "Impr.", "Clicks", "CTR", "CPC", "Conv.", "Conv Rate", "CPA", "Cost"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition cursor-pointer" onClick={() => { setSelectedCampaign(c.id); setActiveTab("overview"); }}>
                      <td className="px-3 py-2.5 font-medium text-white">{c.name.replace("MVT - Escape - ", "")}</td>
                      <td className="px-3 py-2.5"><Badge className={statusColor(c.status)}>{(c.status || "").toUpperCase()}</Badge></td>
                      <td className="px-3 py-2.5 text-gray-300">{fmtVND(c.budget)}</td>
                      <td className="px-3 py-2.5 text-gray-300">{fmt(c.impressions)}</td>
                      <td className="px-3 py-2.5 text-blue-400">{fmt(c.clicks)}</td>
                      <td className={`px-3 py-2.5 ${kpiColor(c.ctr, BENCHMARKS.ctr, false).text}`}>{fmtPct(c.ctr)}</td>
                      <td className={`px-3 py-2.5 ${kpiColor(c.cpc, BENCHMARKS.cpc, true).text}`}>{fmtVND(c.cpc)}</td>
                      <td className="px-3 py-2.5 text-green-400">{c.conversions || "—"}</td>
                      <td className={`px-3 py-2.5 ${kpiColor(c.convRate, BENCHMARKS.convRate, false).text}`}>{fmtPct(c.convRate)}</td>
                      <td className={`px-3 py-2.5 ${kpiColor(c.cpa, BENCHMARKS.cpa, true).text}`}>{fmtVND(c.cpa)}</td>
                      <td className="px-3 py-2.5 text-yellow-400">{fmtVND(c.cost)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-gray-900/60 font-semibold">
                    <td className="px-3 py-2.5 text-white">TỔNG</td>
                    <td className="px-3 py-2.5"></td>
                    <td className="px-3 py-2.5"></td>
                    <td className="px-3 py-2.5 text-gray-200">{fmt(totals.impressions)}</td>
                    <td className="px-3 py-2.5 text-blue-300">{fmt(totals.clicks)}</td>
                    <td className="px-3 py-2.5 text-gray-200">{fmtPct(totals.ctr)}</td>
                    <td className="px-3 py-2.5 text-gray-200">{fmtVND(totals.cpc)}</td>
                    <td className="px-3 py-2.5 text-green-300">{totals.conversions || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-200">{fmtPct(totals.convRate)}</td>
                    <td className="px-3 py-2.5 text-gray-200">{fmtVND(totals.cpa)}</td>
                    <td className="px-3 py-2.5 text-yellow-300">{fmtVND(totals.cost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: ROI ==================== */}
        {activeTab === "roi" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Tổng chi phí</div>
                <div className="text-2xl font-bold text-yellow-400">{fmtVND(totals.cost > 0 ? totals.cost : roi.budget)}</div>
                <div className="text-xs text-gray-500">{totals.cost > 0 ? "thực tế" : "ước tính/tháng"}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Leads</div>
                <div className="text-2xl font-bold text-green-400">{totals.conversions > 0 ? totals.conversions : "—"}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Bookings (est. 20%)</div>
                <div className="text-2xl font-bold text-blue-400">{roi.estBookings}</div>
              </div>
              <div className={`border rounded-xl p-4 ${roi.roas >= 3 ? "bg-green-950/40 border-green-800/60" : roi.roas >= 1 ? "bg-yellow-950/40 border-yellow-800/60" : "bg-gray-800/50 border-gray-700/50"}`}>
                <div className="text-xs text-gray-400">ROAS</div>
                <div className={`text-2xl font-bold ${roi.roas >= 3 ? "text-green-300" : roi.roas >= 1 ? "text-yellow-300" : "text-gray-400"}`}>
                  {roi.roas > 0 ? roi.roas.toFixed(1) + "x" : "—"}
                </div>
                <div className="text-xs text-gray-500">Target: &gt; 3x</div>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
              <div className="text-sm text-gray-400">Revenue ước tính: <span className="text-green-300 font-bold">{fmtVND(roi.revenue)}</span> (~${fmt(roi.revenue / 25000)} AUD)</div>
              <div className="text-xs text-gray-500 mt-1">Công thức: Leads × 20% close rate × $2,099 AUD × 25,000 VND/AUD</div>
            </div>
          </div>
        )}

        {/* ==================== TAB: DATA ==================== */}
        {activeTab === "data" && (
          <div className="space-y-4">
            {mode === "manual" && (
              <>
                <button onClick={() => setShowManualEntry(!showManualEntry)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  {showManualEntry ? "Ẩn form" : "+ Nhập data mới"}
                </button>
                {showManualEntry && (
                  <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400">Campaign</label>
                        <select value={manualForm.campaign} onChange={(e) => setManualForm((p) => ({ ...p, campaign: e.target.value }))} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white">
                          {manualCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name.replace("MVT - Escape - ", "")}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">Ngày</label>
                        <input type="date" value={manualForm.date} onChange={(e) => setManualForm((p) => ({ ...p, date: e.target.value }))} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white" />
                      </div>
                      {["impressions", "clicks", "cost", "conversions", "qualityScore"].map((f) => (
                        <div key={f}>
                          <label className="text-[10px] text-gray-400">{f === "cost" ? "Cost (₫)" : f === "qualityScore" ? "QS" : f.charAt(0).toUpperCase() + f.slice(1)}</label>
                          <input type="number" placeholder="0" value={manualForm[f]} onChange={(e) => setManualForm((p) => ({ ...p, [f]: e.target.value }))} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white" />
                        </div>
                      ))}
                    </div>
                    <button onClick={addManualEntry} className="mt-3 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition">Lưu</button>
                  </div>
                )}
              </>
            )}

            {/* Data Table */}
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden">
              <div className="text-sm font-semibold text-gray-300 p-4 pb-2">
                Dữ liệu {mode === "auto" ? "(từ Google Sheet)" : "(nhập thủ công)"} — {selectedCampaign === "__all__" ? "Tất cả campaigns" : campaigns.find((c) => c.id === selectedCampaign)?.name || ""}
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-900 border-b border-gray-700">
                      {(mode === "auto" ? ["Date", "Campaign", "Impr", "Clicks", "CTR", "Cost", "CPC", "Conv", "Conv%"] : ["Date", "Impr", "Clicks", "CTR", "Cost", "CPC", "Conv", "Conv%", "QS"]).map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mode === "auto"
                      ? chartData.slice().reverse().slice(0, 60).map((d, i) => (
                          <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                            <td className="px-3 py-1.5 text-gray-300">{d.date}</td>
                            <td className="px-3 py-1.5 text-gray-400 text-xs">{selectedCampaign === "__all__" ? "All" : ""}</td>
                            <td className="px-3 py-1.5 text-gray-300">{d.impressions}</td>
                            <td className="px-3 py-1.5 text-blue-400">{d.clicks}</td>
                            <td className="px-3 py-1.5 text-gray-300">{d.ctr}%</td>
                            <td className="px-3 py-1.5 text-yellow-400">{fmtVND(d.cost)}</td>
                            <td className="px-3 py-1.5 text-gray-300">{fmtVND(d.cpc)}</td>
                            <td className="px-3 py-1.5 text-green-400">{d.conversions}</td>
                            <td className="px-3 py-1.5 text-gray-300">{d.convRate}%</td>
                          </tr>
                        ))
                      : (() => {
                          const camp = selectedCampaign === "__all__" ? manualCampaigns : manualCampaigns.filter((c) => c.id === selectedCampaign);
                          const allData = camp.flatMap((c) => c.data.map((d) => ({ ...d, campaign: c.name }))).sort((a, b) => b.date.localeCompare(a.date));
                          return allData.map((d, i) => (
                            <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                              <td className="px-3 py-1.5 text-gray-300">{d.date}</td>
                              <td className="px-3 py-1.5 text-gray-300">{d.impressions}</td>
                              <td className="px-3 py-1.5 text-blue-400">{d.clicks}</td>
                              <td className="px-3 py-1.5 text-gray-300">{d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : "—"}%</td>
                              <td className="px-3 py-1.5 text-yellow-400">{fmtVND(d.cost)}</td>
                              <td className="px-3 py-1.5 text-gray-300">{d.clicks > 0 ? fmtVND(d.cost / d.clicks) : "—"}</td>
                              <td className="px-3 py-1.5 text-green-400">{d.conversions}</td>
                              <td className="px-3 py-1.5 text-gray-300">{d.clicks > 0 ? ((d.conversions / d.clicks) * 100).toFixed(2) : "—"}%</td>
                              <td className="px-3 py-1.5 text-gray-300">{d.qualityScore || "—"}</td>
                            </tr>
                          ));
                        })()
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: GUIDE ==================== */}
        {activeTab === "guide" && (
          <div className="space-y-4">
            <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-5">
              <h3 className="text-lg font-bold text-blue-300 mb-3">Setup Auto Data (Google Ads Script → Google Sheet)</h3>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div>
                    <strong>Tạo Google Sheet mới</strong><br />
                    Vào sheets.google.com → tạo sheet mới → Đặt tên "MVT Campaign Data"<br />
                    Copy <strong>Sheet ID</strong> từ URL: <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-300">https://docs.google.com/spreadsheets/d/<strong>SHEET_ID_Ở_ĐÂY</strong>/edit</code>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div>
                    <strong>Paste Sheet ID vào Google Ads Script</strong><br />
                    Mở file <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-300">google-ads-script.js</code> trong repo<br />
                    Thay <code className="bg-gray-800 px-1.5 py-0.5 rounded">PASTE_YOUR_GOOGLE_SHEET_ID_HERE</code> bằng Sheet ID thực tế
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div>
                    <strong>Thêm Script vào Google Ads</strong><br />
                    Vào <a href="https://ads.google.com" className="text-blue-400 underline" target="_blank" rel="noreferrer">ads.google.com</a> → Tools & Settings → Scripts → <strong>+ New Script</strong><br />
                    Paste toàn bộ code → <strong>Save</strong> → <strong>Run</strong> (test 1 lần)<br />
                    Authorize khi được hỏi (cho phép truy cập Google Sheets)
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">4</div>
                  <div>
                    <strong>Bật Schedule</strong><br />
                    Trong Scripts, click vào script → chọn <strong>Frequency: Daily</strong>, Time: <strong>8:00 AM</strong><br />
                    Script sẽ tự chạy mỗi ngày, export data mới vào Sheet
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">5</div>
                  <div>
                    <strong>Publish Sheet to Web</strong><br />
                    Trong Google Sheet: <strong>File → Share → Publish to web</strong><br />
                    Chọn "Entire document" → Format: <strong>CSV</strong> → Click <strong>Publish</strong>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">6</div>
                  <div>
                    <strong>Cập nhật Dashboard</strong><br />
                    Thay <code className="bg-gray-800 px-1.5 py-0.5 rounded">SHEET_ID</code> trong file <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-300">mvt-campaign-dashboard.jsx</code> (dòng đầu tiên trong SHEET_CONFIG)<br />
                    Bấm nút <strong>Auto</strong> ở góc trên phải → Dashboard tự động fetch data!
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2">Checklist hàng ngày (5 phút)</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>☐ Mở Dashboard → kiểm tra KPIs</div>
                <div>☐ CTR &gt; 5%? CPC &lt; 50K? Conversions tăng?</div>
                <div>☐ Check email/WhatsApp leads mới</div>
                <div>☐ Xem Gợi Ý tab → có hành động nào cần làm?</div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2">Links truy cập nhanh</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Google Ads", url: "https://ads.google.com" },
                  { label: "GA4 Analytics", url: "https://analytics.google.com" },
                  { label: "GTM", url: "https://tagmanager.google.com" },
                  { label: "Facebook Events", url: "https://business.facebook.com/events_manager2" },
                  { label: "Web3Forms", url: "https://web3forms.com/dashboard" },
                  { label: "Landing Page", url: "https://escape.myvivatour.com" },
                ].map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="bg-gray-900/60 border border-gray-700/40 rounded-lg p-2.5 text-blue-400 hover:text-blue-300 transition">
                    {l.label} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-800/40 text-center text-xs text-gray-600">
          MVT Campaign Dashboard v2.0 | MyVivaTour | 7/4/2026
        </div>
      </div>
    </div>
  );
}
