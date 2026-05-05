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
import { Dialog, DialogContent, IconButton } from "@mui/material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { CheckCircle, Play, Radio, Trash2, Upload, X } from "@wso2/oxygen-ui-icons-react";
import { useSnackbar } from "notistack";

import { useCallback, useEffect, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { ADVERTISEMENT } from "@config/feature";
import { AdManagementMessage } from "@config/messages";
import {
  activateAdvertisement,
  addAdvertisement,
  deactivateAdvertisement,
  deleteAdvertisement,
  fetchAdvertisements,
} from "@slices/advertisementSlice/advertisement";
import type { Advertisement } from "@slices/advertisementSlice/advertisement";
import { useAppDispatch, useAppSelector } from "@slices/store";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function AdManagementPanel() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const { advertisements } = useAppSelector((state) => state.advertisement);

  const [newAdName, setNewAdName] = useState("");
  const [newDuration, setNewDuration] = useState<number>(ADVERTISEMENT.defaultImageDurationSeconds);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [testAdOpen, setTestAdOpen] = useState(false);
  const [previewedAd, setPreviewedAd] = useState<Advertisement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    dispatch(fetchAdvertisements());
  }, [dispatch]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      enqueueSnackbar("Only JPEG, PNG, and GIF images are allowed.", { variant: "error" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      enqueueSnackbar("Image must be smaller than 10 MB.", { variant: "error" });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [enqueueSnackbar]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleAddAd = async () => {
    if (!newAdName.trim()) {
      enqueueSnackbar(AdManagementMessage.snackbar.adNameRequired, { variant: "warning" });
      return;
    }
    if (!previewBase64) {
      enqueueSnackbar("Please select an image.", { variant: "warning" });
      return;
    }

    try {
      const payload = {
        adName: newAdName.trim(),
        mediaData: previewBase64,
        mediaType: selectedFile!.type,
        durationSeconds: newDuration,
      };

      await dispatch(addAdvertisement(payload)).unwrap();
      await dispatch(fetchAdvertisements());
      enqueueSnackbar(AdManagementMessage.snackbar.adAddedSuccess, { variant: "success" });
      setNewAdName("");
      clearFile();
      setNewDuration(ADVERTISEMENT.defaultImageDurationSeconds);
    } catch {
      enqueueSnackbar(AdManagementMessage.snackbar.adAddedFailed, { variant: "error" });
    }
  };

  const handleSetActiveAd = (adId: string, isActive: boolean) => {
    const action = isActive ? deactivateAdvertisement(adId) : activateAdvertisement(adId);
    dispatch(action)
      .unwrap()
      .then(() => {
        enqueueSnackbar(
          isActive
            ? AdManagementMessage.snackbar.deactivatedSuccess
            : AdManagementMessage.snackbar.activeUpdatedSuccess,
          { variant: "success" },
        );
      })
      .catch(() => {
        enqueueSnackbar(
          isActive
            ? AdManagementMessage.snackbar.deactivatedFailed
            : AdManagementMessage.snackbar.activeUpdatedFailed,
          { variant: "error" },
        );
      });
  };

  const handleDeleteAd = (adId: string) => {
    const adToDelete = advertisements.find((ad) => ad.id === adId);

    if (adToDelete?.isActive) {
      enqueueSnackbar(AdManagementMessage.snackbar.deleteActiveBlocked, {
        variant: "warning",
      });
      return;
    }

    dispatch(deleteAdvertisement(adId))
      .unwrap()
      .then(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.adDeletedSuccess, { variant: "success" });
      })
      .catch(() => {
        enqueueSnackbar(AdManagementMessage.snackbar.adDeletedFailed, { variant: "error" });
      });
  };

  const handlePreview = (ad: Advertisement) => {
    setPreviewedAd(ad);
    setTestAdOpen(true);
  };

  useEffect(() => {
    if (!testAdOpen || !previewedAd) return;

    const timeout = setTimeout(
      () => {
        setTestAdOpen(false);
      },
      Math.max(
        previewedAd.duration ?? ADVERTISEMENT.defaultImageDurationSeconds,
        ADVERTISEMENT.minPreviewImageSeconds,
      ) * 1000,
    );

    return () => clearTimeout(timeout);
  }, [testAdOpen, previewedAd]);

  const activeAd = advertisements.find((ad) => ad.isActive);

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
                <Box sx={{ display: "flex", gap: 3, typography: "body2", mt: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography component="span" sx={{ opacity: 0.9 }}>
                      {AdManagementMessage.labels.displayDuration}:{" "}
                    </Typography>
                    <Typography component="span" fontWeight="bold">
                      {activeAd.duration}s
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
        <CardContent sx={{ p: 3, pl: 3 }}>
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

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
            <Box sx={{ maxWidth: 500 }}>
              <TextField
                fullWidth
                label={AdManagementMessage.labels.adName}
                value={newAdName}
                onChange={(e) => setNewAdName(e.target.value)}
                placeholder={AdManagementMessage.helper.adNamePlaceholder}
                sx={{ mb: 2 }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                startIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 2 }}
              >
                {selectedFile ? "Change image" : "Choose image"}
              </Button>

              {selectedFile && (
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    component="img"
                    src={previewBase64 || ""}
                    alt="Preview"
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="semibold">
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(0)} KB · {selectedFile.type}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={clearFile} sx={{ ml: "auto" }}>
                    <X size={16} />
                  </IconButton>
                </Box>
              )}

              <TextField
                type="number"
                label="Duration (seconds)"
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
                sx={{ width: 180 }}
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            size="medium"
            startIcon={<Upload size={16} />}
            onClick={handleAddAd}
            sx={{ mt: 4 }}
            disabled={!selectedFile || !newAdName.trim()}
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
              {advertisements.length} {advertisements.length === 1 ? "ad" : "ads"} in library
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {advertisements.map((ad) => (
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
                    <Box
                      component="img"
                      src={ad.mediaData}
                      alt={ad.adName}
                      sx={{
                        width: 120,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: 1,
                        borderColor: "divider",
                        flexShrink: 0,
                      }}
                    />
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

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          typography: "caption",
                          color: "text.secondary",
                          flexWrap: "wrap",
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="caption">
                          {AdManagementMessage.labels.duration}: <strong>{ad.duration}s</strong>
                        </Typography>
                        <Typography variant="caption">
                          {AdManagementMessage.labels.uploaded}:{" "}
                          <strong>{new Date(ad.uploadedDate).toLocaleDateString()}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        <Button
                          variant={ad.isActive ? "contained" : "outlined"}
                          size="small"
                          startIcon={<Radio size={16} />}
                          onClick={() => handleSetActiveAd(ad.id, ad.isActive)}
                        >
                          {ad.isActive
                            ? AdManagementMessage.actions.deactivate
                            : AdManagementMessage.actions.setActive}
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

      <Dialog
        open={testAdOpen}
        onClose={() => setTestAdOpen(false)}
        maxWidth={false}
        fullWidth
        fullScreen
      >
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
              <IconButton
                onClick={() => setTestAdOpen(false)}
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
              <Box
                component="img"
                src={previewedAd.mediaData}
                alt={previewedAd.adName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
