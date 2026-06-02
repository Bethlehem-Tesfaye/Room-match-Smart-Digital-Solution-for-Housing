const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/i;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    const serverMessage = axiosError.response?.data?.message?.trim();
    if (serverMessage) return serverMessage;

    const axiosMessage = axiosError.message?.trim();
    if (axiosMessage && !AXIOS_STATUS_MESSAGE.test(axiosMessage)) {
      return axiosMessage;
    }
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && !AXIOS_STATUS_MESSAGE.test(message)) return message;
  }

  return fallback;
};
