import { Home } from "lucide-react";

interface LogoProps {
  className?: string;
}

function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Home size={30} />
      <span className="text-xl font-bold">RoomMatch</span>
    </div>
  );
}

export default Logo;
