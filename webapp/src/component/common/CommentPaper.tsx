// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import DOMPurify from "dompurify";
import { Paper, Typography, useTheme } from "@mui/material";
import { SANITIZE_CONFIG } from "@config/constant";
import { tokens } from "../../theme";

interface CommentPaperProps {
  comment?: string | null;
  refKey?: React.RefObject<HTMLDivElement>;
}

const CommentPaper: React.FC<CommentPaperProps> = ({ comment, refKey }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // HTML entity decoder using browser APIs
  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Sanitize the current value for initial render
  const sanitizedContent = comment ? DOMPurify.sanitize(decodeHTMLEntities(comment), SANITIZE_CONFIG) : "N/A";

  return (
    <div ref={refKey}>
      <Paper
        variant="outlined"
        sx={{
          padding: 1,
          bgcolor: colors.primary[400],
          width: "auto",
          maxHeight: "1500px",
          overflowY: "auto",
        }}
      >
        <Typography
          variant="body1"
          className="ql-editor"
          component={"div"}
          sx={{
            fontSize: "12px",
            lineHeight: "1.4",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-all",
            "&.ql-editor, & .ql-editor": {
              fontSize: "12px",
              lineHeight: "1.4",
              padding: 0,
              margin: 0,
            },
            "& ul, & ol": {
              paddingLeft: "1.5em",
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            "& li": {
              display: "list-item",
              padding: "0.2em 0",
              "& p": { margin: 0 },
            },
            "& ul": {
              listStyleType: "disc",
              "& ul": {
                listStyleType: "circle",
                "& ul": { listStyleType: "square" },
              },
            },
            "& ol": {
              listStyleType: "decimal",
              "& ol": {
                listStyleType: "lower-alpha",
                "& ol": { listStyleType: "lower-roman" },
              },
            },
            "& ul ul, & ol ol, & ul ol, & ol ul": {
              margin: "0.2em 0",
              paddingLeft: "1.5em",
            },
            "& .ql-indent-1": { paddingLeft: "3em" },
            "& .ql-indent-2": { paddingLeft: "6em" },
            "& .ql-indent-3": { paddingLeft: "9em" },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </Paper>
    </div>
  );
};

export default CommentPaper;
