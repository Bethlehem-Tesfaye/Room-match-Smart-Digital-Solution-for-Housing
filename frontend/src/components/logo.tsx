import { Home } from "lucide-react";

interface LogoProps {
  className?: string;
}

function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Home size={40} />
      <span className="text-2xl font-bold">Room-Match</span>
    </div>
  );
}

export default Logo;
