import React from "react";

export type HandleChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLTextAreaElement>
  | React.ChangeEvent<HTMLSelectElement>
  | { target: { name: string; value: string; type?: string } };

export type HandleChange = (event: HandleChangeEvent) => void;
