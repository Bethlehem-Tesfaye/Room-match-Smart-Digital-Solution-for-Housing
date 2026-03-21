import Logo from "../../../components/logo";
import { hero } from "../../../assets";
import type { AuthLayoutProps } from "../types/type";
import { palette } from "../../../theme/palette";

function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: palette.pageBg }}
    >
      <div className="min-h-screen mx-auto grid grid-cols-1 md:grid-cols-2">
        {/* Left: Hero */}
        <div className="relative hidden md:flex flex-col justify-between p-10 text-white">
          <div
            className="absolute inset-0 z-10 opacity-70"
            style={{ backgroundColor: palette.purple }}
          />
          <img
            src={hero}
            alt="Modern Apartment"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundColor: palette.softPurple }}
          />

          <div className="relative z-10 flex items-center justify-center gap-3">
            <Logo />
          </div>

          <div className="relative z-10 max-w-md">
            <h1 className="text-5xl font-bold mb-4">
              Find your perfect roommate match.
            </h1>
            <p className="text-lg text-white/90">
              The smart housing ecosystem connecting trusted landlords with
              tenants. Find your perfect match today.
            </p>
          </div>

          <div className="relative z-10 text-xs text-white/80">
            © {currentYear} RoomMatch • Privacy Policy
          </div>
        </div>

        {/* Right: Form */}
        <div
          className="flex items-center justify-center p-6 md:p-12"
          style={{ backgroundColor: palette.cardBg }}
        >
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
