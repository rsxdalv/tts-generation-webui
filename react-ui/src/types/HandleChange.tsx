import React from "react";

export type HandleChange = (event: HandleChangeEvent) => void;
type HandleChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLTextAreaElement>
  | React.ChangeEvent<HTMLSelectElement>;
