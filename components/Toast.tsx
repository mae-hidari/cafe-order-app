import { toast } from "react-hot-toast";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: "top-center",
      style: {
        background: "#10B981",
        color: "#fff",
        fontWeight: "500",
      },
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: "top-center",
      style: {
        background: "#EF4444",
        color: "#fff",
        fontWeight: "500",
      },
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message, {
      position: "top-center",
      style: {
        background: "#6B7280",
        color: "#fff",
        fontWeight: "500",
      },
    });
  },
};

export default showToast;