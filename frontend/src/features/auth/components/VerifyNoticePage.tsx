import { Link } from "react-router-dom";
import { useResendVerify } from "../hooks/useResendVerify";
import { useCurrentUser } from "../hooks/useCurrentUser";

function VerifyNoticePage() {
  const { user } = useCurrentUser();
  const email = user?.email;
  const { mutate, isPending } = useResendVerify();

  const onResend = (): void => {
    if (!email) return;

    mutate({
      email,
      callbackURL: `${window.location.origin}/verify-email`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl border border-purple-500 rounded-xl p-6 bg-white">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Verify your email</h2>
          <p className="text-sm text-gray-500">
            We’ve sent a verification link to your email. Please check your
            inbox and click the link to continue.
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-600">
          If you don’t see the email, check your spam folder or try resending.
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={!email || isPending}
            onClick={onResend}
            className="w-full bg-[#7C67E4FF] text-white rounded-md py-2 font-semibold disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Resend verification email"}
          </button>

          <Link
            to="/login"
            className="block text-center text-sm text-[#7C67E4FF] font-medium"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyNoticePage;
