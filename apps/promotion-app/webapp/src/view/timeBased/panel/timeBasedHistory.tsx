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

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button,  
  IconButton, 
  Modal, 
  Paper,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import StateWithImage from '@root/src/component/ui/StateWithImage';
import { LoadingEffect } from "@component/ui/Loading";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchRecommendation } from "@slices/recommendationSlice/recommendation";

const statusColorMap: Record<string, string> = {
  REQUESTED: '#e3f2fd',
  ACTIVE: '#c8e6c9',
  SUBMITTED: '#dcedc8',
  DRAFT: '#f0f4c3',
  DECLINED: '#ffcdd2',
  WITHDRAW: '#ffe0b2',
  REMOVED: '#e0e0e0',
  FL_APPROVED: '#b2dfdb',
  APPROVED: '#a5d6a7',
  FL_REJECTED: '#f8bbd0',
  REJECTED: '#ef9a9a',
  EXPIRED: '#d7ccc8',
  PROCESSING: '#fff9c4',
};

export default function TimeBaseHistory() {

    const dispatch = useAppDispatch();
    const recommendation  = useAppSelector((state: RootState) => state.recommendation);
    const [selectedNoteHtml, setSelectedNoteHtml] = useState<string>('');
    const [open, setOpen] = useState(false);
    const auth = useAppSelector((state: RootState) => state.auth);


    const fetchPromotions = async () => {
      try {
        if (auth.userInfo?.email){
          dispatch(fetchRecommendation({
            leadEmail: auth.userInfo?.email,
            statusArray: ["SUBMITTED", "DECLINED", "EXPIRED"]
          }));
        }
      } catch (error) {
        console.error("Failed to fetch promotion requests:", error);
      }
      
    };
  
    useEffect(() => {
      fetchPromotions();
    }, []);
    
    const filteredRecs = recommendation.recommendations?.filter(
      (rec) => rec.promotionType === "TIME_BASED"
    ) || [];


    // Optional: reuse your encoding function for generating test data
    const  safeBase64Encode = (str: string): string => {
      try {
        const utf8Bytes = new TextEncoder().encode(str);
        const binaryString = Array.from(utf8Bytes).map((byte) => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
      } catch (e) {
        console.error("Encoding error:", e);
        const cleanStr = str.replace(/[^\x00-\x7F]/g, "");
        return btoa(cleanStr);
      }
    }

    // Base64 Decode function (reverse of your encode logic)
    const safeBase64Decode = (base64Str: string): string => {
        try {
          // Decode base64 to binary string
          const binaryString = atob(base64Str);
          // Convert binary string to Uint8Array
          const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
          // Decode UTF-8 bytes back to string
          return new TextDecoder().decode(bytes);
        } catch (error) {
          console.error('Decoding error:', error);
          return 'Invalid content';
        }
    };

  const handleOpen = (base64EncodedNote: string) => {
    const decodedHtml = safeBase64Decode(base64EncodedNote);
    setSelectedNoteHtml(decodedHtml);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedNoteHtml('');
  };

  const handleRefresh = () => {
    fetchPromotions();
  }

  return (

    <>
      <Box
        sx={{
          p: 5
        }}
      >

        {recommendation.state != "loading" && (
          <Box 
            sx={{ 
                display: "flex", 
                justifyContent: "flex-start", 
                mb: 2 
            }}
          >
            <IconButton 
                onClick={handleRefresh}
            >
                <RefreshRoundedIcon />
            </IconButton>
        </Box>
        )}

        {recommendation.state === "loading" && (
            <LoadingEffect message={"Loading Time Base Promotion Hisroty"} />
        )}

        {recommendation.state === "success" && (
          <>
            {recommendation.recommendations && 
            recommendation.recommendations?.length > 0 ? (
              <>
                <Typography variant="h5" sx={{ mb: 3 }}>
                  Promotion History
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Full Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Promotion Cycle</strong></TableCell>
                        <TableCell><strong>Lead Status</strong></TableCell>
                        <TableCell><strong>Promotion Status</strong></TableCell>
                        <TableCell><strong>Recommendation</strong></TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredRecs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No submissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecs.map((rec) => (
                          <TableRow key={rec.recommendationID}>
                            <TableCell>{rec.employeeName}</TableCell>
                            <TableCell>{rec.employeeEmail}</TableCell>
                            <TableCell>{rec.promotionCycle}</TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  backgroundColor:
                                    statusColorMap[rec.promotionType] || '#eeeeee',
                                  color: '#000',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: '12px',
                                  display: 'inline-block',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {rec.recommendationStatus}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  backgroundColor:
                                    statusColorMap[rec.promotionRequestStatus] || '#eeeeee',
                                  color: '#000',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: '12px',
                                  display: 'inline-block',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {rec.promotionRequestStatus}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() =>
                                  handleOpen(
                                    rec.recommendationStatement
                                      ? rec.recommendationStatement
                                      : safeBase64Encode(
                                          '<strong>User does not have any recommendations!</strong>'
                                        )
                                  )
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Modal open={open} onClose={handleClose}>
                    <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        backgroundColor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                    >
                    <Typography variant="h6">Recommendation</Typography>

                    <Box
                      sx={{
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        padding: 2,
                        backgroundColor: '#fafafa',
                        fontSize: '0.95rem'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedNoteHtml }}
                    />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button variant="contained" onClick={handleClose}>Close</Button>
                      </Box>
                    </Box>
                </Modal> 
              </>
              ) : (
                <Box
                  sx={{
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    justifyContent:"center",
                    height:"300px",
                    textAlign:"center",
                    mt: 10
                  }}
                >
                  <img
                    src={""}
                    alt="No records found"
                    style={{ width: '250px', opacity: 0.8 }}
                  />
                  <Typography variant="subtitle1" color="text.secondary" mt={2}>
                    No records found
                  </Typography>
                </Box>
              )} 
          </>    
        )}

        {recommendation.state === "failed" && (
            <Box
                sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                "& img": {
                    width: 360,
                    height: "auto",
                },
                }}
            >
                <StateWithImage
                    imageUrl={require("@root/src/assets/images/error.svg").default}
                    message="Unable to load Time Base Promotion Hisroty."
                />
            </Box>
        )}
      </Box>
    </>
  );
}