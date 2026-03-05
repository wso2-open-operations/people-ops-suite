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

import { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Modal
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { Employee } from "@root/src/utils/types";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTheme } from "@mui/material/styles";
import CustomizedTimeline from "@root/src/component/common/TimeLine";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { fetchEmployees } from "@slices/employeeSlice/employee";
import { insertPromotions } from "@slices/promotionSlice/promotion"; 
import { fetchActivePromotionCycle } from "@slices/promotionCycleSlice/promotionCycle";
import { RootState, useAppDispatch, useAppSelector } from "@root/src/slices/store";

export default function Request() {
        
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const employee  = useAppSelector((state: RootState) => state.employee);
    const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [recommendedJobBand, setRecommendedJobBand] = useState<number | null>(null);
    const [recommendationText, setRecommendationText] = useState<string>("");
    const isSubmitDisabled = recommendedJobBand === null;
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchAllEmployees = async () => {
        setSelectedEmployee(null);
        setRecommendedJobBand(null);
        setRecommendationText('');

        dispatch(fetchActivePromotionCycle());
    
        dispatch(fetchEmployees({
            statusArray: ["OPEN"]
        }));
    };

    useEffect(() => {
        fetchAllEmployees();
    }, []);


    const handleEmployeeChange = (event: any, value: Employee | null) => {
    setSelectedEmployee(value);
    if (value) {
        setRecommendedJobBand(null);
    }
    };

    const handleRecommendedJobBandChange = (event: SelectChangeEvent<string>) => {
    const newValue = Number(event.target.value);
    setRecommendedJobBand(newValue);
    };

    const handleRecommendationChange = (value: string) => {
    setRecommendationText(value);
    };

    const handleOpenDialog = () => {
        setIsDialogOpen(true);
    }
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    }

    const handleSubmit = () => {
        const encodedStatement = safeBase64Encode(recommendationText);

        if (
            promotionCycle.activePromotionCycle?.id &&
            recommendedJobBand &&
            selectedEmployee?.workEmail
        ){
            dispatch(insertPromotions({
                PromotionCycleID: promotionCycle.activePromotionCycle.id,
                type: "INDIVIDUAL_CONTRIBUTOR",
                promotingJobBand: recommendedJobBand,
                employeeEmail: selectedEmployee.workEmail,
                statement: encodedStatement
            }));
        }

        setSelectedEmployee(null);
        setRecommendedJobBand(null);
        setRecommendationText('');

    };

  const safeBase64Encode = (str: string): string => {
    try {
      // First encode the string to UTF-8
      const utf8Bytes = new TextEncoder().encode(str);
      // Convert UTF-8 bytes to binary string
      const binaryString = Array.from(utf8Bytes)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      // Use btoa on the binary string
      return btoa(binaryString);
    } catch (e) {
      console.error("Encoding error:", e);
      // Fallback: remove problematic characters
      const cleanStr = str.replace(/[^\x00-\x7F]/g, "");
      return btoa(cleanStr);
    }
  };

  const handleRefresh = () => {
    setSelectedEmployee(null);
    fetchAllEmployees();
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100%",
        paddingTop: "40px",
        backgroundColor: theme.palette.background.default,
        gap: 4,
      }}
    >
      <Box
        sx={{
          px: 4,
          display: "flex",
          width: "100%",
          gap: 60
        }}
      >
        <Box 
          sx={{
            mr: 11
          }}
        >
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Autocomplete
          sx={{ width: 400}}
          options={employee.employees}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.workEmail})`}
          filterOptions={createFilterOptions({
            stringify: (option) => `${option.firstName} ${option.lastName} ${option.workEmail}`,
          })}
          
          onChange={handleEmployeeChange}
          renderInput={(params) => <TextField {...params} fullWidth label="Search Employee" variant="outlined" />}
          renderOption={(props, option) => {
            const initials = option?.firstName?.charAt(0)?.toUpperCase() || "";
            return (
              <li
                {...props}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                }}
              >
                {option.employeeThumbnail ? (
                  <img
                    src={option.employeeThumbnail}
                    alt={option.firstName}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      marginRight: 8,
                    }}
                    loading="lazy"
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: 14,
                      marginRight: 1,
                      bgcolor: "#74b3ce",
                    }}
                  >
                    {initials}
                  </Avatar>
                )}
                <div>
                  <div>{`${option.firstName} ${option.lastName}`}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{option.workEmail}</div>
                </div>
              </li>
            );
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          width: '100%',
          paddingBottom: 3,
        }}
      >
        {selectedEmployee && (
                <Box sx={{ m: 4, justifyItems: "center"}}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      width: "100%",
                      maxWidth: "1500px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      boxShadow: 2,
                    }}
                  >
                    <Avatar
                      alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                      src={selectedEmployee.employeeThumbnail}
                      sx={{ ml: 7,width: 100, height: 100 }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        flexGrow: 1,
                        gap: 20,
                        flexWrap: "nowrap",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        ml: 7
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Employee Name
                        </Typography>
                        <Typography variant="body1" noWrap>
                          {selectedEmployee.firstName} {selectedEmployee.lastName}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Employee Email
                        </Typography>
                        <Typography variant="body1" noWrap>
                          {selectedEmployee.workEmail}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Current Job Band
                        </Typography>
                        <Typography variant="body1" noWrap>
                          {selectedEmployee.jobBand}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 140, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={500}
                          sx={{ mb: 0.5 }}
                        >
                          Recommended Job Band
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={recommendedJobBand !== null ? String(recommendedJobBand) : ''}
                            onChange={handleRecommendedJobBandChange}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              <em>Select band</em>
                            </MenuItem>
                            {[...Array(13)].map(
                              (_, index) =>
                                index > selectedEmployee.jobBand && (
                                  <MenuItem key={index} value={String(index)}>
                                    {index}
                                  </MenuItem>
                                )
                            )}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        View History
                      </Typography>
                      <IconButton
                        color="primary"
                        aria-label="View Promotion History"
                        onClick={handleOpenDialog}
                        sx={{ minWidth: 36, height: 36 }}
                      >
                        <OpenInNewRoundedIcon />
                      </IconButton>
                    </Box>
                  </Paper>


                  <Box sx={{ justifyItems: "left", width: "100%", maxWidth: "1500px", mt: 5 }}>
                    <Typography variant="h6" gutterBottom>
                      Add Recommendation for Promotion
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Explain in detail why you would like to recommend the individual for a promotion.
                      Provide specific examples that showcase strong work ethic, skill set, leadership,
                      maturity, etc.
                    </Typography>

                    <Alert severity="warning" sx={{ mb: 3 }}>
                      If you are experiencing any errors when copying the content from g-doc, please make
                      sure to add the content to a text editor/note and copy it from there before
                      submitting the statement.
                    </Alert>

                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        '& .quill': {
                          bgcolor: 'white',
                          width: "100%"
                        },
                        '& .ql-container': {
                          minHeight: '200px',
                          width: "100%",
                          fontSize: '14px',
                        },
                        '& .ql-editor': {
                          minHeight: '200px',
                          width: "100%"
                        },
                        width: "100%"
                      }}
                    >
                      <ReactQuill
                        value={recommendationText}
                        onChange={handleRecommendationChange}
                        theme="snow"
                        modules={{
                          toolbar: [
                            [{ header: '1' }, { header: '2' }, { font: [] }],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['bold', 'italic', 'underline'],
                            ['link'],
                            [{ align: [] }],
                            [{ color: [] }, { background: [] }],
                            [{ script: 'sub' }, { script: 'super' }],
                            ['blockquote', 'code-block'],
                          ],
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            

            {selectedEmployee && (
              <Box
                sx={{
                  px: 4,
                  py: 2.5,
                  bgcolor: 'grey.50',
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 4,
                }}
              >
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  size="large"
                  disabled={isSubmitDisabled}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    bgcolor: 'grey.900',
                    '&:hover': {
                      bgcolor: 'grey.800',
                    },
                  }}
                >
                  Submit
                </Button>
              </Box>
            )}
            <Modal open={isDialogOpen} onClose={handleCloseDialog}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '1200px',
                    maxWidth: '1200px',
                    height: '700px',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    outline: 'none',
                  }}
                >
                  <Box
                    sx={{
                      padding: '16px',
                      borderBottom: '1px solid #ccc',
                    }}
                  >
                    <Typography variant="h6">Promotion History</Typography>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px',
                    }}
                  >

                    {selectedEmployee ? (
                      <CustomizedTimeline employeeEmail={selectedEmployee.workEmail} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Please select an employee to view promotion history.
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      padding: '16px',
                      borderTop: '1px solid #ccc',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Button onClick={handleCloseDialog} variant="outlined">Close</Button>
                  </Box>
                </Box>
              </Modal>
      </Box>
    </Box>

  );
}
