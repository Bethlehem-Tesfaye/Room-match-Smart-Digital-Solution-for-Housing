import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  getAdminNotificationCounts,
  markAdminPropertyNotificationsAsRead,
  markAdminReportsAsRead,
  markAdminScamReportsAsRead,
  markAdminSupportMessagesAsRead,
  type AdminNotificationCountResponse,
} from "../lib/api";

const defaultCounts: AdminNotificationCountResponse = {
  propertyNotifications: 0,
  reportNotifications: 0,
  supportNotifications: 0,
  scamReportNotifications: 0,
};

type AdminNotificationContextValue = {
  counts: AdminNotificationCountResponse;
  refreshCounts: () => Promise<void>;
  clearPropertyNotifications: () => Promise<void>;
  clearReportNotifications: () => Promise<void>;
  clearSupportNotifications: () => Promise<void>;
  clearScamReportNotifications: () => Promise<void>;
  isSocketConnected: boolean;
};

const AdminNotificationContext =
  createContext<AdminNotificationContextValue | null>(null);

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function AdminNotificationProvider() {
  const [counts, setCounts] = useState(defaultCounts);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const refreshCounts = useCallback(async () => {
    const response = await getAdminNotificationCounts();
    setCounts({
      propertyNotifications: response.propertyNotifications ?? 0,
      reportNotifications: response.reportNotifications ?? 0,
      supportNotifications: response.supportNotifications ?? 0,
      scamReportNotifications: response.scamReportNotifications ?? 0,
    });
  }, []);

  const clearPropertyNotifications = useCallback(async () => {
    const response = await markAdminPropertyNotificationsAsRead();
    if (response.counts) {
      setCounts(response.counts);
      return;
    }
    await refreshCounts();
  }, [refreshCounts]);

  const clearReportNotifications = useCallback(async () => {
    const response = await markAdminReportsAsRead();
    if (response.counts) {
      setCounts(response.counts);
      return;
    }
    await refreshCounts();
  }, [refreshCounts]);

  const clearSupportNotifications = useCallback(async () => {
    const response = await markAdminSupportMessagesAsRead();
    if (response.counts) {
      setCounts(response.counts);
      return;
    }
    await refreshCounts();
  }, [refreshCounts]);

  const clearScamReportNotifications = useCallback(async () => {
    const response = await markAdminScamReportsAsRead();
    if (response.counts) {
      setCounts(response.counts);
      return;
    }
    await refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    void refreshCounts().catch(() => undefined);
  }, [refreshCounts]);

  useEffect(() => {
    const socket: Socket = io(apiUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsSocketConnected(true);
      void refreshCounts().catch(() => undefined);
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on(
      "admin:notification:counts",
      (payload: AdminNotificationCountResponse) => {
        setCounts({
          propertyNotifications: payload.propertyNotifications ?? 0,
          reportNotifications: payload.reportNotifications ?? 0,
          supportNotifications: payload.supportNotifications ?? 0,
          scamReportNotifications: payload.scamReportNotifications ?? 0,
        });
      },
    );

    socket.on("notification:receive", (notification: { type?: string; title?: string }) => {
      if (
        notification?.type === "ListingUpdate" ||
        notification?.type === "Support" ||
        notification?.type === "ScamReport" ||
        (typeof notification?.title === "string" &&
          notification.title.startsWith("Unblock request from"))
      ) {
        void refreshCounts().catch(() => undefined);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshCounts]);

  const value = useMemo(
    () => ({
      counts,
      refreshCounts,
      clearPropertyNotifications,
      clearReportNotifications,
      clearSupportNotifications,
      clearScamReportNotifications,
      isSocketConnected,
    }),
    [
      counts,
      refreshCounts,
      clearPropertyNotifications,
      clearReportNotifications,
      clearSupportNotifications,
      clearScamReportNotifications,
      isSocketConnected,
    ],
  );

  return (
    <AdminNotificationContext.Provider value={value}>
      <Outlet />
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);

  if (!context) {
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationProvider",
    );
  }

  return context;
}
