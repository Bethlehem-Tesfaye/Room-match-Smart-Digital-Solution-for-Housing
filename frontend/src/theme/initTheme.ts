const THEME_STORAGE_KEY = "roommatch-theme";

export const initTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  const root = document.documentElement;

  if (stored === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};
