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
import CloseIcon from "@mui/icons-material/Close";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";

import React, { useEffect } from "react";

import { ConfirmationType, State } from "@/types/types";
import { useConfirmationModalContext } from "@context/dialogState";
import { addCollections, resetSubmitState } from "@slices/collections/collection";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

interface AddCollectionFormValues {
  collectionName: string;
}

const AddCollectionModal: React.FC<{ toggleClose: () => void }> = ({ toggleClose }) => {
  const dispatch = useAppDispatch();
  const dialogContext = useConfirmationModalContext();
  const collection = useAppSelector((state: RootState) => state.collection);

  const validationSchema = yup.object().shape({
    collectionName: yup.string().required("Collection Name is required"),
  });

  useEffect(() => {
    if (collection.submitState === State.success) {
      dispatch(resetSubmitState()); // Resetting the submit state
      toggleClose();
    }
  }, [collection.submitState, dispatch, toggleClose]);
  const formik = useFormik<AddCollectionFormValues>({
    initialValues: {
      collectionName: "",
    },
    validationSchema: validationSchema,

    onSubmit: (values) => {
      dialogContext.showConfirmation(
        "Do you want to Action 1?",
        "Please note that once done, this cannot be undone.",
        ConfirmationType.send,
        () => {
          dispatch(addCollections({ name: values.collectionName }));
        },
      );
    },
  });

  return (
    <Dialog
      keepMounted={false}
      open={true}
      sx={{
        backdropFilter: "blur(5px)",
        ".MuiDialog-paper": {
          maxWidth: 450,
          minHeight: 500,
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle variant="h5">Add Collection</DialogTitle>

      <DialogContent
        sx={{
          p: 0.5,
          pt: 1,
          width: "100%",
          borderTop: 1,
          borderTopColor: "divider",
        }}
      >
        <DialogContentText variant="body2" sx={{ m: 1 }}>
          To proceed , please enter the following details of the collection.
        </DialogContentText>

        {/* Collection Details */}
        <Grid size={{ xs: 12 }}>
          <Box
            //updated
            component="span"
            sx={{
              "& .MuiTextField-root": { m: 1, width: "25ch" },
            }}
          >
            <Alert severity="warning">
              Please make sure to enter your collection name
              <br />
            </Alert>
            <br />
            <form onSubmit={formik.handleSubmit}>
              <div>
                <>
                  <>
                    {/* Collection name */}
                    <FormControl>
                      <Tooltip title="Collection x" placement="top">
                        <TextField
                          id="collectionName"
                          label="Collection Name"
                          value={formik.values.collectionName}
                          error={
                            formik.touched.collectionName && Boolean(formik.errors.collectionName)
                          }
                          name="collectionName"
                          onChange={(e) => {
                            formik.setFieldValue("collectionName", e.target.value);
                          }}
                        />
                      </Tooltip>
                      <FormHelperText
                        error={
                          formik.touched.collectionName && Boolean(formik.errors.collectionName)
                        }
                      >
                        <>
                          {formik.touched.collectionName &&
                            Boolean(formik.errors.collectionName) &&
                            formik.errors.collectionName}
                        </>
                      </FormHelperText>
                    </FormControl>

                  </>
                </>
              </div>
              <br />
              <br />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  type="button"
                  onClick={() => toggleClose()}
                >
                  {" "}
                  Cancel{" "}
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={collection.submitState === State.loading}
                >
                  {" "}
                  Submit{" "}
                </LoadingButton>
              </Stack>
            </form>
          </Box>
        </Grid>

        <IconButton
          aria-label="close"
          onClick={() => toggleClose()}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogContent>
    </Dialog>
  );
};

export default AddCollectionModal;
