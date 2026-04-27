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
import { Box, Button, CircularProgress, TextField, Typography, useTheme } from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import { useEffect, useState } from "react";

import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@config/constant";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility";
import { NodeType } from "@utils/types";
import { convertDataTypeToLabel } from "@utils/utils";

interface RenameFormValues {
  entityName: string;
}
interface RenameFieldProps {
  nodeType: NodeType;
  currentName: string;
  onRenameSuccess: (entityName: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const RenameField: React.FC<RenameFieldProps> = ({
  nodeType,
  currentName,
  onRenameSuccess,
  isSubmitting = false,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<RenameFormValues>({
    defaultValues: { entityName: currentName },
    mode: "onChange",
  });

  useEffect(() => {
    reset({ entityName: currentName });
    setIsFocused(false);
  }, [currentName, reset]);

  const onSubmit = async ({ entityName }: RenameFormValues) => {
    await onRenameSuccess(entityName);
    setIsFocused(false);
  };

  const showSpinner = useMinimumLoadingVisibility(isSubmitting, SPLIT_VIEW_SKELETON_DELAY_MS);

  const handleCancel = () => {
    reset({ entityName: currentName });
    setIsFocused(false);
  };

  const unitTypeLabel = convertDataTypeToLabel(nodeType);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        paddingX: "4px",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.customText.primary.p3.active,
          fontWeight: 500,
          textTransform: "capitalize",
        }}
      >
        {unitTypeLabel} Name
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <Controller
          name="entityName"
          control={control}
          rules={{
            required: "Name is required",
            minLength: { value: 1, message: "Name must not be empty" },
          }}
          render={({ field, fieldState: { error } }) => (
            <>
              <TextField
                {...field}
                placeholder={`Enter ${unitTypeLabel} name`}
                variant="outlined"
                fullWidth
                error={!!error}
                helperText={error?.message}
                onFocus={() => setIsFocused(true)}
              />
              {isFocused && (
                <Button
                  variant="outlinedBrand"
                  onClick={handleCancel}
                  sx={{ ml: 1, whiteSpace: "nowrap" }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        />

        <Button
          type="submit"
          variant="outlined"
          disabled={isSubmitting || !isDirty || !isValid}
          startIcon={
            showSpinner ? <CircularProgress size={14} thickness={5} color="inherit" /> : undefined
          }
        >
          Rename
        </Button>
      </Box>
    </Box>
  );
};
