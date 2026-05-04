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
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

import { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";

import { AppConfig } from "@config/config";

interface ActiveAd {
  id: string;
  adName: string;
  mediaUrl: string;
  mediaType: string;
  durationSeconds: number;
  isVideo: boolean;
}

const DEFAULT_PLAY_INTERVAL_MINUTES = 1;

const AutoPlayAd = memo(() => {
  const [ad, setAd] = useState<ActiveAd | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const latestRequestRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
        if (!data) {
          setAd(null);
          setPlaying(false);
          return;
        }
        setAd({
          id: data.id,
          adName: data.adName,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          durationSeconds: data.durationSeconds || 5,
          isVideo: data.mediaType.startsWith("video/"),
        });
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

  useEffect(() => {
    fetchAndPlay();

    const intervalMs = DEFAULT_PLAY_INTERVAL_MINUTES * 60 * 1000;
    const loopTimer = setInterval(() => {
      fetchAndPlay();
    }, intervalMs);

    return () => {
      clearInterval(loopTimer);
    };
  }, [fetchAndPlay]);

  const stopPlaying = useCallback(() => {
    latestRequestRef.current += 1;
    setPlaying(false);
    setAd(null);
    clearTimer();
    const intervalMs = DEFAULT_PLAY_INTERVAL_MINUTES * 60 * 1000;
    timerRef.current = setTimeout(() => {
      fetchAndPlay();
    }, intervalMs);
  }, [clearTimer, fetchAndPlay]);

  const isImageMedia = useCallback((mediaType: string): boolean => {
    return !mediaType.startsWith("video/");
  }, []);

  useEffect(() => {
    if (ad && isImageMedia(ad.mediaType)) {
      timerRef.current = setTimeout(() => {
        stopPlaying();
      }, (ad.durationSeconds || 5) * 1000);
    }
    return () => clearTimer();
  }, [ad, isImageMedia, stopPlaying, clearTimer]);

  const convertToYouTubeEmbed = useMemo(() => {
    return (url: string): string => {
      let videoId = "";
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch) videoId = watchMatch[1];
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch) videoId = shortMatch[1];
      const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) videoId = shortsMatch[1];
      const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) videoId = embedMatch[1];

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`
        : url;
    };
  }, []);

  const validateDriveEmbedUrl = useMemo(() => {
    return (mediaUrl: string): string | null => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(mediaUrl);
      } catch {
        return null;
      }

      const host = parsedUrl.hostname.toLowerCase();
      const path = parsedUrl.pathname;
      const allowedHosts = new Set([
        "drive.google.com",
        "docs.google.com",
        "drive.googleusercontent.com",
      ]);

      if (!allowedHosts.has(host)) return null;

      if (host === "drive.google.com") {
        const isFilePreviewOrView = /^\/file\/d\/[^/]+\/(preview|view)\/?$/.test(path);
        const isEmbedFolderView = /^\/embeddedfolderview\/?$/.test(path);
        const isUcWithId = /^\/uc\/?$/.test(path) && parsedUrl.searchParams.has("id");
        if (!isFilePreviewOrView && !isEmbedFolderView && !isUcWithId) return null;
      }

      if (host === "docs.google.com") {
        const isDocsPreviewOrEmbed =
          /^\/(document|presentation|spreadsheets)\/d\/[^/]+\/(preview|embed)\/?$/.test(path);
        if (!isDocsPreviewOrEmbed) return null;
      }

      if (host === "drive.googleusercontent.com") {
        const isDirectFilePath = /^\/.+/.test(path);
        if (!isDirectFilePath) return null;
      }

      return parsedUrl.toString();
    };
  }, []);

  const handleVideoEnd = useCallback(() => {
    stopPlaying();
  }, [stopPlaying]);

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
        onClick={stopPlaying}
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
        <>
          {ad.mediaUrl.includes("youtube.com") || ad.mediaUrl.includes("youtu.be") ? (
            <iframe
              src={convertToYouTubeEmbed(ad.mediaUrl)}
              title={ad.adName}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : validateDriveEmbedUrl(ad.mediaUrl) ? (
            <iframe
              src={validateDriveEmbedUrl(ad.mediaUrl) as string}
              title={ad.adName}
              style={{ width: "100%", height: "100%", border: "none" }}
              sandbox="allow-same-origin allow-scripts allow-presentation"
            />
          ) : ad.mediaUrl.includes("drive.google.com") ||
            ad.mediaUrl.includes("docs.google.com") ||
            ad.mediaUrl.includes("drive.googleusercontent.com") ? (
            <Typography variant="body1" color="white" textAlign="center">
              Unable to preview this Google Drive URL.
            </Typography>
          ) : !isImageMedia(ad.mediaType) ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              controls
              onEnded={handleVideoEnd}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            >
              <source src={ad.mediaUrl} type={ad.mediaType || undefined} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Box
              component="img"
              src={ad.mediaUrl}
              alt={ad.adName}
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
        </>
      ) : null}
    </Box>
  );
});

export default AutoPlayAd;
