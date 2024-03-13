import React from "react";

export const parseFormChange = <T extends {}>(setter: React.Dispatch<React.SetStateAction<T>>) => (
  event: React.ChangeEvent<HTMLInputElement> |
    React.ChangeEvent<HTMLTextAreaElement> |
    React.ChangeEvent<HTMLSelectElement>
) => {
  const { name, value, type } = event.target;
  setter((x: T) => ({
    ...x,
    [name]: type === "number" || type === "range"
      ? Number(value)
      : type === "checkbox"
        ? (event.target as HTMLInputElement).checked // type assertion
        : value,
  }));
};
