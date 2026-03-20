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
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
        style={{ borderColor: "#E7E1FA" }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold" style={{ color: palette.deep }}>
          Save properties to your favorites
        </h2>
        <p className="mt-2 text-sm" style={{ color: palette.purple }}>
          Create an account to keep track of homes you love
        </p>

        <div className="mt-5 flex gap-3">
          <Link
            to="/login"
            className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
            style={{ backgroundColor: palette.purple }}
            onClick={onClose}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold"
            style={{ borderColor: palette.lightPurple, color: palette.purple }}
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
