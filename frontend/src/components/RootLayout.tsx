import { Outlet } from "react-router-dom";
import ScrollToTop from "../lib/ScrollToTop";
import AccountBlockGate from "./AccountBlockGate";

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <AccountBlockGate>
        <Outlet />
      </AccountBlockGate>
    </>
  );
}
