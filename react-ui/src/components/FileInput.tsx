import { ChangeEvent, useState } from "react";

export default function FileInput({
  callback,
  accept = "audio/*",
  hide_text = true,
}: {
  callback: (file?: string) => void;
  accept?: string;
  hide_text?: boolean;
}) {
  const parseFileEvent = (e: ChangeEvent<HTMLInputElement>) =>
    e.target.files?.[0];

  const uploadFile = async (file?: File) => {
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
          callback(getLocalFileURL(file));
        }}
        accept={accept}
        style={{
          color: hide_text ? "transparent" : undefined,
        }}
      />
      <button onClick={() => callback(undefined)}>Clear File</button>
    </div>
  );
}

const getLocalFileURL = (file?: File) =>
  file && "/file-input-cache/" + file.name;
