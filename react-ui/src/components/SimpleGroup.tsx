import React from "react";
import { commonBorder } from "./commonBorder";

export const SimpleGroup = ({ children }: { children: React.ReactNode }) => (
  <div className={"flex flex-col space-y-2 " + commonBorder}>{children}</div>
);
