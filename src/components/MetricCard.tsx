import React from "react";

export const MetricCard = React.memo(
  ({ title, value, icon: Icon, trend, trendUp }: any) => {
    return (
      <div className="p-4 bg-card rounded-2xl shadow-card">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold mt-2">{value}</h2>

        <p
          className={`text-xs mt-1 ${
            trendUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend}
        </p>
      </div>
    );
  }
);
