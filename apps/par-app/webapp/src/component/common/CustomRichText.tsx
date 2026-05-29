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

import React, { ChangeEvent, useState } from "react";

import DOMPurify from "dompurify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { SANITIZE_CONFIG } from "@config/constant";

interface CustomRichTextFieldProps {
  value: string;
  name: string;
  onChange: (value: string | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: boolean;
  placeholder?: string;
  helperText?: string | false;
  id?: string;
  touched?: boolean;
  setFieldTouched: (field: string, touched: boolean) => void;
  onBlur?: (event: any) => void;
  handleChange?: (event: any) => void;
  disabled?: boolean;
}

const CustomRichTextField: React.FC<CustomRichTextFieldProps> = ({
  value,
  name,
  onChange,
  placeholder,
  error = false,
  helperText = "Required",
  id = "richTextEditor",
  touched = false,
  setFieldTouched,
  onBlur,
  handleChange,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const theme = useTheme();
  const showError = error && (isFocused || touched);

  // HTML entity decoder using browser APIs
  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Sanitize the current value for initial render
  const sanitizedContent = DOMPurify.sanitize(decodeHTMLEntities(value), SANITIZE_CONFIG);

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
      matchers: [],
    },
  };

  const formats = ["bold", "italic", "underline", "list", "indent"];

  const handleTextChange = (newValue: string) => {
    const decoded = decodeHTMLEntities(newValue);
    const sanitized = DOMPurify.sanitize(decoded, SANITIZE_CONFIG);

    if (handleChange) {
      const simulatedEvent = {
        target: {
          name,
          value: sanitized,
        },
      };
      handleChange(simulatedEvent);
    }
    onChange(sanitized);
  };

  const handleBlurEvent = () => {
    setIsFocused(false);
    if (setFieldTouched && name) {
      setFieldTouched(name, true);
    }
    if (onBlur) {
      const syntheticEvent = {
        target: { name },
        type: "blur",
      };
      onBlur(syntheticEvent);
    }
  };

  return (
    <>
      {showError && (
        <Typography variant="caption" color="error">
          {helperText}
        </Typography>
      )}
      <Stack
        sx={{
          height: "auto",
          maxHeight: "50vh",
          minHeight: "10vh",
          borderRadius: "4px",

          "& .quill": {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "inherit",
            border: showError
              ? `1px solid ${theme.palette.error.main}`
              : `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
          },
          "& .ql-container": {
            fontSize: "inherit",
            fontFamily: "inherit",
            height: "auto",
            flex: 1,
            minHeight: 0,
            border: "none",
            display: "flex",
            flexDirection: "column",
          },
          "& .ql-editor": {
            flex: 1,
            overflow: "hidden auto !important",
            minHeight: 0,
            padding: "12px 15px",
            overflowWrap: "break-word",
            wordBreak: "normal",
            textAlign: "justify !important",
            color: theme.palette.text.primary,
            backgroundColor: "transparent",
            "&.ql-blank::before": {
              color: theme.palette.text.secondary,
              fontStyle: "italic",
            },
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
              display: "block",
            },
            "&::-webkit-scrollbar-track": {
              background: theme.palette.background.default,
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.text.disabled,
              borderRadius: "4px",
              "&:hover": {
                background: theme.palette.text.secondary,
              },
            },
            "& ul, & ol": {
              paddingLeft: "1.5em",
            },
            "& ul > li, & ol > li": {
              paddingLeft: "0.5em",
            },
            "& ul ul, & ol ol, & ul ol, & ol ul": {
              marginBottom: 0,
              paddingLeft: "1.5em",
            },
            "& ul ul ul, & ol ol ol": {
              paddingLeft: "2em",
            },
          },
          "& .ql-toolbar": {
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: `1px solid ${theme.palette.divider}`,
            padding: "8px 15px",
            flexShrink: 0,
            backgroundColor: "transparent",
            "& .ql-stroke": {
              stroke: theme.palette.text.secondary,
            },
            "& .ql-fill": {
              fill: theme.palette.text.secondary,
            },
            "& .ql-picker-label": {
              color: theme.palette.text.secondary,
            },
            "& button:hover .ql-stroke, & .ql-active .ql-stroke": {
              stroke: theme.palette.primary.main,
            },
            "& button:hover .ql-fill, & .ql-active .ql-fill": {
              fill: theme.palette.primary.main,
            },
            "& button:hover .ql-picker-label, & .ql-active .ql-picker-label": {
              color: theme.palette.primary.main,
            },
          },
          "& .ql-container.ql-snow, & .ql-toolbar.ql-snow": {
            border: "none",
          },
        }}
      >
        <ReactQuill
          key={placeholder}
          theme="snow"
          value={sanitizedContent}
          onChange={handleTextChange}
          placeholder={placeholder}
          id={id}
          modules={modules}
          formats={formats}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlurEvent}
          readOnly={disabled}
        />
      </Stack>
    </>
  );
};

export default CustomRichTextField;
