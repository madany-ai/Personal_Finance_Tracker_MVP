'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  currency: string;
}

export default function CategoryPieChart({ data, colors, currency }: CategoryPieChartProps) {
  return (
    <div className="h-48 my-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
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
