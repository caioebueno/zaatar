"use client";

import { useCallback, useRef, useState } from "react";
import { IconAlert, IconArrowDown, IconCheck, IconCloudUpload, IconImage, IconX } from "./Icons";

type UploadState = "idle" | "drag" | "uploading" | "success" | "error";

type UploadedFile = {
  name: string;
  size: number;
  dimensions?: string;
};

type ErrorInfo = {
  message: string;
  fileName: string;
};

type FileUploadProps = {
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  onUpload?: (file: File) => Promise<string>;
};

const MAX_MB = 10;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_LABEL = "PNG · JPG · WEBP";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ accept, maxSizeMb = MAX_MB, label = "Drop image here, or", onUpload }: FileUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [draggingName, setDraggingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptTypes = accept ?? ACCEPTED.join(",");
  const maxBytes = maxSizeMb * 1024 * 1024;

  const validate = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED.includes(file.type)) return "File type not supported";
      if (file.size > maxBytes) return `File is too large`;
      return null;
    },
    [maxBytes],
  );

  const processFile = useCallback(
    async (file: File) => {
      const err = validate(file);
      if (err) {
        setState("error");
        setError({ message: `${err}`, fileName: file.name });
        return;
      }

      setState("uploading");
      setProgress(0);

      // Simulate progress if no real upload handler
      if (!onUpload) {
        for (let p = 0; p <= 100; p += 10) {
          await new Promise((r) => setTimeout(r, 80));
          setProgress(p);
        }
        let dims: string | undefined;
        try {
          const url = URL.createObjectURL(file);
          await new Promise<void>((res) => {
            const img = new Image();
            img.onload = () => {
              dims = `${img.naturalWidth}×${img.naturalHeight}`;
              URL.revokeObjectURL(url);
              res();
            };
            img.onerror = () => { URL.revokeObjectURL(url); res(); };
            img.src = url;
          });
        } catch { /* no-op */ }
        setUploaded({ name: file.name, size: file.size, dimensions: dims });
        setState("success");
        return;
      }

      try {
        await onUpload(file);
        setUploaded({ name: file.name, size: file.size });
        setState("success");
      } catch {
        setState("error");
        setError({ message: "Upload failed", fileName: file.name });
      }
    },
    [validate, onUpload],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const name = e.dataTransfer.items[0] ? (e.dataTransfer.files[0]?.name ?? "") : "";
    setDraggingName(name);
    setState("drag");
  }, []);

  const onDragLeave = useCallback(() => {
    setState("idle");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const reset = useCallback(() => {
    setState("idle");
    setUploaded(null);
    setError(null);
    setProgress(0);
  }, []);

  return (
    <div
      onDragOver={state !== "uploading" ? onDragOver : undefined}
      onDragLeave={state !== "uploading" ? onDragLeave : undefined}
      onDrop={state !== "uploading" ? onDrop : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      {state === "idle" && (
        <div
          style={{
            background: "var(--paper)",
            border: "1.5px dashed rgba(22,18,15,0.22)",
            borderRadius: 14,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            minHeight: 180,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--cream)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <IconCloudUpload size={24} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
              textAlign: "center",
            }}
          >
            {label}{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--zippy)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                textDecorationThickness: "1.5px",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                cursor: "pointer",
              }}
            >
              browse
            </button>
          </div>
          <div
            className="mono"
            style={{ fontSize: 10.5, color: "var(--slate)", letterSpacing: "0.08em" }}
          >
            {ACCEPTED_LABEL} · UP TO {maxSizeMb} MB
          </div>
        </div>
      )}

      {state === "drag" && (
        <div
          style={{
            background: "#fff1ec",
            border: "2px solid var(--zippy)",
            borderRadius: 14,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            minHeight: 180,
            justifyContent: "center",
            boxShadow: "0 0 0 4px rgba(255,61,20,0.08)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--zippy)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <IconArrowDown size={22} color="#fff" strokeWidth={2.4} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
            }}
          >
            Release to upload
          </div>
          {draggingName && (
            <div
              className="mono"
              style={{ fontSize: 10.5, color: "var(--zippy)", letterSpacing: "0.08em", fontWeight: 600 }}
            >
              1 IMAGE · {draggingName.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {state === "uploading" && (
        <div
          style={{
            background: "var(--paper)",
            border: "1.5px solid rgba(22,18,15,0.1)",
            borderRadius: 14,
            padding: "20px 18px",
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--cream)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(22,18,15,0.08)",
                flexShrink: 0,
              }}
            >
              <IconImage size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {uploaded?.name ?? "Uploading…"}
              </div>
              <div
                className="mono"
                style={{ fontSize: 10.5, color: "var(--slate)", marginTop: 3, letterSpacing: "0.04em" }}
              >
                Uploading…
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                border: "1px solid rgba(22,18,15,0.12)",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <IconX size={12} color="var(--slate)" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                height: 6,
                width: "100%",
                borderRadius: 999,
                background: "rgba(22,18,15,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--zippy)",
                  borderRadius: 999,
                  transition: "width 120ms ease",
                }}
              />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: "var(--ink)",
                letterSpacing: "0.04em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      )}

      {state === "success" && uploaded && (
        <div
          style={{
            background: "var(--paper)",
            border: "1.5px solid rgba(0,168,102,0.4)",
            borderRadius: 14,
            padding: "20px 18px",
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "linear-gradient(135deg, #f4d6c2 0%, #e89a76 50%, #c66a4a 100%)",
                flexShrink: 0,
                border: "1px solid rgba(22,18,15,0.08)",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {uploaded.name}
              </div>
              <div
                className="mono"
                style={{ fontSize: 10.5, color: "#00a866", marginTop: 3, letterSpacing: "0.04em", fontWeight: 600 }}
              >
                UPLOADED · {formatBytes(uploaded.size)}{uploaded.dimensions ? ` · ${uploaded.dimensions}` : ""}
              </div>
            </div>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: "#00a866",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <IconCheck size={14} color="#fff" strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(22,18,15,0.12)",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: 12,
                color: "var(--ink)",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: 12,
                color: "var(--slate)",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {state === "error" && error && (
        <div
          style={{
            background: "#fef3f1",
            border: "1.5px solid #d43a2c",
            borderRadius: 14,
            padding: "20px 18px",
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#d43a2c",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <IconAlert size={20} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {error.message}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "#7a3530",
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                {error.fileName} is over {maxSizeMb} MB or not a supported type.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { reset(); inputRef.current?.click(); }}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: 12,
                color: "var(--cream)",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Try another file
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: 12,
                color: "var(--slate)",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
