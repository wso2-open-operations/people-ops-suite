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
  IconButton,
  Slider,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { CheckCircle, Moon, Play, Radio, Sun, Trash2, Upload } from "@wso2/oxygen-ui-icons-react";

import { useEffect, useState } from "react";

import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";

interface Ad {
  id: string;
  mediaUrl: string;
  duration: number;
  thumbnail: string;
  isActive: boolean;
  uploadedDate: string;
}

export default function AdManagement() {
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newDuration, setNewDuration] = useState(5);
  const [ads, setAds] = useState<Ad[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const resolveMediaType = (mediaUrl: string) => {
    const lower = mediaUrl.toLowerCase();
    if (lower.endsWith(".mp4")) return "video/mp4";
    if (lower.endsWith(".webm")) return "video/webm";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".gif")) return "image/gif";
    return "image/jpeg";
  };

  const mapAdvertisement = (item: {
    id: number;
    mediaUrl: string;
    durationSeconds: number;
    thumbnailUrl?: string | null;
    isActive: boolean;
    uploadedDate: string;
  }): Ad => ({
    id: String(item.id),
    mediaUrl: item.mediaUrl,
    duration: item.durationSeconds,
    thumbnail: item.thumbnailUrl ?? "https://via.placeholder.com/300x180/ff7300/ffffff?text=Ad",
    isActive: item.isActive,
    uploadedDate: item.uploadedDate,
  });

  const loadAdvertisements = async () => {
    const response = await APIService.getInstance().get(AppConfig.serviceUrls.advertisements);
    const list = response.data as Array<{
      id: number;
      mediaUrl: string;
      durationSeconds: number;
      thumbnailUrl?: string | null;
      isActive: boolean;
      uploadedDate: string;
    }>;
    setAds(list.map(mapAdvertisement));
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
          mediaUrl: string;
          durationSeconds: number;
          thumbnailUrl?: string | null;
          isActive: boolean;
          uploadedDate: string;
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
      } catch {}
    };

    loadData();
  }, []);

  const handleAddAd = () => {
    if (!newMediaUrl) {
      alert("Please enter a media URL");
      return;
    }

    const payload = {
      mediaUrl: newMediaUrl,
      mediaType: resolveMediaType(newMediaUrl),
      durationSeconds: newDuration,
      thumbnailUrl: "https://via.placeholder.com/300x180/ff7300/ffffff?text=New+Ad",
    };

    APIService.getInstance()
      .post(AppConfig.serviceUrls.advertisements, payload)
      .then(() => loadAdvertisements())
      .then(() => {
        alert("Ad added successfully");
        setNewMediaUrl("");
        setNewDuration(5);
      })
      .catch(() => {
        alert("Failed to add ad. Please try again.");
      });
  };

  const handleSetActiveAd = (adId: string) => {
    APIService.getInstance()
      .put(`${AppConfig.serviceUrls.advertisements}/${adId}/activate`)
      .then(() => loadAdvertisements())
      .then(() => {
        alert("Active ad updated");
      })
      .catch(() => {
        alert("Failed to activate ad. Please try again.");
      });
  };

  const handleDeleteAd = (adId: string) => {
    const adToDelete = ads.find((ad) => ad.id === adId);

    if (adToDelete?.isActive) {
      alert("Cannot delete active ad. Please select another ad first.");
      return;
    }

    APIService.getInstance()
      .delete(`${AppConfig.serviceUrls.advertisements}/${adId}`)
      .then(() => loadAdvertisements())
      .then(() => {
        alert("Ad deleted successfully");
      })
      .catch(() => {
        alert("Failed to delete ad. Please try again.");
      });
  };

  const handlePreview = (ad: Ad) => {
    alert(
      `Preview Ad:\nURL: ${ad.mediaUrl}\nDuration: ${ad.duration}s\nUploaded: ${new Date(
        ad.uploadedDate,
      ).toLocaleDateString()}`,
    );
  };

  const activeAd = ads.find((ad) => ad.isActive);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ color: "white" }}>
          Ad Management Console
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure dashboard announcements and promotional content
        </Typography>
      </Box>

      {activeAd && (
        <Card sx={{ mb: 4, bgcolor: "primary.main", color: "white" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <CheckCircle size={24} />
              <Typography variant="h6">Currently Active Ad</Typography>
            </Box>
            <Card sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}>
              <CardContent>
                <Typography variant="caption" sx={{ opacity: 0.9 }} gutterBottom>
                  Media URL
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, wordBreak: "break-all" }}>
                  {activeAd.mediaUrl}
                </Typography>
                <Box sx={{ display: "flex", gap: 3, typography: "body2" }}>
                  <Box>
                    <Typography component="span" sx={{ opacity: 0.9 }}>
                      Duration:{" "}
                    </Typography>
                    <Typography component="span" fontWeight="bold">
                      {activeAd.duration}s
                    </Typography>
                  </Box>
                  <Box>
                    <Typography component="span" sx={{ opacity: 0.9 }}>
                      Uploaded:{" "}
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
            <Typography variant="h5">Add New Ad</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <TextField
                fullWidth
                type="url"
                label="Media URL (Video or Image Link)"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="https://example.com/promo-video.mp4"
                helperText="Supported formats: MP4, WebM, JPG, PNG, GIF"
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Display Duration (Seconds)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Slider
                  value={newDuration}
                  onChange={(_, value) => setNewDuration(value as number)}
                  min={1}
                  max={30}
                  sx={{ flex: 1 }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10))}
                    inputProps={{ min: 1, max: 30 }}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body1" fontWeight="medium">
                    sec
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Upload />}
            onClick={handleAddAd}
            sx={{ mt: 4 }}
          >
            Upload & Add to Library
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
            <Typography variant="h5">Ad Library</Typography>
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
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={ad.thumbnail}
                        alt="Ad thumbnail"
                        sx={{
                          width: 192,
                          height: 112,
                          borderRadius: 2,
                          objectFit: "cover",
                        }}
                      />
                      {ad.isActive && (
                        <Chip
                          label="ACTIVE"
                          color="primary"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            fontWeight: "bold",
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
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
                          }}
                        >
                          <Typography variant="caption">
                            Duration: <strong>{ad.duration}s</strong>
                          </Typography>
                          <Typography variant="caption">
                            Uploaded:{" "}
                            <strong>{new Date(ad.uploadedDate).toLocaleDateString()}</strong>
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Button
                          variant={ad.isActive ? "contained" : "outlined"}
                          size="small"
                          startIcon={<Radio size={16} />}
                          onClick={() => handleSetActiveAd(ad.id)}
                        >
                          {ad.isActive ? "Active" : "Set Active"}
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Play size={16} />}
                          onClick={() => handlePreview(ad)}
                        >
                          Preview
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={ad.isActive}
                        >
                          Delete
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
    </Box>
  );
}
