import { Link } from "react-router-dom";
import { palette } from "../../../theme/palette";

interface FavoriteAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FavoriteAuthModal({ isOpen, onClose }: FavoriteAuthModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border p-6"
        style={{
          borderColor: palette.border,
          backgroundColor: palette.cardBg,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--palette-deep)" }}
        >
          Save properties to your favorites
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: palette.softPurple }}
        >
          Create an account to keep track of homes you love
        </p>

        <div className="mt-5 flex gap-3">
          <Link
            to="/login"
            className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white"
            style={{ backgroundColor: palette.purple }}
            onClick={onClose}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-bold"
            style={{ borderColor: palette.border, color: palette.purple }}
            onClick={onClose}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FavoriteAuthModal;
