import { ChangeEvent, useState } from "react";

export default function FileInput({
  callback,
}: {
  callback: (file: File | undefined) => void;
}) {
  const parseFileEvent = (e: ChangeEvent<HTMLInputElement>) =>
    e.target.files?.[0];

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      const data = new FormData();
      data.set("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      // handle the error
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      // Handle errors here
      console.error(e);
    }
  };

  return (
    <div>
      <input
        type="file"
        name="file"
        onChange={async (e) => {
          const file = parseFileEvent(e);
          await uploadFile(file);
          callback(file);
        }}
        accept="audio/*"
        style={{
          color: "transparent",
        }}
      />
      <button onClick={() => callback(undefined)}>Clear File</button>
    </div>
  );
}
