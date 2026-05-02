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

import * as React from "react";
import { useContext, useState } from "react";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import SendIcon from "@mui/icons-material/Send";
import UploadIcon from "@mui/icons-material/Upload";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { ConfirmationType } from "@/types/types";

type InputObj = {
  label: string;
  mandatory: boolean;
  type: "textarea" | "date";
};

type UseConfirmationDialogShowReturnType = {
  show: boolean;
  setShow: (value: boolean) => void;
  onHide: () => void;
};

const useDialogShow = (): UseConfirmationDialogShowReturnType => {
  const [show, setShow] = useState(false);

  const handleOnHide: () => void = () => {
    setShow(false);
  };

  return {
    show,
    setShow,
    onHide: handleOnHide,
  };
};

type ConfirmationDialogContextType = {
  showConfirmation: (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: () => void,
    okText?: string,
    cancelText?: string,
    inputObj?: InputObj,
  ) => void;
};

type ConfirmationModalContextProviderProps = {
  children: React.ReactNode;
};

const ConfirmationModalContext = React.createContext<ConfirmationDialogContextType | null>(null);

const typeIconMap: Record<ConfirmationType, React.ReactElement> = {
  [ConfirmationType.accept]: <CheckCircleOutlineIcon color="primary" />,
  [ConfirmationType.send]: <SendIcon color="primary" />,
  [ConfirmationType.update]: <SaveAltIcon color="primary" />,
  [ConfirmationType.upload]: <UploadIcon color="primary" />,
};

const typeButtonIconMap: Record<ConfirmationType, React.ReactElement> = {
  [ConfirmationType.accept]: <CheckCircleOutlineIcon />,
  [ConfirmationType.send]: <SendIcon />,
  [ConfirmationType.update]: <SaveAltIcon />,
  [ConfirmationType.upload]: <UploadIcon />,
};

const ConfirmationModalContextProvider: React.FC<ConfirmationModalContextProviderProps> = (props) => {
  const { setShow, show, onHide } = useDialogShow();
  const [comment, setComment] = React.useState("");

  const [content, setContent] = useState<{
    title: string;
    message: string | React.ReactNode;
    type: ConfirmationType;
    action: (value?: string) => void;
    okText?: string;
    cancelText?: string;
    inputObj?: InputObj;
  }>({
    title: "",
    message: "",
    type: ConfirmationType.accept,
    action: () => {},
  });

  const handleShow = (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: (value?: string) => void,
    okText?: string,
    cancelText?: string,
    inputObj?: InputObj,
  ) => {
    setContent({ title, message, type, action, okText, cancelText, inputObj });
    setShow(true);
  };

  const dialogContext: ConfirmationDialogContextType = {
    showConfirmation: handleShow,
  };

  const handleOk = (value?: string) => {
    content && content.action(value);
    onHide();
  };

  const handleCancel = () => {
    setContent({ title: "", message: "", type: ConfirmationType.accept, action: () => {} });
    setComment("");
    onHide();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ConfirmationModalContext.Provider value={dialogContext}>
        {props.children}
        <Dialog open={show} onClose={handleCancel} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              {typeIconMap[content.type]}
              <Typography variant="h6" fontWeight={600}>
                {content.title}
              </Typography>
            </Box>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {content.message}
            </Typography>

            {content.inputObj && (
              <TextField
                sx={{ mt: 2 }}
                fullWidth
                value={comment}
                label={content.inputObj.label}
                type="text"
                size="small"
                multiline
                rows={2}
                maxRows={6}
                onChange={onChange}
              />
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pt: 1.5, pb: 3, gap: 1 }}>
            <Button onClick={handleCancel} variant="outlined" fullWidth>
              {content.cancelText ?? "No"}
            </Button>
            <LoadingButton
              variant="contained"
              fullWidth
              disabled={content.inputObj?.mandatory && comment === ""}
              onClick={() => (content.inputObj ? handleOk(comment) : handleOk())}
              loadingPosition="start"
              startIcon={typeButtonIconMap[content.type]}
            >
              {content.okText ?? "Yes"}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </ConfirmationModalContext.Provider>
    </LocalizationProvider>
  );
};

const useConfirmationModalContext = (): ConfirmationDialogContextType => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error("useConfirmationModalContext must be used within a ConfirmationModalContextProvider");
  }
  return context;
};

export { useDialogShow, useConfirmationModalContext };

export default ConfirmationModalContextProvider;
