import { useEffect, useState } from "react";
import { serviceUrls } from "@/config/config";
import { Warning } from "@mui/icons-material";

export const MaintenanceBanner = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    fetch(serviceUrls.fetchAppConfigs())
      .then((res) => res.json())
      .then((data) => {
        if (data && data.isMaintenanceMode) {
          setIsMaintenanceMode(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch app configs:", err);
      });
  }, []);

  if (!isMaintenanceMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
      <div className="bg-white dark:bg-[#1F2A44] rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-[#ff7300]/10 rounded-full flex items-center justify-center mb-2">
          <Warning className="text-[#ff7300]" sx={{ fontSize: 36 }} />
        </div>
        <h2 className="text-2xl font-bold text-[#1F2A44] dark:text-white">
          Under Maintenance
        </h2>
        <p className="text-[#808080] dark:text-gray-300">
          The app is currently undergoing maintenance and is temporarily unavailable. Please check back later.
        </p>
      </div>
    </div>
  );
};
