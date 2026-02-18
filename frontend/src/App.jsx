import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="bottom-right" />
    </>
  );
}

export default App;
