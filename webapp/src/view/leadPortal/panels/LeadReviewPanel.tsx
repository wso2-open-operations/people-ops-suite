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

import {
  Box,
  Link,
  Card,
  Grid,
  Chip,
  Alert,
  Button,
  Tooltip,
  Checkbox,
  MenuItem,
  TextField,
  Accordion,
  IconButton,
  CardHeader,
  Typography,
  InputAdornment,
  FormControlLabel,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  selectEmployeeRatings,
  fetchParRatingOfEmployee,
  updateParRatingOfEmployee,
  selectEmployeeRatingStatus,
  updateSelectedParLeadComment,
} from "@slices/employeeSlice/employee";
import "jspdf-autotable";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import * as yup from "yup";
import { useFormik } from "formik";
import utc from "dayjs/plugin/utc";
import autoTable, { RowInput } from "jspdf-autotable";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import { useEffect, useRef, useState } from "react";
import { selectUserEmail } from "@slices/authSlice/auth";
import CardContent from "@mui/material/CardContent";
import LaunchIcon from "@mui/icons-material/Launch";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import NoDataView from "@component/common/NoDataView";
import CommentPaper from "@component/common/CommentPaper";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch, useAppSelector } from "@slices/store";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CustomRichTextField from "@component/common/CustomRichText";
import ThreeSixtyFeedbackSection from "../components/FeedbackComponent";
import { base64Regex, SnackMessage, uiMessages } from "@config/constant";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { top5p20pEnabledRating, evidenceEnabledRating } from "@config/config";
import {
  fetchReviews,
  selectThreeSixtyReviews,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import {
  enqueueSnackbarMessage,
  ShowSnackBarMessage,
} from "@slices/commonSlice/common";
import { set } from "lodash";
import { ParSpecialRating, ParLeadStatus, ParEmployeeStatus, parRatingNotAssigned } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { RequestState } from "@root/src/utils/types";
dayjs.extend(utc);

interface LeadReviewPanelProps {
  employeeId: string;
  cycle: Partial<ParCycle>;
  isAdminAuditViewOn?: boolean;
  isAdminHistoryViewOn?: boolean;
}

export const LeadReviewPanel = ({
  employeeId,
  cycle,
  isAdminAuditViewOn,
  isAdminHistoryViewOn,
}: LeadReviewPanelProps) => {
  const dispatch = useAppDispatch();
  const lastChangeTimestamp = useRef(Date.now());
  const userEmail = useAppSelector(selectUserEmail);
  const empCommentRef = useRef<HTMLDivElement>(null);
  const leadCommentRef = useRef<HTMLDivElement>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const adminCommentRef = useRef<HTMLDivElement>(null);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const employeeParRating = useAppSelector(selectEmployeeRatings);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const closeParShareDialog = () => setIsParShareDialogOpen(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const threeSixtyReviews = useAppSelector(selectThreeSixtyReviews);
  const [parShareDialogOpen, setIsParShareDialogOpen] = useState(false);
  const [employeeParShareDialogOpen, setIsEmployeeParShareDialogOpen] =
    useState(false);
  const [isAdminsSelfProfile, setIsAdminsSelfProfile] = useState(false);
  const employeeParRatingStatus = useAppSelector(selectEmployeeRatingStatus);
  const [isEditLeadReviewDialogOpen, setIsEditLeadReviewDialogOpen] =
    useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  // Employee part only submit
  const openEmployeeParShareDialog = () => {
    setSubmitting(false);
    setIsEmployeeParShareDialogOpen(true);
  };

  const openParShareDialog = () => {
    setSubmitting(false);
    setIsParShareDialogOpen(true);
  };

  const validationSchema = yup.object().shape({
    parLeadComment: isAdminAuditViewOn
      ? yup
          .string()
          .trim()
          .test("is-not-empty-html", "Required", (value) => {
            const textContent = value
              ?.replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .trim();
            return (
              textContent !== "" &&
              textContent !== null &&
              textContent !== undefined
            );
          })
          .notRequired()
      : yup
          .string()
          .trim()
          .test("is-not-empty-html", "Required", (value) => {
            const textContent = value
              ?.replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .trim();
            return (
              textContent !== "" &&
              textContent !== null &&
              textContent !== undefined
            );
          })
          .required("Required"),
    parRating: yup.string().trim().required("Required"),
    parAdminComment: yup
      .string()
      .trim()
      .test("is-not-empty-html", "Invalid input", (value) => {
        if (!value) return true;
        const cleaned = value
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        return cleaned.length > 0;
      })
      .notRequired(),
    parEmployeeComment: yup
      .string()
      .trim()
      .test("is-not-empty-html", "Required", (value) => {
        const textContent = value
          ?.replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        return (
          textContent !== "" &&
          textContent !== null &&
          textContent !== undefined
        );
      })
      .required("Required"),
    parPerformanceNoticeAck: yup
      .string()
      .trim()
      .when(["parRating", "isEvidenceDiscussionConfirmed"], {
        is: (parRating: string, confirmed: boolean) =>
          parRating === evidenceEnabledRating && confirmed,
        then: (schema) => schema.required("Required"),
        otherwise: (schema) => schema.notRequired(),
      }),
  });

  const {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    setTouched,
    setFieldTouched,
    setFieldValue,
    submitCount,
    dirty,
    resetForm,
  } = useFormik({
    initialValues: {
      parLeadComment: "",
      parRating: "",
      parSpecialRating: ParSpecialRating.NONE,
      parAdminComment: "",
      parEmployeeComment: employeeParRating?.parEmployeeComment || "",
      parPerformanceNoticeAck: employeeParRating?.parPerformanceNoticeAck || "",
      isEvidenceDiscussionConfirmed: false,
    },
    validationSchema,

    onSubmit: () => {
      openParShareDialog();
    },
  });

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const updateParRating = async (
    status: ParLeadStatus,
    onSuccess: () => void
  ) => {
    setSubmitting(true);

    const parLeadComment = btoa(encodeURIComponent(values.parLeadComment));
    const formValues: {
      parLeadStatus: ParLeadStatus;
      parLeadComment: string;
      parRating?: string;
      parSpecialRating?: ParSpecialRating;
      parAdminComment?: string;
      parEmployeeComment?: string;
      parEmployeeStatus?: ParEmployeeStatus;
      parPerformanceNoticeAck?: string;
    } = {
      parLeadStatus: status,
      parLeadComment,
    };

    formValues.parSpecialRating = values.parSpecialRating;

    if (values.parRating !== parRatingNotAssigned && values.parRating !== "") {
      formValues.parRating = values.parRating;
    }

    if (isAdminAuditViewOn) {
      if (values.parAdminComment?.trim()) {
        formValues.parAdminComment = btoa(
          encodeURIComponent(values.parAdminComment)
        );
      }
      formValues.parEmployeeComment = btoa(
        encodeURIComponent(values.parEmployeeComment)
      );
      formValues.parEmployeeStatus = ParEmployeeStatus.SHARED;
    }

    if (values.parPerformanceNoticeAck !== "") {
      formValues.parPerformanceNoticeAck = values.parPerformanceNoticeAck;
    }

    const resultAction = await dispatch(
      updateParRatingOfEmployee({
        employeeId: employeeId,
        parCycleId: cycle.parCycleId,
        parRatingId: employeeParRating.parRatingId,
        values: formValues,
      })
    );

    if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
      onSuccess();
    }

    setSubmitting(false);
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return null;

    const statusConfig: Record<
      string,
      {
        label: string;
        color: "default" | "info" | "warning" | "success" | "error";
      }
    > = {
      PENDING: { label: "Pending", color: "info" },
      DRAFT: { label: "Draft", color: "warning" },
      SHARED: { label: "Shared", color: "success" },
    };

    const config = statusConfig[status] ?? {
      label: status,
      color: "default",
    };

    return (
      <Chip
        size="small"
        label={config.label}
        color={config.color}
        sx={{ ml: 1 }}
      />
    );
  };

  const updateEmployeeParRating = async (
    status: ParLeadStatus,
    onSuccess: () => void
  ) => {
    setSubmitting(true);

    const parLeadComment = btoa(encodeURIComponent(values.parLeadComment));
    const formValues: {
      parAdminComment?: string;
      parEmployeeComment?: string;
      parEmployeeStatus?: ParEmployeeStatus;
      parPerformanceNoticeAck?: string;
    } = {};

    if (isAdminAuditViewOn) {
      if (values.parAdminComment?.trim()) {
        formValues.parAdminComment = btoa(
          encodeURIComponent(values.parAdminComment)
        );
      }
      formValues.parEmployeeComment = btoa(
        encodeURIComponent(values.parEmployeeComment)
      );
      formValues.parEmployeeStatus = ParEmployeeStatus.SHARED;
    }

    if (values.parPerformanceNoticeAck !== "") {
      formValues.parPerformanceNoticeAck = values.parPerformanceNoticeAck;
    }

    const resultAction = await dispatch(
      updateParRatingOfEmployee({
        employeeId: employeeId,
        parCycleId: cycle.parCycleId,
        parRatingId: employeeParRating.parRatingId,
        values: formValues,
      })
    );

    if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
      onSuccess();
    }

    setSubmitting(false);
  };

  const updateParRatingAutoSave = async (
    status: ParLeadStatus,
    leadComment: string,
    onSuccess: () => void
  ) => {
    setSubmitting(true);

    const parLeadComment = btoa(encodeURIComponent(leadComment));
    const currentValues = valuesRef.current;

    const formValues: {
      parLeadStatus: ParLeadStatus;
      parLeadComment: string;
      parRating?: string;
      parSpecialRating?: ParSpecialRating;
      parAdminComment?: string;
      parEmployeeComment?: string;
      parEmployeeStatus?: ParEmployeeStatus;
      parPerformanceNoticeAck?: string;
    } = {
      parLeadStatus: status,
      parLeadComment,
    };

    formValues.parSpecialRating = currentValues.parSpecialRating;

    if (
      currentValues.parRating !== parRatingNotAssigned &&
      currentValues.parRating !== ""
    ) {
      formValues.parRating = currentValues.parRating;
    }

    if (isAdminAuditViewOn) {
      if (currentValues.parAdminComment?.trim()) {
        formValues.parAdminComment = btoa(
          encodeURIComponent(currentValues.parAdminComment)
        );
      }
      formValues.parEmployeeComment = btoa(
        encodeURIComponent(currentValues.parEmployeeComment)
      );
      formValues.parEmployeeStatus = ParEmployeeStatus.SHARED;
    }

    if (currentValues.parPerformanceNoticeAck !== "") {
      formValues.parPerformanceNoticeAck =
        currentValues.parPerformanceNoticeAck;
    }

    const resultAction = await dispatch(
      updateParRatingOfEmployee({
        employeeId: employeeId,
        parCycleId: cycle.parCycleId,
        parRatingId: employeeParRating.parRatingId,
        values: formValues,
      })
    );

    if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
      onSuccess();
    }

    setSubmitting(false);
  };

  const handleDraftSubmit = () => {
    if (errors.parLeadComment) {
      setTouched({ parLeadComment: true });
      return;
    }
    updateParRating(ParLeadStatus.DRAFT, async () => {
      if (employeeId && cycle.parCycleId) {
        await dispatch(
          fetchParRatingOfEmployee({ employeeId, parCycleId: cycle.parCycleId })
        );
      }
      dispatch(
        ShowSnackBarMessage(SnackMessage.success.leadParDraftSaved, "success")
      );
    });
  };

  const handleInputChange = (
    value: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = typeof value === "string" ? value : value.target.value;
    setFieldValue("parLeadComment", newValue);

    if (isAdminAuditViewOn) return;
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    const timeout = setTimeout(() => {
      handleAutoSave(newValue);
    }, 5000);

    setAutoSaveTimeout(timeout);
  };
  const clearAutoSaveTimeout = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(undefined);
    }
  };

  const handleAutoSave = (currentContent: string) => {
    console.log("Auto saving...");
    console.log(employeeParRating?.parLeadStatus);
    if (isAdminAuditViewOn) {
      return; // NO AUTO SAVE
    }
    const saveTimestamp = Date.now();
    const currentValues = {
      parLeadComment: currentContent,
      parRating: valuesRef.current.parRating,
      parSpecialRating: valuesRef.current.parSpecialRating,
    };

    updateParRatingAutoSave(ParLeadStatus.DRAFT, currentContent, async () => {
      if (lastChangeTimestamp.current <= saveTimestamp) {
        dispatch(updateSelectedParLeadComment(currentValues));
        setIsDraftSaved(true);

        setTimeout(() => {
          setIsDraftSaved(false);
        }, 2000);
      }
    });
  };

  const handleRatingChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    handleChange(event);

    if (value !== top5p20pEnabledRating) {
      setFieldValue("parSpecialRating", ParSpecialRating.NONE);
      setIsCheckboxChecked(false);
    }

    if (value !== evidenceEnabledRating) {
      setFieldValue("parPerformanceNoticeAck", "");
      setFieldValue("isEvidenceDiscussionConfirmed", false);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const handleConfirmationProceed = () => {
    clearAutoSaveTimeout(); // Clear any pending auto-save
    setSubmitting(true);

    updateParRating(ParLeadStatus.SHARED, async () => {
      closeParShareDialog();
      setSubmitting(false);
      dispatch(
        ShowSnackBarMessage(SnackMessage.success.shareLeadReview, "success")
      );
      if (cycle?.parCycleId) {
        await dispatch(
          fetchParRatingOfEmployee({ employeeId, parCycleId: cycle.parCycleId })
        );
      }
    });
  };

  const handleEmployeeParConfirmationProceed = () => {
    setSubmitting(true);

    updateEmployeeParRating(ParLeadStatus.SHARED, async () => {
      setIsEmployeeParShareDialogOpen(false);
      setSubmitting(false);
      dispatch(
        ShowSnackBarMessage(SnackMessage.success.shareLeadReview, "success")
      );
      if (cycle?.parCycleId) {
        await dispatch(
          fetchParRatingOfEmployee({ employeeId, parCycleId: cycle.parCycleId })
        );
      }
    });
  };

  const setEditMode = () => {
    setIsReadOnly(false);
    closeEditSharedLeadReviewDialog();
  };

  const clearEditMode = () => {
    setIsReadOnly(true);
    setValues({
      parLeadComment: employeeParRating?.parLeadComment || "",
      parRating: employeeParRating?.parRating || "",
      parSpecialRating:
        employeeParRating?.parSpecialRating || ParSpecialRating.NONE,
      parAdminComment: employeeParRating?.parAdminComment || "",
      parEmployeeComment: employeeParRating?.parEmployeeComment || "",
      parPerformanceNoticeAck: employeeParRating?.parPerformanceNoticeAck || "",
      isEvidenceDiscussionConfirmed: false,
    });
  };

  const openEditLeadReviewDialog = () => setIsEditLeadReviewDialogOpen(true);
  const closeEditSharedLeadReviewDialog = () =>
    setIsEditLeadReviewDialogOpen(false);

  // Handle 360 reviews expand section
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsCheckboxChecked(event.target.checked);
    if (!event.target.checked) {
      setFieldValue("parSpecialRating", ParSpecialRating.NONE);
    }
  };

  const handleInformedCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setFieldValue("isEvidenceDiscussionConfirmed", checked);
    if (!checked) {
      setFieldValue("parPerformanceNoticeAck", "");
      setFieldTouched("parPerformanceNoticeAck", false, false);
    } else {
      setFieldTouched("parPerformanceNoticeAck", false, false);
    }
  };

  useEffect(() => {
    const shouldUpdateForm =
      !dirty ||
      employeeParRating?.parLeadStatus === ParLeadStatus.SHARED ||
      isAdminHistoryViewOn ||
      isAdminAuditViewOn;

    if (shouldUpdateForm) {
      setValues({
        parLeadComment: employeeParRating?.parLeadComment || "",
        parRating: employeeParRating?.parRating
          ? employeeParRating?.parRating === parRatingNotAssigned
            ? ""
            : employeeParRating.parRating
          : "",
        parSpecialRating:
          employeeParRating?.parSpecialRating || ParSpecialRating.NONE,
        parAdminComment: employeeParRating?.parAdminComment || "",
        parEmployeeComment: employeeParRating?.parEmployeeComment || "",
        parPerformanceNoticeAck:
          employeeParRating?.parPerformanceNoticeAck || "",
        isEvidenceDiscussionConfirmed: false,
      });

      if (
        employeeParRating?.parRating === top5p20pEnabledRating &&
        employeeParRating?.parSpecialRating !== ParSpecialRating.NONE
      ) {
        setIsCheckboxChecked(true);
      } else {
        setIsCheckboxChecked(false);
      }
    }

    setIsReadOnly(
      employeeParRating?.parLeadStatus === ParLeadStatus.SHARED ||
        isAdminHistoryViewOn ||
        isAdminAuditViewOn ||
        isDeadlinePassed
    );

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeParRating, isAdminAuditViewOn, isAdminHistoryViewOn, setValues]);

  useEffect(() => {
    resetForm();
    if (cycle?.parCycleId) {
      dispatch(
        fetchParRatingOfEmployee({ employeeId, parCycleId: cycle.parCycleId })
      );
      if (isAdminAuditViewOn && userEmail === employeeId) {
        setIsAdminsSelfProfile(true);
      } else {
        dispatch(fetchReviews({ employeeId, parCycleId: cycle.parCycleId }));
      }
    }

    //change the deadline logic based on the user
    if (isAdminAuditViewOn || isAdminHistoryViewOn) {
      setIsDeadlinePassed(
        dayjs().isAfter(dayjs(cycle.parCycleEndDate).endOf("day"))
      );
    } else {
      setIsDeadlinePassed(
        dayjs().isAfter(dayjs(cycle.parLeadDeadline).endOf("day"))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, cycle.parCycleId]);

  const renderTextField = () => (
    <CustomRichTextField
      name="parEmployeeComment"
      value={values.parEmployeeComment}
      onChange={(value) => {
        if (value !== values.parEmployeeComment) {
          setFieldValue("parEmployeeComment", value);
        }
      }}
      onBlur={handleBlur}
      error={Boolean(touched.parEmployeeComment && errors.parEmployeeComment)}
      helperText={
        touched.parEmployeeComment && errors.parEmployeeComment
          ? errors.parEmployeeComment.toString()
          : ""
      }
      placeholder="Enter your comment here"
      setFieldTouched={setFieldTouched}
    />
  );

  type MessageType = {
    active: string;
    passed: string;
  };

  type MessagesType = {
    [key in ParLeadStatus.PENDING | ParLeadStatus.DRAFT]: MessageType;
  };

  const getLeadFeedbackMessage = (
    status: ParLeadStatus.PENDING | ParLeadStatus.DRAFT,
    isDeadlinePassed: boolean
  ): string => {
    const messages: MessagesType = {
      [ParLeadStatus.PENDING]: {
        active: "Lead's feedback is pending.",
        passed: "Lead's feedback deadline is passed.",
      },
      [ParLeadStatus.DRAFT]: {
        active: "Lead's feedback has drafted.",
        passed: "Lead's feedback has not shared.",
      },
    };

    return messages[status][isDeadlinePassed ? "passed" : "active"];
  };

  const downloadPDF = async () => {
    dispatch(
      enqueueSnackbarMessage({
        message: "Generating the PDF",
        type: "info",
      })
    );

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const formatCommentForPDF = (html: string): string => {
      if (!html) return "-";

      const decoded = base64Regex.test(html)
        ? decodeURIComponent(atob(html))
        : html;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = decoded;

      const rootIndent = "    ";

      const processElement = (element: HTMLElement, depth = 0): string => {
        let result = "";
        const indent = "    ".repeat(depth);

        if (element.tagName === "UL") {
          const items = element.querySelectorAll("li");
          items.forEach((li) => {
            result += `${indent}• ${processElement(
              li as HTMLElement,
              depth + 1
            )}\n`;
          });
          return result;
        }

        if (element.tagName === "OL") {
          const items = element.querySelectorAll("li");
          items.forEach((li, index) => {
            result += `${indent}${index + 1}. ${processElement(
              li as HTMLElement,
              depth + 1
            )}\n`;
          });
          return result;
        }

        if (element.tagName === "LI") {
          return Array.from(element.childNodes)
            .map((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent?.trim() || "";
              }
              return processElement(node as HTMLElement, depth);
            })
            .join(" ")
            .trim();
        }

        if (element.children.length > 0) {
          Array.from(element.children).forEach((child) => {
            result += processElement(child as HTMLElement, depth);
          });
        } else {
          const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
          if (text) result += text + "\n";
        }

        return result;
      };

      const processedContent = processElement(tempDiv);

      return processedContent
        .split("\n")
        .map((line) => (line.trim() ? `${rootIndent}${line}` : line))
        .join("\n");
    };

    const allTableRows = [];

    if (employeeParRating.parEmployeeComment) {
      allTableRows.push([
        "Employee Comment",
        "",
        {
          content: formatCommentForPDF(employeeParRating.parEmployeeComment),
          styles: {
            textColor: [50, 50, 50],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]);
    }

    if (employeeParRating.parLeadComment) {
      allTableRows.push([
        "Lead Comment",
        "",
        {
          content: formatCommentForPDF(employeeParRating.parLeadComment),
          styles: {
            textColor: [50, 50, 50],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]);
    }

    if (employeeParRating.parAdminComment && isAdminAuditViewOn === true) {
      allTableRows.push([
        "Admin Comment",
        "",
        {
          content: formatCommentForPDF(employeeParRating.parAdminComment),
          styles: {
            textColor: [50, 50, 50],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]);
    }

    if (allTableRows.length > 0) {
      allTableRows.push([
        {
          content: "360° Reviews",
          colSpan: 3,
          styles: {
            fontStyle: "bold",
            fillColor: [200, 200, 200],
            halign: "center",
          },
        },
      ]);
    }

    const reviewRows = threeSixtyReviews.map(
      ({ reviewerEmail, reviewRating, reviewComment }) => [
        reviewerEmail ?? "-",
        reviewRating ?? "-",
        {
          content: reviewComment ? formatCommentForPDF(reviewComment) : "-",
          styles: {
            textColor: [50, 50, 50] as [number, number, number],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]
    );

    const finalTableRows = [...allTableRows, ...reviewRows];

    autoTable(doc, {
      head: [
        [
          {
            content: ` - Employee: ${
              employeeMap[employeeParRating.parEmployeeEmail]?.employeeName ??
              employeeParRating.parEmployeeEmail
            }\n - PAR Rating: ${
              employeeParRating.parRating === parRatingNotAssigned
                ? "Not Assigned"
                : employeeParRating.parRating
            }\n - Top 5%/20% Rating: ${
              employeeParRating.parSpecialRating !== ParSpecialRating.NONE
                ? employeeParRating.parSpecialRating
                : "Not Assigned"
            }\n - PAR Shared By: ${
              employeeParRating.parRatingSharedBy
                ? employeeMap[employeeParRating.parRatingSharedBy]
                    ?.employeeName || employeeParRating.parRatingSharedBy
                : "Not Provided"
            }`,
            colSpan: 3,
            styles: {
              halign: "left",
              fontSize: 12,
              cellPadding: { bottom: 10, top: 10 },
            },
          },
        ],
      ],
      showHead: "firstPage",
      body: finalTableRows as RowInput[],
      startY: 30,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60 },
        2: {
          cellWidth: "auto",
          fontStyle: "normal",
        },
      },
    });

    doc.save(`${employeeParRating.parEmployeeEmail}_par_summary.pdf`);
  };

  return (
    <Grid container height={"100%"} spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Box flex="1">
            {isReadOnly &&
              !isAdminHistoryViewOn &&
              (employeeParRating?.parLeadStatus === ParLeadStatus.SHARED ? (
                <Alert severity="success">
                  {uiMessages.alert.leadReviewShared}
                </Alert>
              ) : (
                <Alert severity="info">
                  {uiMessages.alert.leadReviewIsNotShared}
                </Alert>
              ))}

            {isDeadlinePassed &&
              employeeParRating.parLeadStatus != ParLeadStatus.SHARED && (
                <Alert severity="error">
                  {"Lead's feedback deadline is passed"}{" "}
                  {`on: ${dayjs
                    .utc(cycle.parLeadDeadline)
                    .format("D MMM 'YY")}`}
                </Alert>
              )}
            {!isReadOnly &&
              !isAdminAuditViewOn &&
              (employeeParRating.parLeadStatus === ParLeadStatus.DRAFT ? (
                <Alert severity="warning">
                  {uiMessages.alert.employeeParDraftSaved}{" "}
                  {`Please share on or before the deadline: ${dayjs
                    .utc(cycle.parLeadDeadline)
                    .format("D MMM 'YY")}`}
                </Alert>
              ) : employeeParRating.parLeadStatus === ParLeadStatus.PENDING ? (
                <Alert severity="info">
                  {`Please share the lead's feedback before the deadline: ${dayjs
                    .utc(cycle.parLeadDeadline)
                    .format("D MMM 'YY")}`}
                </Alert>
              ) : null)}

            {!isReadOnly && isAdminAuditViewOn && (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" onClick={clearEditMode}>
                    Cancel
                  </Button>
                }
              >
                {employeeParRating.parLeadStatus === ParLeadStatus.SHARED
                  ? uiMessages.alert.leadSharedReviewForceEdit
                  : uiMessages.alert.leadReviewForceEdit}
              </Alert>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {isReadOnly && isAdminAuditViewOn && (
              <Tooltip title="Edit PAR details">
                <IconButton
                  aria-label="edit"
                  onClick={openEditLeadReviewDialog}
                  sx={{
                    p: 1,
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <EditIcon color="primary" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Download PAR details">
              <span>
                <IconButton
                  aria-label="download"
                  onClick={downloadPDF}
                  sx={{
                    p: 1,
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <PictureAsPdfIcon color="primary" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Grid>

      {employeeParRatingStatus === RequestState.LOADING && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}

      {employeeParRatingStatus === RequestState.FAILED && (
        <NoDataView text={SnackMessage.error.fetchThreeSixtyReview} />
      )}

      {employeeParRatingStatus === RequestState.SUCCEEDED && (
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            {/* Lead's Feedback Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title={
                    <Typography variant="h6">
                      Lead's Feedback
                      {isAdminAuditViewOn &&
                        renderStatusChip(employeeParRating?.parLeadStatus)}
                    </Typography>
                  }
                />
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        {!isReadOnly ? (
                          <Box sx={{ position: "relative" }}>
                            <CustomRichTextField
                              name="parLeadComment"
                              value={values.parLeadComment}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              disabled={isSubmitting}
                              error={Boolean(
                                (touched.parLeadComment || submitCount > 0) &&
                                  errors.parLeadComment
                              )}
                              helperText={
                                (touched.parLeadComment || submitCount > 0) &&
                                errors.parLeadComment
                                  ? errors.parLeadComment.toString()
                                  : ""
                              }
                              placeholder="Enter your comment here"
                              setFieldTouched={setFieldTouched}
                              touched={Boolean(touched.parLeadComment)}
                            />
                            {isSubmitting && (
                              <Typography
                                color="text.secondary"
                                sx={{
                                  position: "absolute",
                                  bottom: "-1.5rem",
                                  left: 0,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Saving Draft
                              </Typography>
                            )}
                            {isDraftSaved && (
                              <Typography
                                color="text.secondary"
                                sx={{
                                  position: "absolute",
                                  bottom: "-1.5rem",
                                  left: 0,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Draft Saved
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <>
                            {employeeParRating?.parLeadStatus ===
                            ParLeadStatus.SHARED ? (
                              <CommentPaper
                                comment={employeeParRating?.parLeadComment}
                                refKey={leadCommentRef}
                              />
                            ) : (
                              <NoDataView
                                text={getLeadFeedbackMessage(
                                  employeeParRating.parLeadStatus ??
                                    ParLeadStatus.PENDING,
                                  isDeadlinePassed
                                )}
                              />
                            )}
                          </>
                        )}
                      </Grid>

                      {/* Rating Section */}
                      <Grid
                        container
                        size={{ xs: 12 }}
                        spacing={2}
                        alignItems="center"
                      >
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2">Rating:</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          {!isReadOnly ? (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              name="parRating"
                              label="Select Rating"
                              value={values.parRating}
                              disabled={isSubmitting}
                              onChange={handleRatingChange}
                              onBlur={handleBlur}
                              error={
                                touched.parRating && Boolean(errors.parRating)
                              }
                              helperText={touched.parRating && errors.parRating}
                              variant="outlined"
                              InputProps={{ readOnly: isReadOnly }}
                            >
                              {cycle?.parCycleConfigurations?.parRatings.map(
                                (rating) => (
                                  <MenuItem key={rating} value={rating}>
                                    {rating}
                                  </MenuItem>
                                )
                              )}
                            </TextField>
                          ) : employeeParRating?.parRating !==
                            parRatingNotAssigned ? (
                            <Chip
                              size="small"
                              label={employeeParRating.parRating}
                              sx={{ mt: 1 }}
                            />
                          ) : (
                            <Typography color="text.secondary">N/A</Typography>
                          )}
                        </Grid>
                      </Grid>

                      {/* PAR Shared By Section */}
                      {isReadOnly && employeeParRating.parRatingSharedBy && (
                        <Grid
                          container
                          size={{ xs: 12 }}
                          spacing={2}
                          alignItems="center"
                        >
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body2">
                              PAR shared by:
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <Chip
                              size="small"
                              label={employeeParRating.parRatingSharedBy}
                              sx={{ mt: 1 }}
                            />
                          </Grid>
                        </Grid>
                      )}

                      {/* Discussion Evidence Link */}
                      {isReadOnly &&
                        employeeParRating.parPerformanceNoticeAck &&
                        employeeParRating.parRating ===
                          evidenceEnabledRating && (
                          <Grid size={{ xs: 12 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              Performance gaps were discussed, and the employee
                              has been informed of the "{evidenceEnabledRating}"
                              rating, and at least two discussions were held.
                            </Typography>
                            {employeeParRating.parPerformanceNoticeAck && (
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                {employeeParRating.parPerformanceNoticeAck
                                  .split(/\r?\n/) 
                                  .filter((line) => line.trim() !== "")
                                  .map((line, index) => (
                                    <Link
                                      key={index}
                                      component="button"
                                      variant="body2"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        window.open(line.trim(), "_blank");
                                      }}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        textAlign: "left",
                                        gap: 1,
                                      }}
                                    >
                                      <LaunchIcon fontSize="small" />
                                      {line}
                                    </Link>
                                  ))}
                              </Box>
                            )}
                          </Grid>
                        )}

                      {/* Checkbox for Top 5%/20% Rating */}
                      {!isReadOnly &&
                        values.parRating === top5p20pEnabledRating && (
                          <Grid size={{ xs: 12 }} >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isCheckboxChecked}
                                  onChange={handleCheckboxChange}
                                  name="enableRating"
                                  disabled={isSubmitting}
                                />
                              }
                              label="The Top 5% / 20% rating decision was discussed and finalized with the functional lead"
                            />
                          </Grid>
                        )}

                      {/* Checkbox for Proof Provider Rating */}
                      {!isReadOnly &&
                        values.parRating === evidenceEnabledRating && (
                          <>
                            <Grid size={{ xs: 12 }} >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={
                                      values.isEvidenceDiscussionConfirmed
                                    }
                                    onChange={handleInformedCheckboxChange}
                                    name="isEvidenceDiscussionConfirmed"
                                    disabled={isSubmitting}
                                  />
                                }
                                label={`Performance gaps were discussed, and the employee has been informed of the "${evidenceEnabledRating}" rating,
                          and at least two discussions were held.`}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                fullWidth
                                multiline
                                label="Discussion Evidence"
                                disabled={
                                  !values.isEvidenceDiscussionConfirmed ||
                                  isSubmitting
                                }
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LinkIcon />
                                    </InputAdornment>
                                  ),
                                }}
                                placeholder="Attach the link to the relevant discussion evidence document"
                                variant="standard"
                                name="parPerformanceNoticeAck"
                                value={values.parPerformanceNoticeAck}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={Boolean(
                                  touched.parPerformanceNoticeAck &&
                                    errors.parPerformanceNoticeAck
                                )}
                                helperText={
                                  touched.parPerformanceNoticeAck &&
                                  errors.parPerformanceNoticeAck
                                }
                              />
                            </Grid>
                          </>
                        )}

                      {/* Special Rating Section */}
                      {values.parRating === top5p20pEnabledRating && (
                        <Grid
                          container
                          size={{ xs: 12 }}
                          spacing={2}
                          alignItems="center"
                        >
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="body2">
                              Top 5%/20% Rating:
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            {!isReadOnly ? (
                              <TextField
                                disabled={!isCheckboxChecked || isSubmitting}
                                select
                                size="small"
                                fullWidth
                                name="parSpecialRating"
                                label="Select Top 5%/20% Rating"
                                value={values.parSpecialRating}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={
                                  touched.parSpecialRating &&
                                  Boolean(errors.parSpecialRating)
                                }
                                helperText={
                                  touched.parSpecialRating &&
                                  errors.parSpecialRating
                                }
                                variant="outlined"
                              >
                                <MenuItem value={ParSpecialRating.NONE}>
                                  N/A
                                </MenuItem>
                                <MenuItem
                                  value={ParSpecialRating.TOP_FIVE_PERCENT}
                                >
                                  Top 5%
                                </MenuItem>
                                <MenuItem
                                  value={ParSpecialRating.TOP_TWENTY_PERCENT}
                                >
                                  Top 20%
                                </MenuItem>
                              </TextField>
                            ) : employeeParRating?.parSpecialRating !==
                              ParSpecialRating.NONE ? (
                              <Chip
                                size="small"
                                label={
                                  employeeParRating.parSpecialRating ===
                                  ParSpecialRating.TOP_FIVE_PERCENT
                                    ? "Top 5%"
                                    : employeeParRating.parSpecialRating ===
                                      ParSpecialRating.TOP_TWENTY_PERCENT
                                    ? "Top 20%"
                                    : "N/A"
                                }
                              />
                            ) : (
                              <Typography color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      )}

                      {/* Warning Message */}
                      {!isAdminAuditViewOn &&
                        !isAdminHistoryViewOn &&
                        [
                          ParEmployeeStatus.DRAFT,
                          ParEmployeeStatus.PENDING,
                        ].includes(employeeParRating.parEmployeeStatus) && (
                          <Grid size={{ xs: 12 }} >
                            <Typography
                              color="warning.main"
                              textAlign="right"
                              sx={{ mb: 1 }}
                            >
                              {uiMessages.warning.leadShareDisable}
                            </Typography>
                          </Grid>
                        )}

                      {/* Action Buttons */}
                      {!isAdminHistoryViewOn && (
                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                          <Box display="flex" justifyContent="flex-end" gap={2}>
                            {!isAdminAuditViewOn &&
                              employeeParRating.parLeadStatus !==
                                ParLeadStatus.SHARED && (
                                <Button
                                  disabled={
                                    isSubmitting ||
                                    isReadOnly ||
                                    (isDeadlinePassed && !isAdminAuditViewOn) ||
                                    !(
                                      (values.parLeadComment !==
                                        employeeParRating.parLeadComment &&
                                        !errors?.parLeadComment) ||
                                      (values.parRating !==
                                        employeeParRating.parRating &&
                                        values.parRating !== "") ||
                                      values.parSpecialRating !==
                                        employeeParRating.parSpecialRating
                                    )
                                  }
                                  variant="outlined"
                                  onClick={() => handleDraftSubmit()}
                                >
                                  Save draft
                                </Button>
                              )}
                            {!isReadOnly && (
                              <Button
                                variant="contained"
                                type="submit"
                                disabled={
                                  isSubmitting ||
                                  isReadOnly ||
                                  (isDeadlinePassed && !isAdminAuditViewOn) ||
                                  (employeeParRating.parEmployeeStatus ===
                                    ParEmployeeStatus.PENDING &&
                                    !isAdminAuditViewOn) ||
                                  (values.parRating === evidenceEnabledRating &&
                                    (!values.isEvidenceDiscussionConfirmed ||
                                      !values.parPerformanceNoticeAck))
                                }
                              >
                                {!isAdminAuditViewOn
                                  ? "Share"
                                  : "Save and Share"}
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </form>

                  <ConfirmationDialog
                    open={parShareDialogOpen}
                    onClose={closeParShareDialog}
                    title={uiMessages.dialog.leadParShare.title}
                    message={`If you share this review, your feedback will be made available to ${
                      employeeMap[employeeId]?.employeeName ?? employeeId
                    }. Do you wish to continue?`}
                    okText={uiMessages.dialog.leadParShare.okText}
                    onConfirm={handleConfirmationProceed}
                    ariaLabelledby="alert-lead-par-share-title"
                    ariaDescribedby="alert-lead-par-share-description"
                    showLoading={true}
                    isLoading={isSubmitting}
                  />

                  <ConfirmationDialog
                    open={employeeParShareDialogOpen}
                    onClose={() => setIsEmployeeParShareDialogOpen(false)}
                    title={uiMessages.dialog.employeeParShare.title}
                    message={`If you share this review, your will be share on behalf of ${
                      employeeMap[employeeId]?.employeeName ?? employeeId
                    }. Do you wish to continue?`}
                    okText={uiMessages.dialog.leadParShare.okText}
                    onConfirm={handleEmployeeParConfirmationProceed}
                    ariaLabelledby="alert-lead-par-share-title"
                    ariaDescribedby="alert-lead-par-share-description"
                    showLoading={true}
                    isLoading={isSubmitting}
                  />

                  <ConfirmationDialog
                    open={isEditLeadReviewDialogOpen}
                    onClose={closeEditSharedLeadReviewDialog}
                    title={
                      employeeParRating.parLeadStatus === ParLeadStatus.SHARED
                        ? uiMessages.dialog.editSharedReviews.title
                        : uiMessages.dialog.editLeadReview.title
                    }
                    message={
                      employeeParRating.parLeadStatus === ParLeadStatus.SHARED
                        ? uiMessages.dialog.editSharedReviews.message
                        : uiMessages.dialog.editLeadReview.message
                    }
                    okText={
                      employeeParRating.parLeadStatus === ParLeadStatus.SHARED
                        ? uiMessages.dialog.editSharedReviews.okText
                        : uiMessages.dialog.editLeadReview.okText
                    }
                    onConfirm={setEditMode}
                    ariaLabelledby="alert-lead-par-edit-title"
                    ariaDescribedby="alert-lead-par-edit-description"
                    isWarning={true}
                  />
                </CardContent>
              </Card>
            </Grid>
            {/* Employee PAR Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6">Employee PAR</Typography>
                      {isAdminAuditViewOn &&
                        renderStatusChip(employeeParRating?.parEmployeeStatus)}
                    </Box>
                  }
                />
                <CardContent>
                  {!employeeParRating?.parEmployeeComment ? (
                    isReadOnly || !isAdminAuditViewOn ? (
                      <NoDataView text="Employee PAR hasn't been shared" />
                    ) : (
                      renderTextField()
                    )
                  ) : isReadOnly || !isAdminAuditViewOn ? (
                    <CommentPaper
                      comment={employeeParRating.parEmployeeComment}
                      refKey={empCommentRef}
                    />
                  ) : (
                    renderTextField()
                  )}
                </CardContent>

                {isAdminAuditViewOn && (
                  <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                      {!isReadOnly && (
                        <Button
                          onClick={openEmployeeParShareDialog}
                          variant="contained"
                          type="button"
                          disabled={
                            isSubmitting ||
                            isReadOnly ||
                            (isDeadlinePassed && !isAdminAuditViewOn) ||
                            (employeeParRating.parEmployeeStatus ===
                              ParEmployeeStatus.PENDING &&
                              !isAdminAuditViewOn) ||
                            (values.parRating === evidenceEnabledRating &&
                              (!values.isEvidenceDiscussionConfirmed ||
                                !values.parPerformanceNoticeAck))
                          }
                        >
                          {isAdminAuditViewOn ? "Share" : "Save and Share"}
                        </Button>
                      )}
                    </Box>
                  </Grid>
                )}
              </Card>
            </Grid>
            {/* Admin Comment Section */}
            {(isAdminAuditViewOn || isAdminHistoryViewOn) && (
              <Grid size={{ xs: 12 }} >
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Admin Comment</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!isReadOnly ? (
                      <CustomRichTextField
                        name="parAdminComment"
                        value={values.parAdminComment}
                        onChange={(value) => {
                          if (value !== values.parAdminComment) {
                            setFieldValue("parAdminComment", value);
                          }
                        }}
                        onBlur={handleBlur}
                        error={Boolean(
                          values.parAdminComment && errors.parAdminComment
                        )}
                        helperText={
                          touched.parAdminComment && errors.parAdminComment
                            ? errors.parAdminComment.toString()
                            : ""
                        }
                        placeholder="Enter your comment here"
                        setFieldTouched={setFieldTouched}
                      />
                    ) : employeeParRating?.parAdminComment ? (
                      <CommentPaper
                        comment={employeeParRating?.parAdminComment}
                        refKey={adminCommentRef}
                      />
                    ) : (
                      <NoDataView text="Admin comment unavailable" />
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
            {/* 360 Feedback Section */}
            <Grid size={{ xs: 12 }} >
              <ThreeSixtyFeedbackSection
                isAdminsSelfProfile={isAdminsSelfProfile}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};
