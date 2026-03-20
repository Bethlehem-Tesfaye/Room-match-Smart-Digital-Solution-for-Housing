import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useVerifyEmail } from "../../features/auth/hooks/useVerifyEmail";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const { isPending: verifyPending } = useVerifyEmail(token);
  const { user, isPending: sessionPending } = useCurrentUser();

  useEffect(() => {
    if (!sessionPending && user) {
      navigate("/");
    }
  }, [sessionPending, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg text-center">
        {verifyPending || sessionPending ? (
          <p className="text-sm text-gray-600">Verifying your email...</p>
        ) : token ? (
          <p className="text-sm text-gray-600">Finalizing verification...</p>
        ) : (
          <p className="text-sm text-gray-600">No verification token found.</p>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
