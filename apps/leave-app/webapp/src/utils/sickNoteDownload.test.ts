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

import { describe, expect, it } from "vitest";

import { SICK_NOTE_ERROR, messageFromErrorText, sickNoteExtension } from "@utils/sickNoteDownload";

describe("sickNoteExtension", () => {
  it("maps the allowed content types", () => {
    expect(sickNoteExtension("application/pdf")).toBe(".pdf");
    expect(sickNoteExtension("image/jpeg")).toBe(".jpg");
    expect(sickNoteExtension("image/png")).toBe(".png");
  });
  it("returns empty for unknown types", () => {
    expect(sickNoteExtension("text/plain")).toBe("");
    expect(sickNoteExtension("")).toBe("");
  });
});

describe("messageFromErrorText", () => {
  it("returns the message from a JSON body", () => {
    expect(messageFromErrorText('{"message":"Sick note was deleted"}')).toBe("Sick note was deleted");
  });
  it("falls back for invalid JSON, missing or empty message", () => {
    expect(messageFromErrorText("not json")).toBe(SICK_NOTE_ERROR);
    expect(messageFromErrorText("{}")).toBe(SICK_NOTE_ERROR);
    expect(messageFromErrorText('{"message":""}')).toBe(SICK_NOTE_ERROR);
    expect(messageFromErrorText("null")).toBe(SICK_NOTE_ERROR);
  });
});
