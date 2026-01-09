import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useState } from "react";

import { useSubmitFeedbackMutation } from "@root/src/services/menu.api";

interface FeedbackForm {
  handleCloseFeedback: () => void;
}

const FeedbackForm = (props: FeedbackForm) => {
  const { handleCloseFeedback } = props;
  const [submitFeedback] = useSubmitFeedbackMutation();

  const [isFocused, setIsFocused] = useState(false);

  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(12, 0, 0, 0);
  const endTime = new Date(now);
  endTime.setHours(16, 15, 0, 0);

  const validationSchema = Yup.object({
    message: Yup.string()
      .min(10, "Feedback must be at least 10 characters")
      .required("Feedback is required"),
  });

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const theme = useTheme();

  const formik = useFormik({
    initialValues: { message: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await submitFeedback({ message: values.message }).unwrap();
        resetForm();
        handleCloseFeedback();
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isFeedbackTime = now >= startTime && now <= endTime;

  if (!isFeedbackTime) {
    return (
      <Typography
        variant="body1"
        sx={{
          "& strong": {
            fontWeight: 500,
            color: "#000",
          },
        }}
      >
        Feedback is anonymous and accepted only on today <strong>({date})</strong> from
        <strong> 12:00PM - 04:15PM</strong>
      </Typography>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        id="feedback-message"
        name="message"
        label="Share your feedback"
        variant="outlined"
        multiline
        rows={4}
        value={formik.values.message}
        onChange={formik.handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          formik.handleBlur(e);
        }}
        error={!isFocused && formik.touched.message && Boolean(formik.errors.message)}
        helperText={!isFocused && formik.touched.message && formik.errors.message}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            minHeight: "100px",
            padding: "16px 12px",
            alignItems: "flex-start",
            borderRadius: "8px",
            "& fieldset": {
              borderColor: "#E6E6E6",
            },
            "&:hover fieldset": {
              borderColor: "#ccc",
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.customBorder.secondary.active,
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: 0,
          },
          // Label styling (default state)
          "& .MuiInputLabel-root": {
            color: theme.palette.customText.primary.p3.active,
            fontSize: "16px",
          },
          // Label when focused
          "& .MuiInputLabel-root.Mui-focused": {
            color: theme.palette.customBorder.secondary.active,
          },
          // Label when filled (shrunk state)
          "& .MuiInputLabel-shrink": {
            color: theme.palette.customBorder.secondary.active,
          },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => {
            formik.resetForm();
          }}
          disabled={formik.isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </Box>
    </Box>
  );
};

export default FeedbackForm;
