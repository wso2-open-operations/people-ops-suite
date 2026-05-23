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

import React, { useEffect, useState } from "react";
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import {
    Autocomplete,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { fetchAllUsers, updateUser, fetchAllBUs, insertUser, deleteUser } from "@slices/userManagementSlice/userManagementSlice";
import { BUAccessLevel, Role, User } from "@root/src/utils/types";
import { EmployeeJoinedDetails, fetchEmployeeHistory } from "@root/src/slices/employeeSlice/employee";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useConfirmationModalContext } from '@root/src/context/DialogContext';
import { ConfirmationType } from "@root/src/types/types";
import Search from "@root/src/component/ui/search";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { fetchEmployees } from "@slices/employeeSlice/employee";
import Collapse from "@mui/material/Collapse";
import FunctionalLeadACLSelector from "@src/component/common/FunctionaACLSelector";
import { LoadingEffect } from "@root/src/component/ui/Loading";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";

const roleColors: Record< Role, { bg: string; color: string } > = {
    [Role.LEAD]: {
        bg: "#E8F5E9",
        color: "#2E7D32",
    },
    [Role.FUNCTIONAL_LEAD]: {
        bg: "#FDECEC",
        color: "#D32F2F",
    },
    [Role.PROMOTION_BOARD_MEMBER]: {
        bg: "#E3F2FD",
        color: "#1565C0",
    },
    [Role.HR_ADMIN]: {
        bg: "#FFF8E1",
        color: "#F9A825",
    },
    [Role.EMPLOYEE]: {
        bg: "#FFF8E1",
        color: "#F9A825"
    }
};

export default function UserManagement() {
    const dispatch = useAppDispatch();
    const users = useAppSelector((state: RootState) => state.userManagement);
    const leads = useAppSelector((state: RootState) => state.employee);
    const dialogContext = useConfirmationModalContext();
    const [searchKey, setSearchKey] = useState<string>("");
    const [functionalLeadACL, setFunctionalLeadACL] = useState<BUAccessLevel[]>([]);
    const [editFunctionalLeadACL, setEditFunctionalLeadACL] = useState<BUAccessLevel[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedLeadEmail, setSelectedLeadEmail] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<Role[]>([]);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [editSelectedRoles, setEditSelectedRoles] = useState<Role[]>([]);
    const [openTransferModal, setOpenTransferModal] = useState(false);
    const [selectedTransferUser, setSelectedTransferUser] = useState<any | null>(null);
    const [toLeadEmail, setToLeadEmail] = useState("");

    const fetchPromotionCycle = async () => {
        try {
            const resultAction = await dispatch(fetchAllUsers());
            dispatch(fetchAllBUs());
            if (fetchAllUsers.fulfilled.match(resultAction)) {
                    const users: User[] =
                resultAction.payload || [];
                    const emails = users.map((p) => p.email);
                    const employeeHistories: EmployeeJoinedDetails[] = [];
                        for (const email of emails) {
                            const employeeHistory = await dispatch(
                                fetchEmployeeHistory({ employeeWorkEmail: email })
                            ).unwrap();
                            employeeHistories.push(employeeHistory);
                        }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
                
    useEffect(() => {
        fetchPromotionCycle(); 
    }, []);

    const filteredUsers = users.users?.filter((user) => {
        const search = searchKey.toLowerCase();

        return (
            `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(search) ||
            user.roles.some((role) =>
                role.toLowerCase().includes(search)
            )
        );
    });

    const handleOpenEditModal = (user: User) => {
        setSelectedUser(user);
        setEditSelectedRoles(user.roles || []);
        setEditFunctionalLeadACL(user.functionalLeadAccessLevels?.businessUnits ?? []);
        setOpenEditModal(true);
    };

    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setSelectedUser(null);
        setEditSelectedRoles([]);
        setEditFunctionalLeadACL([]);
    };

    const handleOpenModal = () => {
        setOpenModal(true);
        dispatch(fetchEmployees({
            filterLeads: true
        }))
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedLeadEmail("");
        setSelectedRole([]);
        setFunctionalLeadACL([]);
    };

    const handleAddUser = () => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to add this user?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(insertUser({
                    email: selectedLeadEmail,
                    roles: selectedRole,
                    functionalLeadAccessLevels:
                    selectedRole.includes(Role.FUNCTIONAL_LEAD) &&
                    functionalLeadACL.length > 0
                        ? {
                            businessUnits: functionalLeadACL,
                        }
                        : null,
                }));
                if (insertUser.fulfilled.match(resultAction)) {
                    handleCloseModal();
                    handleRefresh();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const handleRefresh = () => {
        fetchPromotionCycle();
    }
    const handleStatusChange = (user: User, active: boolean) => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to change the status of this user?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(updateUser({
                    id: user.id,
                    functionalLeadAccessLevels: user.functionalLeadAccessLevels,
                    roles: user.roles,
                    active: active
                }));
                if (updateUser.fulfilled.match(resultAction)) {
                    handleRefresh();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    }
    const onChangeSearchKey = (event: { target: { value: any } }) => {
        const { value } = event.target;
        setSearchKey(value);
    };

    const handleDelete = (id: number) => {
        console.log(id)
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to delete this user?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(deleteUser({
                    id: id,
                }));
                if (deleteUser.fulfilled.match(resultAction)) {
                    handleRefresh();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    }

    const handleUpdateUser = (userId: number) => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to save this changes?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(updateUser({
                    id: userId,
                    roles: editSelectedRoles,
                    functionalLeadAccessLevels:
                        editSelectedRoles.includes(Role.FUNCTIONAL_LEAD) &&
                        editFunctionalLeadACL.length > 0
                            ? {
                                businessUnits: editFunctionalLeadACL,
                            }
                            : null,
                }));
                if (updateUser.fulfilled.match(resultAction)) {
                    handleRefresh();
                    handleCloseEditModal();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const selectedLead = leads.employees?.find(
        (lead) =>
            lead.workEmail === selectedLeadEmail
    );

    const handleOpenTransferModal = (user: any) => {
        setSelectedTransferUser(user);
        dispatch(fetchEmployees({
            filterLeads: true
        }))
        setToLeadEmail("");
        setOpenTransferModal(true);
    };

    const handleCloseTransferModal = () => {
        setOpenTransferModal(false);
        setSelectedTransferUser(null);
        setToLeadEmail("");
    };

    const handleTransfer = (
        user: User,
        toLeadEmail: string
    ) => {

        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to make thsi transfer?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(updateUser({
                    id: user.id,
                    email: toLeadEmail,
                    roles: user.roles,
                    functionalLeadAccessLevels:
                        user.roles.includes(Role.FUNCTIONAL_LEAD) &&
                        (user.functionalLeadAccessLevels?.businessUnits?.length ?? 0) > 0
                            ? {
                                businessUnits: user.functionalLeadAccessLevels?.businessUnits || [],
                            }
                            : null,
                }));
                if (updateUser.fulfilled.match(resultAction)) {
                    handleRefresh();
                    handleCloseTransferModal();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    return (
        <Box
            sx={{
                p:5
            }}
        >
            {users.userState === "loading"&& (
                <>
                   <LoadingEffect message={"Loading Users"} /> 
                </>
            )}
            {users.userState === "success"&& (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            height: "auto",
                            marginBottom: "2rem",
                        }}
                    >
                        <IconButton
                            component="label"
                            sx={{ marginRight: "4px" }}
                            onClick={() => {
                                handleRefresh();
                            }}
                        >
                            <RefreshRoundedIcon />
                        </IconButton>

                        <Typography variant="h5" sx={{ flex: 1 }}>
                            {" "}
                        </Typography>
                    
                        <Search value={searchKey} onChange={onChangeSearchKey} /> 

                        <Divider sx={{ height: 20, m: 0.5 }} orientation="vertical" />

                        <Tooltip title="Add a new user">
                            <IconButton
                                sx={{ ml: 1 }}
                                size="small"
                                onClick={handleOpenModal}
                            >
                                <PersonAddAlt1Icon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <TableContainer
                        component={Paper}
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>
                                        User
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            fontWeight: 700,
                                            width: "50%",
                                        }}
                                    >
                                        User Roles
                                    </TableCell>

                                    <TableCell align="center">
                                        Transfer
                                    </TableCell>

                                    <TableCell
                                        align="center"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredUsers &&
                                 filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                            >
                                                <Avatar
                                                    src={user.employeeThumbnail || ""}
                                                    alt={"employeeThumbnail"}
                                                />

                                                <Typography fontWeight={500}>
                                                    {user.firstName} {" "} {user.lastName} {" "} {`(${user.email})`}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                display="flex"
                                                flexWrap="wrap"
                                                gap={1}
                                            >
                                                {user.roles.map((role) => (
                                                    <Chip
                                                        key={role}
                                                        label={role}
                                                        sx={{
                                                            backgroundColor:
                                                                roleColors[role].bg,
                                                            color:
                                                                roleColors[role].color,
                                                            fontWeight: 600,
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Tooltip title="Transfer User">
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() =>
                                                        handleOpenTransferModal(user)
                                                    }
                                                >
                                                    <TransferWithinAStationIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                                gap={1}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        border: "1px solid #dcdcdc",
                                                        borderRadius: "10px",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Button
                                                        disabled={user.active}
                                                        onClick={() => handleStatusChange(user, true)}
                                                        variant={user.active ? "contained" : "text"}
                                                        sx={{
                                                            borderRadius: 0,
                                                            textTransform: "none",
                                                            minWidth: "90px",
                                                            backgroundColor: user.active
                                                                ? "#2E7D32"
                                                                : "transparent",

                                                            color: user.active
                                                                ? "#fff"
                                                                : "#2E7D32",

                                                            "&:hover": {
                                                                backgroundColor: user.active
                                                                    ? "#1B5E20"
                                                                    : "#E8F5E9",
                                                            },

                                                            "&.Mui-disabled": {
                                                                backgroundColor: "#2E7D32",
                                                                color: "#fff",
                                                                opacity: 1,
                                                            },
                                                        }}
                                                    >
                                                        Active
                                                    </Button>

                                                    <Button
                                                        disabled={!user.active}
                                                        onClick={() => handleStatusChange(user, false)}
                                                        variant={!user.active ? "contained" : "text"}
                                                        sx={{
                                                            borderRadius: 0,
                                                            textTransform: "none",
                                                            minWidth: "90px",

                                                            backgroundColor: !user.active
                                                                ? "#D32F2F"
                                                                : "transparent",

                                                            color: !user.active
                                                                ? "#fff"
                                                                : "#D32F2F",

                                                            "&:hover": {
                                                                backgroundColor: !user.active
                                                                    ? "#B71C1C"
                                                                    : "#FDECEC",
                                                            },

                                                            "&.Mui-disabled": {
                                                                backgroundColor: "#D32F2F",
                                                                color: "#fff",
                                                                opacity: 1,
                                                            },
                                                        }}
                                                    >
                                                        Inactive
                                                    </Button>
                                                </Box>

                                                <Tooltip title="Edit User">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleOpenEditModal(user)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete User">
                                                    <IconButton 
                                                        color="error"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
            
            <Modal
                open={openModal}
                onClose={handleCloseModal}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform:
                            "translate(-50%, -50%)",

                        width: 950,
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        mb={3}
                    >
                        Add User Role
                    </Typography>

                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={3}
                    >
                        {selectedLead && (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                gap={1}
                            >
                                <Avatar
                                    src={
                                        selectedLead.employeeThumbnail || ""
                                    }
                                    alt={`${selectedLead.firstName} ${selectedLead.lastName}`}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                    }}
                                />

                                <Typography
                                    fontWeight={600}
                                >
                                    {
                                        selectedLead.firstName
                                    }{" "}
                                    {
                                        selectedLead.lastName
                                    }
                                </Typography>
                            </Box>
                        )}

                        <FormControl fullWidth>
                            <Autocomplete
                                options={leads.employees || []}
                                loading={leads.state === "loading"}
                                value={
                                    leads.employees?.find(
                                        (lead) =>
                                            lead.workEmail ===
                                            selectedLeadEmail
                                    ) || null
                                }
                                onChange={(_, newValue) => {
                                    setSelectedLeadEmail(
                                        newValue?.workEmail || ""
                                    );
                                }}
                                getOptionLabel={(option) =>
                                    `${option.firstName} ${option.lastName} (${option.workEmail})`
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option.workEmail === value.workEmail
                                }
                                ListboxProps={{
                                    style: {
                                        maxHeight: 250,
                                        overflow: "auto",
                                    },
                                }}
                                renderOption={(props, option) => (
                                    <Box
                                        component="li"
                                        {...props}
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                    >
                                        <Avatar
                                            src={
                                                option.employeeThumbnail || ""
                                            }
                                            sx={{
                                                width: 32,
                                                height: 32,
                                            }}
                                        />

                                        <Box>
                                            <Typography
                                                fontSize={14}
                                                fontWeight={600}
                                            >
                                                {option.firstName}{" "}
                                                {option.lastName}
                                            </Typography>

                                            <Typography
                                                fontSize={12}
                                                color="text.secondary"
                                            >
                                                {option.workEmail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search Lead by Email"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {leads.state ===
                                                        "loading" && (
                                                        <CircularProgress
                                                            color="inherit"
                                                            size={20}
                                                        />
                                                    )}

                                                    {
                                                        params.InputProps
                                                            .endAdornment
                                                    }
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Select Roles</InputLabel>

                            <Select
                                multiple
                                value={selectedRole}
                                label="Select Roles"
                                onChange={(e) =>
                                    setSelectedRole(
                                        e.target.value as Role[]
                                    )
                                }
                                renderValue={(selected) =>
                                    (selected as string[]).join(", ")
                                }
                            >
                                {Object.values(Role).map((role) => (
                                    <MenuItem
                                        key={role}
                                        value={role}
                                    >
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Collapse
                            in={selectedRole.includes(Role.FUNCTIONAL_LEAD)}
                            timeout="auto"
                            unmountOnExit
                        >
                            <Box
                                mt={2}
                                p={2}
                                border="1px solid #e0e0e0"
                                borderRadius={2}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                    mb={2}
                                >
                                    Functional Lead Access Control
                                </Typography>

                                <FunctionalLeadACLSelector
                                    value={functionalLeadACL}
                                    setValue={setFunctionalLeadACL}
                                />
                            </Box>
                        </Collapse>

                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            gap={2}
                            mt={2}
                        >
                            <Button
                                variant="outlined"
                                onClick={
                                    handleCloseModal
                                }
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="contained"
                                disabled={
                                    !selectedLeadEmail ||
                                    selectedRole.length === 0 ||
                                    (selectedRole.includes(Role.FUNCTIONAL_LEAD) &&
                                    functionalLeadACL.length === 0 )
                                }
                                onClick={
                                    handleAddUser
                                }
                            >
                                Add User
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>

            <Modal
                open={openEditModal}
                onClose={handleCloseEditModal}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 950,
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        mb={3}
                    >
                        Edit User Roles
                    </Typography>

                    {selectedUser && (
                        <Box
                            display="flex"
                            flexDirection="column"
                            gap={3}
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                gap={1}
                            >
                                <Avatar
                                    src={selectedUser.employeeThumbnail || ""}
                                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                    }}
                                />

                                <Typography fontWeight={700}>
                                    {selectedUser.firstName}{" "}
                                    {selectedUser.lastName}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    fontSize={14}
                                >
                                    {selectedUser.email}
                                </Typography>
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Select Roles</InputLabel>

                                <Select
                                    multiple
                                    value={editSelectedRoles}
                                    label="Select Roles"
                                    onChange={(e) =>
                                        setEditSelectedRoles(
                                            e.target.value as Role[]
                                        )
                                    }
                                    renderValue={(selected) =>
                                        (selected as string[]).join(", ")
                                    }
                                >
                                    {Object.values(Role).map((role) => (
                                        <MenuItem
                                            key={role}
                                            value={role}
                                        >
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Collapse
                                in={editSelectedRoles.includes(
                                    Role.FUNCTIONAL_LEAD
                                )}
                                timeout="auto"
                                unmountOnExit
                            >
                                <Box
                                    mt={2}
                                    p={2}
                                    border="1px solid #e0e0e0"
                                    borderRadius={2}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={700}
                                        mb={2}
                                    >
                                        Functional Lead Access Control
                                    </Typography>

                                    <FunctionalLeadACLSelector
                                        value={editFunctionalLeadACL}
                                        setValue={setEditFunctionalLeadACL}
                                    />
                                </Box>
                            </Collapse>

                            <Box
                                display="flex"
                                justifyContent="flex-end"
                                gap={2}
                                mt={2}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={handleCloseEditModal}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    disabled={
                                        editSelectedRoles.length === 0 ||
                                        (editSelectedRoles.includes(Role.FUNCTIONAL_LEAD) &&
                                            editFunctionalLeadACL.length === 0 )
                                    }
                                    onClick={() =>
                                        handleUpdateUser(
                                            selectedUser.id
                                        )
                                    }
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Modal>

            <Modal
                open={openTransferModal}
                onClose={handleCloseTransferModal}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 650,
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        mb={3}
                    >
                        Transfer User
                    </Typography>

                    <Box
                        display="flex"
                        flexDirection="column"
                        gap={3}
                    >
                        <FormControl fullWidth>
                            <InputLabel>From</InputLabel>

                            <Select
                                value={
                                    selectedTransferUser?.email || ""
                                }
                                label="From"
                                disabled
                            >
                                {users.users?.map((user) => (
                                    <MenuItem
                                        key={user.id}
                                        value={user.email}
                                    >
                                        {user.firstName}{" "}
                                        {user.lastName} (
                                        {user.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <Autocomplete
                                options={leads.employees || []}
                                loading={leads.state === "loading"}
                                value={
                                    leads.employees?.find(
                                        (lead) =>
                                            lead.workEmail ===
                                            toLeadEmail
                                    ) || null
                                }
                                onChange={(_, newValue) => {
                                    setToLeadEmail(
                                        newValue?.workEmail || ""
                                    );
                                }}
                                getOptionLabel={(option) =>
                                    `${option.firstName} ${option.lastName} (${option.workEmail})`
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option.workEmail ===
                                    value.workEmail
                                }
                                ListboxProps={{
                                    style: {
                                        maxHeight: 250,
                                        overflow: "auto",
                                    },
                                }}
                                renderOption={(props, option) => (
                                    <Box
                                        component="li"
                                        {...props}
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                    >
                                        <Avatar
                                            src={
                                                option.employeeThumbnail ||
                                                ""
                                            }
                                            sx={{
                                                width: 32,
                                                height: 32,
                                            }}
                                        />

                                        <Box>
                                            <Typography
                                                fontSize={14}
                                                fontWeight={600}
                                            >
                                                {option.firstName}{" "}
                                                {option.lastName}
                                            </Typography>

                                            <Typography
                                                fontSize={12}
                                                color="text.secondary"
                                            >
                                                {option.workEmail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Transfer To Lead"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {leads.state ===
                                                        "loading" && (
                                                        <CircularProgress
                                                            color="inherit"
                                                            size={20}
                                                        />
                                                    )}

                                                    {
                                                        params.InputProps
                                                            .endAdornment
                                                    }
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </FormControl>

                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            gap={2}
                            mt={2}
                        >
                            <Button
                                variant="outlined"
                                onClick={
                                    handleCloseTransferModal
                                }
                            >
                                Close
                            </Button>

                            <Button
                                variant="contained"
                                disabled={
                                    !selectedTransferUser ||
                                    !toLeadEmail
                                }
                                onClick={() =>
                                    handleTransfer(
                                        selectedTransferUser,
                                        toLeadEmail
                                    )
                                }
                            >
                                Transfer
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
}