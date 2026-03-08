import { useSearchParams } from "react-router-dom";
import ResetPasswordForm from "../../features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      {token ? <ResetPasswordForm token={token} /> : null}
    </div>
  );
}

export default ResetPasswordPage;
