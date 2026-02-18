import React from "react";
import { Home } from "lucide-react";

function Logo({ className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Home size={50} className="" />
      <span className="text-2xl font-bold">Room-Match</span>
    </div>
  );
}

export default Logo;
