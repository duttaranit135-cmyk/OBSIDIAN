"use client";

import { useEffect } from "react";

export default function StoreRedirectPage() {
  useEffect(() => {
    // Forward directly to the customer store HTML page
    window.location.replace("/store.html");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #aab8c4, #d7e1ea 48%, #8ea4b3)",
        color: "#102a43",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛍️</div>
        <p style={{ fontWeight: 700, letterSpacing: "0.05em" }}>Opening customer storefront...</p>
      </div>
    </div>
  );
}
