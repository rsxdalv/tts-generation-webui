import React from "react";

export const ProgressBar = ({
  label, value, total,
}: {
  label: string;
  value: number;
  total: number;
}) => {
  const percentage = (value / total) * 100;
  return (
    <div className="flex items-center">
      <p className="text-sm w-36">
        {label}: <br />[{value.toFixed(0)} MB]
      </p>
      <div className="flex w-2/3">
        <div
          style={{
            width: `${percentage}%`,
            height: "10px",
          }}
          className="bg-orange-400"
        ></div>
        <div
          style={{
            width: `${100 - percentage}%`,
            height: "10px",
          }}
          className="bg-slate-300"
        ></div>
      </div>
    </div>
  );
};
