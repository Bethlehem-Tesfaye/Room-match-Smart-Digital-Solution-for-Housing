export const getAvailableFromError = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return "Available from date is required.";

  const selected = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(selected.getTime())) {
    return "Available from date is required.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) {
    return "Available from date cannot be in the past.";
  }

  return undefined;
};

export const todayDateInputMin = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
