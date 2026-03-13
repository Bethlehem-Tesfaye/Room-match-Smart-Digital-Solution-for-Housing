import AuthLayout from "../../features/auth/components/AuthLayout";
import RegistrationForm from "../../features/auth/components/RegistrationForm";

function RegisterPage() {
  return (
    <AuthLayout>
      <RegistrationForm />
    </AuthLayout>
  );
}

export default RegisterPage;
