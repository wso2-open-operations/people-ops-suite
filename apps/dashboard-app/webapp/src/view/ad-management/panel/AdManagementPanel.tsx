// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Slider,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { CheckCircle, Play, Radio, Trash2, Upload } from "@wso2/oxygen-ui-icons-react";
import { useSnackbar } from "notistack";

import { Dialog, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";

import { AppConfig } from "@config/config";
import { ADVERTISEMENT } from "@config/feature";
import { AdManagementMessage } from "@config/messages";
import { APIService } from "@utils/apiService";

interface Ad {
  id: string;
  adName: string;
  mediaUrl: string;
  mediaType: string;
  duration: number;
  isActive: boolean;
  uploadedDate: string;
  scheduleEnabled: boolean;
  scheduleIntervalMinutes: number;
  lastDisplayedAt?: string;
}

export default function AdManagementPanel() {
  const { enqueueSnackbar } = useSnackbar();
  const [newAdName, setNewAdName] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newDuration, setNewDuration] = useState<number>(
    ADVERTISEMENT.defaultImageDurationSeconds,
  );
  const [ads, setAds] = useState<Ad[]>([]);
  const [testAdOpen, setTestAdOpen] = useState(false);
  const [previewedAd, setPreviewedAd] = useState<Ad | null>(null);

  const isVideoMedia = (mediaUrl: string): boolean => {
    const lower = mediaUrl.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".webm");
  };

  const isVideoMediaType = (mediaType: string): boolean => {
    return mediaType.startsWith("video/");
  };

  const convertToYouTubeEmbed = (url: string): string => {
    let videoId = "";

    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }

    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) {
      videoId = shortsMatch[1];
    }

    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`;
    }

    return url;
  };

  const resolveMediaType = async (mediaUrl: string): Promise<string> => {
    const extensionToMime: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };

    let parsedUrl: URL | null = null;
    try {
      parsedUrl = new URL(mediaUrl);
    } catch {
      parsedUrl = null;
    }

    if (parsedUrl) {
      const isHttp = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
      const host = parsedUrl.hostname.toLowerCase();
      if (!isHttp || host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return "image/jpeg";
      }
    }

    const pathname = parsedUrl ? parsedUrl.pathname.toLowerCase() : mediaUrl.toLowerCase();
    const extensionMatch = pathname.match(/\.[a-z0-9]+$/);
    const extension = extensionMatch?.[0];

    if (extension && extensionToMime[extension]) {
      return extensionToMime[extension];
    }

    return "image/jpeg";
  };

  const validateDriveEmbedUrl = (mediaUrl: string): string | null => {
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

    if (!allowedHosts.has(host)) {
      return null;
    }

    if (host === "drive.google.com") {
      const isFilePreviewOrView = /^\/file\/d\/[^/]+\/(preview|view)\/?$/.test(path);
      const isEmbedFolderView = /^\/embeddedfolderview\/?$/.test(path);
      const isUcWithId = /^\/uc\/?$/.test(path) && parsedUrl.searchParams.has("id");
      if (!isFilePreviewOrView && !isEmbedFolderView && !isUcWithId) {
        return null;
      }
    }

    if (host === "docs.google.com") {
      const isDocsPreviewOrEmbed =
        /^\/(document|presentation|spreadsheets)\/d\/[^/]+\/(preview|embed)\/?$/.test(path);
      if (!isDocsPreviewOrEmbed) {
        return null;
      }
    }

    if (host === "drive.googleusercontent.com") {
      const isDirectFilePath = /^\/.+/.test(path);
      if (!isDirectFilePath) {
        return null;
      }
    }

    return parsedUrl.toString();
  };

  const mapAdvertisement = (item: {
    id: number;
    adName: string;
    mediaUrl: string;
    mediaType: string;
    durationSeconds: number;
    isActive: boolean;
    uploadedDate: string;
    scheduleEnabled?: boolean;
    scheduleIntervalMinutes?: number;
    lastDisplayedAt?: string;
  }): Ad => ({
    id: String(item.id),
    adName: item.adName,
    mediaUrl: item.mediaUrl,
    mediaType: item.mediaType,
    duration: item.durationSeconds,
    isActive: item.isActive,
    uploadedDate: item.uploadedDate,
    scheduleEnabled: item.scheduleEnabled ?? false,
    scheduleIntervalMinutes:
      item.scheduleIntervalMinutes ?? ADVERTISEMENT.defaultScheduleIntervalMinutes,
    lastDisplayedAt: item.lastDisplayedAt,
  });

  const loadAdvertisements = async () => {
    try {
      const response = await APIService.getInstance().get(AppConfig.serviceUrls.advertisements);
      const list = response.data as Array<{
        id: number;
        adName: string;
        mediaUrl: string;
        mediaType: string;
        durationSeconds: number;
        isActive: boolean;
        uploadedDate: string;
        scheduleEnabled?: boolean;
        scheduleIntervalMinutes?: number;
        lastDisplayedAt?: string;
      }>;
      setAds(list.map(mapAdvertisement));
    } catch (error) {
      console.error("Failed to load advertisements", error);
      setAds([]);
      return;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [listResult, activeResult] = await Promise.allSettled([
          APIService.getInstance().get(AppConfig.serviceUrls.advertisements),
          APIService.getInstance().get(AppConfig.serviceUrls.advertisementsActive),
        ]);

        if (listResult.status !== "fulfilled") {
          throw listResult.reason;
        }

        const list = listResult.value.data as Array<{
          id: number;
          adName: string;
          mediaUrl: string;
          mediaType: string;
          durationSeconds: number;
          isActive: boolean;
          uploadedDate: string;
          scheduleEnabled?: boolean;
          scheduleIntervalMinutes?: number;
          lastDisplayedAt?: string;
        }>;
        const active =
          activeResult.status === "fulfilled"
            ? (activeResult.value.data as { id: number } | null)
            : null;

        setAds(
          list.map((item) =>
            mapAdvertisement({
              ...item,
              isActive: active?.id === item.id,
            }),
          ),
        );
      } catch (err) {
        console.error("Failed to load ads", err);
      }
    };

    loadData();
  }, []);

  const handleAddAd = async () => {
    if (!newAdName.trim()) {
      enqueueSnackbar(AdManagementMessage.snackbar.adNameRequired, { variant: "warning" });
      return;
    }

    if (!newMediaUrl) {
      enqueueSnackbar(AdManagementMessage.snackbar.mediaUrlRequired, { variant: "warning" });
      return;
    }

    try {
      const payload = {
        adName: newAdName.trim(),
        mediaUrl: newMediaUrl,
        mediaType: await resolveMediaType(newMediaUrl),
        durationSeconds: newDuration,
      };

      await APIService.getInstance().post(AppConfig.serviceUrls.advertisements, payload);
      await loadAdvertisements();
      enqueueSnackbar(AdManagementMessage.snackbar.adAddedSuccess, { variant: "success" });
      setNewAdName("");
      setNewMediaUrl("");
      setNewDuration(ADVERTISEMENT.defaultImageDurationSeconds);
    } catch {
      enqueueSnackbar(AdManagementMessage.snackbar.adAddedFailed, { variant: "error" });
    }
  };

  const handleSetActiveAd = (adId: string) => {
    APIService.getInstance()
      .put(`${AppConfig.serviceUrls.advertisements}/${adId}/activate`)
      .then(() => loadAdvertisements())
      .then(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.activeUpdatedSuccess, { variant: "success" });
      })
      .catch(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.activeUpdatedFailed, { variant: "error" });
      });
  };

  const handleDeleteAd = (adId: string) => {
    const adToDelete = ads.find((ad) => ad.id === adId);

    if (adToDelete?.isActive) {
      enqueueSnackbar(AdManagementMessage.snackbar.deleteActiveBlocked, {
        variant: "warning",
      });
      return;
    }

    APIService.getInstance()
      .delete(`${AppConfig.serviceUrls.advertisements}/${adId}`)
      .then(() => loadAdvertisements())
      .then(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.adDeletedSuccess, { variant: "success" });
      })
      .catch(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.adDeletedFailed, { variant: "error" });
      });
  };

  const handlePreview = (ad: Ad) => {
    setPreviewedAd(ad);
    setTestAdOpen(true);
  };

  useEffect(() => {
    if (!testAdOpen || !previewedAd) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    if (isVideoMediaType(previewedAd.mediaType)) {
      const videoDuration = previewedAd.duration ?? 30;
      const totalTime =
        Math.max(videoDuration, ADVERTISEMENT.minPreviewVideoSeconds) * 1000 +
        ADVERTISEMENT.previewVideoBufferMs;
      timeout = setTimeout(() => {
        setTestAdOpen(false);
      }, totalTime);
    } else {
      timeout = setTimeout(() => {
        setTestAdOpen(false);
      },
      Math.max(
        previewedAd.duration ?? ADVERTISEMENT.defaultImageDurationSeconds,
        ADVERTISEMENT.minPreviewImageSeconds,
      ) * 1000);
    }

    return () => clearTimeout(timeout);
  }, [testAdOpen, previewedAd]);

  const activeAd = ads.find((ad) => ad.isActive);
  const validatedDriveUrl = previewedAd ? validateDriveEmbedUrl(previewedAd.mediaUrl) : null;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom color="text.primary">
          {AdManagementMessage.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {AdManagementMessage.subtitle}
        </Typography>
      </Box>

      {activeAd && (
        <Card sx={{ mb: 4, bgcolor: "primary.main", color: "white" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CheckCircle size={24} />
                <Typography variant="h6">{AdManagementMessage.sections.activeAd}</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Play size={18} />}
                onClick={() => {
                  setPreviewedAd(activeAd);
                  setTestAdOpen(true);
                }}
                sx={{ bgcolor: "success.main", "&:hover": { bgcolor: "success.dark" } }}
              >
                {AdManagementMessage.actions.testAd}
              </Button>
            </Box>
            <Card sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}>
              <CardContent>
                <Typography variant="caption" sx={{ opacity: 0.9 }} gutterBottom>
                  {AdManagementMessage.labels.adName}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  {activeAd.adName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }} gutterBottom>
                  {AdManagementMessage.labels.mediaUrl}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, wordBreak: "break-all" }}>
                  {activeAd.mediaUrl}
                </Typography>
                <Box sx={{ display: "flex", gap: 3, typography: "body2", mt: 2, flexWrap: "wrap" }}>
                  {!isVideoMediaType(activeAd.mediaType) && (
                    <Box>
                      <Typography component="span" sx={{ opacity: 0.9 }}>
                        {AdManagementMessage.labels.displayDuration}:{" "}
                      </Typography>
                      <Typography component="span" fontWeight="bold">
                        {activeAd.duration}s
                      </Typography>
                    </Box>
                  )}
                  {isVideoMediaType(activeAd.mediaType) && (
                    <Box>
                      <Typography component="span" sx={{ opacity: 0.9 }}>
                        {AdManagementMessage.labels.videoType}:{" "}
                      </Typography>
                      <Typography component="span" fontWeight="bold">
                        {AdManagementMessage.labels.video}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography component="span" sx={{ opacity: 0.9 }}>
                      {AdManagementMessage.labels.schedule}:{" "}
                    </Typography>
                    <Typography component="span" fontWeight="bold">
                      {activeAd.scheduleEnabled
                        ? `Every ${activeAd.scheduleIntervalMinutes} min`
                        : AdManagementMessage.helper.scheduleDisabled}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography component="span" sx={{ opacity: 0.9 }}>
                      {AdManagementMessage.labels.uploaded}:{" "}
                    </Typography>
                    <Typography component="span" fontWeight="bold">
                      {new Date(activeAd.uploadedDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 3,
              pb: 2,
              borderBottom: 2,
              borderColor: "primary.main",
            }}
          >
            <Upload size={24} color="primary" />
            <Typography variant="h5">{AdManagementMessage.sections.addNewAd}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <TextField
                fullWidth
                label={AdManagementMessage.labels.adName}
                value={newAdName}
                onChange={(e) => setNewAdName(e.target.value)}
                placeholder={AdManagementMessage.helper.adNamePlaceholder}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="url"
                label={AdManagementMessage.labels.mediaUrl}
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder={AdManagementMessage.helper.mediaUrlPlaceholder}
                helperText={AdManagementMessage.helper.mediaUrlSupport}
              />
            </Box>

            {!isVideoMedia(newMediaUrl) && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {AdManagementMessage.helper.imageDuration}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Slider
                    value={newDuration}
                    onChange={(_, value) => setNewDuration(value as number)}
                    min={ADVERTISEMENT.minImageDurationSeconds}
                    max={ADVERTISEMENT.maxImageDurationSeconds}
                    sx={{ flex: 1 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      type="number"
                      value={newDuration}
                      onChange={(e) => {
                        const parsedValue = parseInt(e.target.value, 10);
                        if (Number.isNaN(parsedValue)) {
                          setNewDuration(ADVERTISEMENT.minImageDurationSeconds);
                          return;
                        }
                        const clampedValue = Math.max(
                          ADVERTISEMENT.minImageDurationSeconds,
                          Math.min(ADVERTISEMENT.maxImageDurationSeconds, parsedValue),
                        );
                        setNewDuration(clampedValue);
                      }}
                      inputProps={{
                        min: ADVERTISEMENT.minImageDurationSeconds,
                        max: ADVERTISEMENT.maxImageDurationSeconds,
                      }}
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body1" fontWeight="medium">
                      sec
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            {isVideoMedia(newMediaUrl) && (
              <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {AdManagementMessage.helper.videoDetected}
                </Typography>
              </Box>
            )}
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Upload />}
            onClick={handleAddAd}
            sx={{ mt: 4 }}
          >
            {AdManagementMessage.actions.uploadAndAdd}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              pb: 2,
              borderBottom: 2,
              borderColor: "divider",
            }}
          >
              <Typography variant="h5">{AdManagementMessage.sections.adLibrary}</Typography>
            <Typography variant="body2" color="text.secondary">
              {ads.length} {ads.length === 1 ? "ad" : "ads"} in library
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ads.map((ad) => (
              <Card
                key={ad.id}
                variant="outlined"
                sx={{
                  borderWidth: 2,
                  borderColor: ad.isActive ? "primary.main" : "transparent",
                  "&:hover": { boxShadow: 2 },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", gap: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ position: "relative", mb: 1 }}>
                        <Typography variant="h6" sx={{ pr: 8 }}>
                          {ad.adName}
                        </Typography>
                        {ad.isActive && (
                          <Chip
                            label="ACTIVE"
                            color="primary"
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              fontWeight: "bold",
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          fontWeight="semibold"
                          sx={{ mb: 0.5, wordBreak: "break-all" }}
                        >
                          {ad.mediaUrl}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            typography: "caption",
                            color: "text.secondary",
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="caption">
                            {AdManagementMessage.labels.duration}: <strong>{ad.duration}s</strong>
                          </Typography>
                          <Typography variant="caption">
                            {AdManagementMessage.labels.schedule}:{" "}
                            <strong>
                              {ad.scheduleEnabled
                                ? `Every ${ad.scheduleIntervalMinutes} min`
                                : AdManagementMessage.helper.scheduleDisabled}
                            </strong>
                          </Typography>
                          <Typography variant="caption">
                            {AdManagementMessage.labels.uploaded}:{" "}
                            <strong>{new Date(ad.uploadedDate).toLocaleDateString()}</strong>
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        <Button
                          variant={ad.isActive ? "contained" : "outlined"}
                          size="small"
                          startIcon={<Radio size={16} />}
                          onClick={() => handleSetActiveAd(ad.id)}
                        >
                          {ad.isActive ? AdManagementMessage.actions.active : AdManagementMessage.actions.setActive}
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Play size={16} />}
                          onClick={() => handlePreview(ad)}
                        >
                          {AdManagementMessage.actions.preview}
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={ad.isActive}
                        >
                          {AdManagementMessage.actions.delete}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={testAdOpen} onClose={() => setTestAdOpen(false)} maxWidth={false} fullWidth fullScreen>
        <DialogContent
          sx={{
            p: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "black",
          }}
        >
          {previewedAd && (
            <>
              {previewedAd.mediaUrl.includes("youtube.com") || previewedAd.mediaUrl.includes("youtu.be") ? (
                <iframe
                  src={convertToYouTubeEmbed(previewedAd.mediaUrl)}
                  title="Ad Preview - YouTube"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : validatedDriveUrl ? (
                <iframe
                  src={validatedDriveUrl}
                  title="Ad Preview - Google Drive"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  sandbox="allow-same-origin allow-scripts allow-presentation"
                />
              ) :
                previewedAd.mediaUrl.includes("drive.google.com") ||
                  previewedAd.mediaUrl.includes("docs.google.com") ||
                  previewedAd.mediaUrl.includes("drive.googleusercontent.com") ? (
                <Typography variant="body1" color="white">
                  Unable to preview this Google Drive URL.
                </Typography>
              ) : isVideoMediaType(previewedAd.mediaType) ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                >
                  <source src={previewedAd.mediaUrl} type={previewedAd.mediaType || undefined} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Box
                  component="img"
                  src={previewedAd.mediaUrl}
                  alt={previewedAd.adName ? `Ad preview: ${previewedAd.adName}` : "Ad preview"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
