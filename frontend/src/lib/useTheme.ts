import { useEffect, useState } from "react";

export default function useIsDark() {
  const [isDark, setIsDark] = useState<boolean>(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => update());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    update();

    return () => observer.disconnect();
  }, []);

  return isDark;
}
