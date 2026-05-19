import { useNotifications } from "@vuetify/v0";

export function useNotify() {
  const notifications = useNotifications();

  function error(text: string, timeout = 10000) {
    notifications.send({ subject: text, severity: "error", timeout });
  }

  function success(text: string, timeout = 5000) {
    notifications.send({ subject: text, severity: "success", timeout });
  }

  function warning(text: string, timeout = 8000) {
    notifications.send({ subject: text, severity: "warning", timeout });
  }

  function info(text: string, timeout = 6000) {
    notifications.send({ subject: text, severity: "info", timeout });
  }

  return { error, success, warning, info, notifications };
}
