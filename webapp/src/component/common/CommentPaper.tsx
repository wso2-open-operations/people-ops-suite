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
import { Paper, Typography } from "@mui/material";
import DOMPurify from "dompurify";

import React from "react";

import { SANITIZE_CONFIG } from "@config/constant";

interface CommentPaperProps {
  comment?: string | null;
  refKey?: React.RefObject<HTMLDivElement | null>;
}

const CommentPaper: React.FC<CommentPaperProps> = ({ comment, refKey }) => {

  // HTML entity decoder using browser APIs
  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Sanitize the current value for initial render
  const sanitizedContent = comment
    ? DOMPurify.sanitize(decodeHTMLEntities(comment), SANITIZE_CONFIG)
    : "N/A";

  return (
    <div ref={refKey}>
      <Paper
        variant="outlined"
        sx={{
          padding: 1,
          bgcolor: "background.default",
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
