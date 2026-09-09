'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ReportsChartsProps {
  type: 'bar' | 'pie';
  data: any[];
  colors?: string[];
  currency?: string;
  dataKey?: string;
  xKey?: string;
}

export default function ReportsCharts({
  type,
  data,
  colors = ['#FFB50F', '#0F5FFF', '#FF0628', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'],
  currency = 'ج.م',
  dataKey = 'amount',
  xKey = 'name',
}: ReportsChartsProps) {
  if (type === 'bar') {
    return (
      <div className="h-64 my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#23232e" />
            <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181822',
                borderColor: '#2e2e3e',
                color: '#fff',
                borderRadius: '12px',
              }}
              formatter={(val: any) => [`${formatCurrency(val, currency)}`, 'المبلغ']}
            />
            <Bar dataKey={dataKey} fill="#0F5FFF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-64 my-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={4}
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#181822',
              borderColor: '#2e2e3e',
              color: '#fff',
              borderRadius: '12px',
            }}
            formatter={(val: any) => [`${formatCurrency(val, currency)}`, 'المصروف']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
