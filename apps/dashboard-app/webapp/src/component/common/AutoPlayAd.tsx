// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { Box, CircularProgress, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

import { memo, useEffect, useRef, useState, useCallback } from "react";

import { AppConfig } from "@config/config";

interface ActiveAd {
  id: string;
  adName: string;
  mediaData: string;
  mediaType: string;
  durationSeconds: number;
  frequencyHours: number;
}

const AutoPlayAd = memo(() => {
  const [ad, setAd] = useState<ActiveAd | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const adRef = useRef<ActiveAd | null>(null);
  const displayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRequestRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, []);

  const fetchAndPlay = useCallback(() => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    axios
      .get(AppConfig.serviceUrls.advertisementsActive)
      .then((res) => {
        if (requestId !== latestRequestRef.current) return;
        const data = res.data;
        if (!data || !data.mediaData) {
          setAd(null);
          setPlaying(false);
          return;
        }
        const newAd: ActiveAd = {
          id: data.id,
          adName: data.adName,
          mediaData: data.mediaData,
          mediaType: data.mediaType,
          durationSeconds: data.durationSeconds || 5,
          frequencyHours: data.frequencyHours || 1,
        };
        adRef.current = newAd;
        setAd(newAd);
        setPlaying(true);
      })
      .catch(() => {
        if (requestId !== latestRequestRef.current) return;
        setAd(null);
        setPlaying(false);
      })
      .finally(() => {
        if (requestId !== latestRequestRef.current) return;
        setLoading(false);
      });
  }, []);

  // Initial fetch after 10s
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      fetchAndPlay();
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
    };
  }, [fetchAndPlay]);

  // Auto-stop after duration, then schedule next fetch
  useEffect(() => {
    if (!ad) return;

    displayTimerRef.current = setTimeout(() => {
      setPlaying(false);
      setAd(null);
      const freqMs = ad.frequencyHours * 60 * 60 * 1000;
      intervalTimerRef.current = setTimeout(() => {
        fetchAndPlay();
      }, freqMs);
    }, ad.durationSeconds * 1000);

    return () => {
      if (displayTimerRef.current) {
        clearTimeout(displayTimerRef.current);
        displayTimerRef.current = null;
      }
    };
  }, [ad, fetchAndPlay]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const handleStopPlaying = useCallback(() => {
    latestRequestRef.current += 1;
    const freqMs = (adRef.current?.frequencyHours ?? 1) * 60 * 60 * 1000;
    setPlaying(false);
    setAd(null);
    adRef.current = null;
    clearTimers();
    intervalTimerRef.current = setTimeout(() => {
      fetchAndPlay();
    }, freqMs);
  }, [clearTimers, fetchAndPlay]);

  if (!playing && !loading) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        bgcolor: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <IconButton
        aria-label="Close advertisement"
        onClick={handleStopPlaying}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          color: "white",
          bgcolor: "rgba(0,0,0,0.5)",
          zIndex: 10,
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <CloseIcon />
      </IconButton>

      {loading ? (
        <CircularProgress color="primary" />
      ) : ad ? (
        <Box
          component="img"
          src={ad.mediaData}
          alt={ad.adName}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : null}
    </Box>
  );
});

export default AutoPlayAd;
