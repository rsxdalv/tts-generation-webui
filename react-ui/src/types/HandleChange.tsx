import React from "react";

type HandleChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLTextAreaElement>
  | React.ChangeEvent<HTMLSelectElement>;

export type HandleChange = (event: HandleChangeEvent) => void;
