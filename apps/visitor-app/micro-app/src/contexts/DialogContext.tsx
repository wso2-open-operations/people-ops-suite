// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import { createContext, ReactNode, useContext, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
}

interface DialogContextType {
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
  ) => void;
  hideConfirmation: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Confirm",
    cancelText: string = "Cancel",
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  const hideConfirmation = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    dialog.onConfirm();
    hideConfirmation();
  };

  return (
    <DialogContext.Provider value={{ showConfirmation, hideConfirmation }}>
      {children}
      <Dialog
        open={dialog.isOpen}
        onClose={hideConfirmation}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
            mx: 3,
            maxWidth: 384,
            width: "100%",
          },
        }}
        sx={{ zIndex: 9999 }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: "#4B5064",
            fontSize: "1.125rem",
            pb: 0.5,
          }}
        >
          {dialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#7E87AD" }}>
            {dialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={hideConfirmation}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              color: "#6C7496",
              bgcolor: "#F4F6F9",
              borderRadius: "8px",
              px: 2,
              "&:hover": { bgcolor: "#E9EBF5" },
            }}
          >
            {dialog.cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              color: "#FFFFFF",
              bgcolor: "#FF7300",
              borderRadius: "8px",
              px: 2,
              "&:hover": { bgcolor: "#FF8C33" },
            }}
          >
            {dialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
