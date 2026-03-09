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

import { useEffect, useState } from 'react';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Modal, 
  Box, 
  Typography,
  Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import StateWithImage from '@root/src/component/ui/StateWithImage';
import { LoadingEffect } from "@component/ui/Loading";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchPromotions } from "@slices/promotionSlice/promotion";
import DOMPurify from 'dompurify';

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


export default function SubmissionHistory() {

    const dispatch = useAppDispatch();
    const auth = useAppSelector((state: RootState) => state.auth);
    const submissionHistory = useAppSelector((state: RootState) => state.promotion);

    const [open, setOpen] = useState(false);
    const [selectedNoteHtml, setSelectedNoteHtml] = useState<string>('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = () => {

        dispatch(fetchPromotions({
            employeeEmail: auth.userInfo?.email,
            type: "INDIVIDUAL_CONTRIBUTOR",
            recommendedBy: auth.userInfo?.email,
        }));

    }

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

    function safeBase64Encode(str: string): string {
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

    const handleOpen = (base64EncodedNote: string) => {
        const decodedHtml = safeBase64Decode(base64EncodedNote);
        setSelectedNoteHtml(DOMPurify.sanitize(decodedHtml));
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedNoteHtml('');
    };

    const handleRefresh = () => {
        fetchHistory();
    }

  return (
    <Box
        sx={{
            p: 5
        }}
    >
        {submissionHistory.state != "loading" && (
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
            {submissionHistory.state === "loading" && (
                <LoadingEffect message={"Loading Promotion History"} />
            )}

            {submissionHistory.state === "success" &&
             submissionHistory.promotions &&
             submissionHistory.promotions?.length > 0 && (
                <Box>
                    <TableContainer component={Paper}>
                        <Table>
                        <TableHead>
                            <TableRow>
                            <TableCell>Promotion Cycle</TableCell>
                            <TableCell>Employee Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Recommendation To</TableCell>
                            <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {submissionHistory.promotions.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    '&:hover': {
                                    backgroundColor: '#fcf7ed',
                                    cursor: 'pointer',
                                    },
                                }}
                                >
                                <TableCell>{row.promotionCycle}</TableCell>
                                <TableCell>{row.employeeEmail}</TableCell>
                                <TableCell>
                                    <Box
                                        sx={{
                                        backgroundColor: statusColorMap[row.status] || '#eeeeee',
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
                                        {row.status}
                                    </Box>
                                </TableCell>
                                <TableCell>{row.nextJobBand}</TableCell>
                                <TableCell>
                                <IconButton onClick={() => handleOpen(
                                    row.recommendations.length > 0 && row.recommendations[0].recommendationStatement
                                    ? row.recommendations[0].recommendationStatement
                                    : safeBase64Encode("<strong>User does not have any recommendations!</strong>"))}>
                                    <VisibilityIcon />
                                </IconButton>
                                </TableCell>
                            </TableRow>
                            ))}
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
                </Box>
            )}

            {submissionHistory.state === "failed" && (
                <StateWithImage
                    imageUrl=""
                    message="Unable to load promotion history."
                />
            )}
    </Box>
  );
}