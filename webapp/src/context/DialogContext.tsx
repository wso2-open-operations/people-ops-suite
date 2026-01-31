// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useContext, useState } from "react";
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

  const handleOnHide = () => {
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
    message: string | JSX.Element,
    action: () => void,
    okText?: string,
    cancelText?: string,
    isWarning?: boolean,
    inputObj?: InputObj
  ) => void;
};

type ConfirmationModalContextProviderProps = {
  children: React.ReactNode;
};

const ConfirmationModalContext =
  React.createContext<ConfirmationDialogContextType>(
    {} as ConfirmationDialogContextType
  );

const ConfirmationDialogContextProvider = (
  props: ConfirmationModalContextProviderProps
) => {
  const { setShow, show, onHide } = useDialogShow();

  const [comment, setComment] = React.useState("");

  const [content, setContent] = useState<{
    title: string;
    message: string | JSX.Element;
    action: (value?: string) => void;
    okText?: string;
    cancelText?: string;
    isWarning?: boolean;
    inputObj?: InputObj;
  } | null>(null);

  const handleShow = (
    title: string,
    message: string | JSX.Element,
    action: (value?: string) => void,
    okText?: string,
    cancelText?: string,
    isWarning?: boolean,
    inputObj?: InputObj
  ) => {
    setContent({
      title,
      message,
      action,
      okText,
      cancelText,
      isWarning,
      inputObj,
    });
    setShow(true);
  };

  const dialogContext: ConfirmationDialogContextType = {
    showConfirmation: handleShow,
  };

  const handleOk = (value?: string) => {
    content && content.action(value);
    Reset();
    onHide();
  };

  const handleCancel = () => {
    Reset();
    onHide();
  };

  const Reset = () => {
    setContent({
      title: "",
      message: "",
      action: () => {},
      okText: undefined,
      cancelText: undefined,
      isWarning: false,
    });

    setComment("");
  };

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setComment(event.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ConfirmationModalContext.Provider value={dialogContext}>
        {props.children}
        {content && (
          <Dialog
            style={{ padding: 10, boxShadow: "none" }}
            open={show}
            onClose={onHide}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle
              id="alert-dialog-title"
              className="dialogtitle"
              fontSize={"16px"}
            >
              {content.title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText
                id="alert-dialog-description"
                className="dialog-body"
                fontSize={"14px"}
              >
                {content.message}
              </DialogContentText>
              {content.inputObj && (
                <div style={{ paddingTop: "20px" }}>
                  {content.inputObj.type === "textarea" && (
                    <>
                      <TextField
                        fullWidth
                        value={comment}
                        label={content.inputObj?.label}
                        multiline
                        inputProps={{ maxLength: 250 }}
                        maxRows={6}
                        onChange={onChange}
                      />
                      <Typography variant="h6" color="gray" sx={{ mt: 1 }}>
                        {comment.length}/250{" "}
                      </Typography>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
            <DialogActions
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: 10,
                marginTop: 0,
              }}
            >
              <Button
                onClick={handleCancel}
                className="dialogno"
                size="large"
                variant="outlined"
                color={content.isWarning ? "error" : "primary"}
              >
                {content.cancelText ? content.cancelText : "No"}
              </Button>
              <Button
                disabled={content.inputObj?.mandatory && comment === ""}
                onClick={() =>
                  content.inputObj ? handleOk(comment) : handleOk()
                }
                autoFocus
                className="dialogyes"
                size="large"
                variant="contained"
                color={content.isWarning ? "error" : "primary"}
              >
                {content.okText ? content.okText : "Yes"}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </ConfirmationModalContext.Provider>
    </LocalizationProvider>
  );
};

const useConfirmationModalContext = (): ConfirmationDialogContextType =>
  useContext(ConfirmationModalContext);

export { useDialogShow, useConfirmationModalContext };

export default ConfirmationDialogContextProvider;
