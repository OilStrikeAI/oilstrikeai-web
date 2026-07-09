import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1220",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 18,
              background: "#0b1220",
              border: "3px solid #d4a017",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#d4a017", fontSize: 48, fontWeight: 700, fontStyle: "italic" }}>O</span>
          </div>
          <span style={{ color: "#ffffff", fontSize: 64, fontWeight: 700 }}>
            OilStrike<span style={{ color: "#d4a017", fontStyle: "italic" }}>AI</span>
          </span>
        </div>
        <p style={{ color: "#cfd3da", fontSize: 30, marginTop: 32, textAlign: "center", maxWidth: 900 }}>
          Never miss a dollar or a deadline again.
        </p>
      </div>
    ),
    { ...size }
  );
}
