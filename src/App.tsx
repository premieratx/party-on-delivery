import React from "react";
import { HomeHero } from "./routes/home/HomeHero";
import { HomeHealthCheck } from "./routes/home/HomeHealthCheck";

export default function App() {
  return (
    <div>
      <HomeHero />
      <HomeHealthCheck /> {/* remove if you don't want the status badge */}
    </div>
  );
}
