import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: "#1f2937",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Chair icon using simple shapes */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back */}
        <rect x="4" y="2" width="2" height="9" rx="1" fill="#e8590c" />
        <rect x="18" y="2" width="2" height="9" rx="1" fill="#e8590c" />
        <rect x="4" y="2" width="16" height="2" rx="1" fill="#e8590c" />
        <rect
          x="10"
          y="2"
          width="2"
          height="9"
          rx="1"
          fill="#e8590c"
          opacity="0.7"
        />
        {/* Seat */}
        <rect x="3" y="11" width="18" height="3" rx="1" fill="#e8590c" />
        {/* Legs */}
        <rect x="4" y="14" width="2" height="8" rx="1" fill="#e8590c" />
        <rect x="18" y="14" width="2" height="8" rx="1" fill="#e8590c" />
        {/* Cross */}
        <rect
          x="4"
          y="18"
          width="16"
          height="1.5"
          rx="0.5"
          fill="#e8590c"
          opacity="0.7"
        />
      </svg>
    </div>,
    { ...size },
  );
}
