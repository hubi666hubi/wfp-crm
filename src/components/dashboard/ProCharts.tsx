import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

// 1. Resonance Decay Chart
interface ResonancePoint {
  day: string;
  "Indeks Rezonansu": number;
  "Aktywność (Projections)": number;
}
export const ResonanceDecayChart: React.FC<{ data: ResonancePoint[] }> = React.memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorResonance" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
        </linearGradient>
        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
      <XAxis dataKey="day" stroke="#737373" fontSize={9} tickLine={false} />
      <YAxis stroke="#737373" fontSize={9} tickLine={false} />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: "12px",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e5e5e5"
        }}
      />
      <Legend fontSize={9} />
      <Area
        type="monotone"
        dataKey="Indeks Rezonansu"
        stroke="#f43f5e"
        fillOpacity={1}
        fill="url(#colorResonance)"
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="Aktywność (Projections)"
        stroke="#60a5fa"
        fillOpacity={1}
        fill="url(#colorActivity)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
));
ResonanceDecayChart.displayName = "ResonanceDecayChart";


// 2. Portal Velocity Chart
interface PortalPoint {
  name: string;
  "Średnia Prędkość (spikes/h)": number;
  "Skala Wolumenu": number;
}
export const PortalVelocityChart: React.FC<{ data: PortalPoint[] }> = React.memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
      <XAxis dataKey="name" stroke="#737373" fontSize={9} tickLine={false} />
      <YAxis stroke="#737373" fontSize={9} tickLine={false} />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: "12px",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e5e5e5"
        }}
      />
      <Bar dataKey="Średnia Prędkość (spikes/h)" fill="#f43f5e" radius={[4, 4, 0, 0]}>
        {data.map((entry, index) => {
          const colors = ["#f43f5e", "#ec4899", "#3b82f6", "#0a66c2", "#ef4444"];
          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
        })}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));
PortalVelocityChart.displayName = "PortalVelocityChart";


// 3. Category Viral Chart
interface CategoryPoint {
  category: string;
  "Wskaźnik Wiralowości (1-10)": number;
}
export const CategoryViralChart: React.FC<{ data: CategoryPoint[] }> = React.memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
      <XAxis dataKey="category" stroke="#737373" fontSize={9} tickLine={false} />
      <YAxis stroke="#737373" fontSize={9} tickLine={false} domain={[0, 10]} tickCount={6} />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: "12px",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e5e5e5"
        }}
      />
      <Bar dataKey="Wskaźnik Wiralowości (1-10)" fill="#fbbf24" radius={[4, 4, 0, 0]}>
        {data.map((entry, index) => {
          const colors = ["#fbbf24", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
        })}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));
CategoryViralChart.displayName = "CategoryViralChart";


// 4. Financial Revenue Chart
interface RevenuePoint {
  Data: string;
  "Przychód (PLN)": number;
}
export const FinancialRevenueChart: React.FC<{ data: RevenuePoint[] }> = React.memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
      <defs>
        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
      <XAxis dataKey="Data" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
      <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #1f1f1f",
          borderRadius: "12px",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e5e5e5"
        }}
      />
      <Area type="monotone" dataKey="Przychód (PLN)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
    </AreaChart>
  </ResponsiveContainer>
));
FinancialRevenueChart.displayName = "FinancialRevenueChart";
