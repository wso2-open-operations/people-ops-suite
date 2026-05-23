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

import React, { useEffect } from "react";
import {
  Box,
  Paper,
  Avatar,
  Typography,
  IconButton,
  Grid,
  Modal,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAppSelector, RootState, useAppDispatch } from "@slices/store";
import { EmployeeData } from "@utils/types";
import { Cached } from "@mui/icons-material";
import Search from "@component/ui/search";
import StateWithImage from "@root/src/component/ui/StateWithImage";
import { fetchEmployees } from "@slices/employeeSlice/employee";
import { LoadingEffect } from "@root/src/component/ui/Loading";
import TimeLine from "@root/src/component/common/TimeLine";

export default function EmployeesHistory() {
    const auth = useAppSelector((state: RootState) => state.auth);
    const employees = useAppSelector((state: RootState) => state.employee);
    const employeeEmail = auth.userInfo?.email;
    const dispatch = useAppDispatch();
    const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchKey, setSearchKey] = React.useState<string>("");

    const fetchEmployeePromotions = () => {
        if (!employeeEmail) return;
        dispatch(fetchEmployees({
            managerEmail: employeeEmail
        }));
    };

    useEffect(() => {
        fetchEmployeePromotions();
    }, [employeeEmail]);

    const handleOpenDialog = (emp: any) => {
        setSelectedEmployee(emp);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedEmployee(null);
        setIsDialogOpen(false);
    };

    function handleRefresh() {
        setSearchKey("");
        fetchEmployeePromotions();
    }
    const onChangeSearchKey = (event: { target: { value: any } }) => {
        const { value } = event.target;
        setSearchKey(value);
    };

    const filteredEmployees = employees.employees.filter((user) =>
        searchKey === ""
            ? true
            : user.workEmail.toLowerCase().includes(searchKey.toLowerCase()),
    );

    return (
        <>
            {employees.state === "loading" && (
                <LoadingEffect message={"Loading Employees"} />
            )}

            {employees.state !== "loading" && (
                <Box
                    sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    px: 5,
                    pt: 5
                    }}
                >
                    <IconButton color="primary" onClick={handleRefresh}>
                    <Cached />
                    </IconButton>

                    {employees.state === "success" && (
                    <Search value={searchKey} onChange={onChangeSearchKey} />
                    )}
                </Box>
            )}

            {employees.state === "success" && 
             employees.employees.length > 0 &&
             auth.userInfo && (
                <Box
                    sx={{
                        px: 5
                    }}
                >
                    {auth.userInfo?.email && (
                    <Box
                        className="panel-con"
                        sx={{
                        height: "calc(100vh - 304px)",
                        minHeight: "calc(404px)",
                        }}
                    >
                        {filteredEmployees.length === 0 ? (
                        <Typography
                            variant="h6"
                            sx={{ textAlign: "center", mt: 3, opacity: 0.7 }}
                        >
                            No employees found
                        </Typography>
                        ) : (
                        filteredEmployees.map((emp) => (
                            <Paper
                            key={emp.workEmail}
                            elevation={3}
                            sx={{
                                p: 3,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 4,
                            }}
                            >
                            <Avatar
                                src={emp.employeeThumbnail || ""}
                                sx={{ width: 90, height: 90, borderRadius: 15 }}
                            />

                            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Full Name:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 15 }}>
                                    {emp.firstName ?? "N/A"} {emp.lastName ?? "N/A"}
                                </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Work Email:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 15 }}>
                                    {emp.workEmail ?? "N/A"}
                                </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={2}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Current Job Band:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ ml: 5, fontSize: 15 }}
                                >
                                    {emp.jobBand ?? "N/A"}
                                </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={2}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Current Job Role:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 15 }}>
                                    {emp.jobRole ?? "N/A"}
                                </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={2}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Start Date:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 15 }}>
                                    {emp.startDate ?? "N/A"}
                                </Typography>
                                </Grid>

                                {/* Temporary removal of Last Promoted Date */}
                                {/* <Grid item xs={12} sm={6} md={2}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, fontSize: 13 }}
                                >
                                    Last Promoted Date:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: 15 }}>
                                    {emp.lastPromotedDate ?? "N/A"}
                                </Typography>
                                </Grid> */}
                            </Grid>

                            <IconButton
                                color="primary"
                                onClick={() => handleOpenDialog(emp)}
                            >
                                <VisibilityIcon />
                            </IconButton>
                            </Paper>
                        ))
                        )}
                    </Box>
                    )}
                </Box>
            )}

            {employees.state === "failed" && (
                <Box
                    sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "50vh",
                    "& img": {
                        width: 360,
                        height: "auto",
                    },
                    }}
                >
                    <StateWithImage
                        imageUrl={require("@root/src/assets/images/error.svg").default}
                        message="Unable to load promotion history."
                    />
                </Box>
            )}

            {employees.state === "success" && 
            employees.employees.length === 0 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "70vh",
                        "& img": {
                            width: 360,
                            height: "auto",
                        },
                    }}
                >
                    <StateWithImage
                        imageUrl={require("@assets/images/not-found.svg").default}
                        message="There are no employees assigned to you"
                    />
                </Box>
            )}

            {selectedEmployee && (
                <Modal
                    open={isDialogOpen}
                    onClose={handleCloseDialog}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 600,
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            boxShadow: 24,
                            p: 3,
                        }}
                    >
                        <Typography variant="h6" mb={2}>
                            Promotion History – {selectedEmployee.workEmail}
                        </Typography>

                        <TimeLine employeeEmail={selectedEmployee.workEmail} />
                    </Box>
                </Modal>
            )}
        </>
    );
}
