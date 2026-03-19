import { HistorySharp, HomeSharp } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

type BottomNavKey = "home" | "history";

interface BottomNavProps {
  active: BottomNavKey;
}

function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();

  const accent = "#ff7300";
  const muted = "#9B9B9B";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white pb-3 pt-2">
      <div className="flex justify-around">
        <IconButton
          onClick={() => navigate("/services/parking")}
          sx={{ padding: 0 }}
          aria-label="Home"
        >
          <div className="flex flex-col items-center gap-1">
            <HomeSharp style={{ color: active === "home" ? accent : muted }} />
            <span
              className="text-[12.5px] font-medium"
              style={{ color: active === "home" ? accent : muted }}
            >
              Home
            </span>
          </div>
        </IconButton>
        <IconButton
          onClick={() => navigate("/services/parking/bookings")}
          sx={{ padding: 0 }}
          aria-label="History"
        >
          <div className="flex flex-col items-center gap-1">
            <HistorySharp
              style={{ color: active === "history" ? accent : muted }}
            />
            <span
              className="text-[12.5px] font-medium"
              style={{ color: active === "history" ? accent : muted }}
            >
              History
            </span>
          </div>
        </IconButton>
      </div>
    </nav>
  );
}

export default BottomNav;

