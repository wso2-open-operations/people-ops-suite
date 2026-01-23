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

export const SnackMessage = {
  success: {
    addCollections: "Successfully added the Collection",
    updateGlobalParConfigs: "Successfully updated the global PAR configurations",
  },
  error: {
    fetchCollectionsMessage: "Unable to retrieve list of selected Collections",
    addCollections: "Unable to create the Collection",
    insufficientPrivileges: "Insufficient Privileges",
    fetchPrivileges: "Failed to fetch Privileges",
    fetchContacts: "Unable to retrieve list of Contacts",
    fetchEmployees: "Unable to retrieve list of Employees",
    fetchCustomers: "Unable to retrieve list of Customers",
    fetchAppConfigMessage: "Unable to retrieve app configurations",
    fetchGlobalParConfigs: "Error while retrieving global configurations",
    fetchEmployeesData: "Error while retrieving organization data",
    updateGlobalParConfigs: "Error while updating global configurations",
  },
  warning: {},
  dialog: {

  },
};

export const sliceErrorMessages = {
  specialQuotaSlice: {
    fetchGroups: "Error while retrieving quota groups",
    postGroups: "Error while saving quota groups",
  },
  parCycleSlice: {
    fetchQuotaCycle: "Error while retrieving quota pending par cycles",
    fetchOpenCycle: "Error while retrieving open par cycles",
    fetchCloseCycle: "Error while retrieving closed par cycles",
    fetchPendingCycle: "Error while retrieving pending par cycles",
    postCycle: "Error while saving the par cycle",
    fetchCycle: "Error while retrieving the par cycle",
  },
  employeeSlice: {
    getEmployee: "Error while retrieving employee details",
    getEmployeeRating: "Error while retrieving employee ratings",
    postEmployeeRating: "Error while saving employee details",
    syncEmployeeData: "Error while syncing employee information",
  },
  teamSlice: {
    fetchTeams: "Error while retrieving lead's teams",
    fetchTeamReport: "Error while retrieving team details",
  },
  reminderSlice: {
    postReminder: "Error while saving reminders",
  },
  threeSixtyReviewSlice: {
    fetchReviewers: "Error while retrieving reviewers",
    postReviewers: "Error while saving reviewers",
    fetchReviewerRequest: "Error while retrieving reviewer requests",
    fetchReview: "Error while retrieving reviews",
    postReview: "Error while saving reviews",
  },
  metaSlice: {
    fetchConfigs: "Error while retrieving configurations",
    postConfigs: "Error while saving configurations",
    fetchEmployees: "Error while retrieving employees",
  },
  reportSlice: {
    fetchReport: "Error while retrieving reports",
  },
  calendarSlice: {
    fetchCalendar: "Error while retrieving calendar data",
  },
};

export const uiMessages = {
  loading: {
    pageLoading: "Loading",
    parCycleCreation: "Submitting information",
    fetchCurrentCycleDetails: "Loading ongoing PAR cycle",
  },
  information: {
    emptyGroupsView:
      "Select teams to start creating groups and allocating quotas",
    emptyTeamsView: "All the teams have been grouped",
    feedback: "360° Feedback",
    noAllocations:
      "No special rating allocations found. Please ensure you have the necessary permissions to view this data.",
  },
  error: {
    noIndirectReportsFound: "No indirect reports found",
    noTeamsFound: "No teams found for the current cycle",
    noParCycleFound: "Currently there is no ongoing PAR cycle",
    fetchUserDetails: "Error while retrieving user details",
    emptyGroupName: "Group name cannot be empty",
    invalidGroupname: "Group name contains invalid characters",
    existingGroupName: "Group name already exists",
    noTeamsUnderLead: "No teams found under your lead",
    noSpecialRatings: "Error occurred while retrieving special ratings",
    noAllocations: "Error occurred while retrieving quota allocations",
    noHistory: "Error occurred while retrieving employee PAR summary",
  },
  warning: {
    leadShareDisable:
      "* Sharing lead's feedback is disabled until employee PAR is shared",
  },
  alert: {
    employeeParNoOngoingCycle:
      "Currently, there is no ongoing PAR cycle available",
    employeeParDraftSaved: "You have saved your PAR as a draft",
    employeeParShared: "Your PAR is shared with your lead",
    employeeParSharedLocked: "Your PAR is under review by your lead",
    leadReviewSharedForEmployee: "Your PAR has been completed by your lead",
    leadReviewDraftSaved: "You have saved this review as a draft",
    leadReviewShared: "Lead's feedback is shared with the employee",
    leadReviewForceEdit: "You are editing the lead's feedback",
    leadSharedReviewForceEdit:
      "You are editing an already shared lead's feedback",
    leadReviewIsNotShared: "Lead's feedback is not shared with the employee",
    f2fDisabled: "Lead's feedback must be completed to update F2F status",
    f2fCompleted: "F2F completed on",
    historyDataNotSynced:
      "PAR history data is available only for PAR cycles from 2024 H2 onwards. Please refer to PeopleHR for the history data.",
  },
  dialog: {
    groupNameInput: {
      title: "Please enter a name for the group. (Max: 50 characters)",
    },
    quotaValueInput: {
      title: "Please set the desired quota values for the group : ",
    },
    confirmTeamRemove: {
      title: "Remove a Team",
      message:
        "Are you sure you want to remove the selected team? This action cannot be undone.",
      okText: "Remove",
    },
    confirmGroupRemove: {
      title: "Remove a Group",
      message:
        "Are you sure you want to remove the selected group? This action cannot be undone.",
      okText: "Remove",
    },
    confirmQuotaAssign: {
      title: "Confirm Quota Choices",
      message:
        "Are you sure you want to finish and save the quota allocation? This action cannot be undone.",
      okText: "Finish",
    },
    closeParCycle: {
      title: "Close ongoing PAR cycle?",
      message:
        "This means members of your organization can't do changes to the current PAR anymore.",
      okText: "Proceed",
    },
    createParCycle: {
      title: "Start new PAR cycle?",
      message: "Are you sure that you want to start the new PAR cycle?",
      okText: "Confirm",
    },
    updateParCycleSettings: {
      title: "Update PAR cycle settings?",
      message: "This action will only update the ongoing PAR cycle settings.",
      okText: "Save Changes",
    },
    updateGlobalParConfigs: {
      title: "Update global PAR configurations?",
      message:
        "This action will update the Global PAR Configurations, Only the subsequent PAR cycles will be affected.",
      okText: "Confirm",
    },
    employeeParShare: {
      title: "Share Employee PAR?",
      message:
        "This action will share your PAR with your lead. You can unshare and edit it until your lead starts reviewing it.",
      okText: "Share",
    },
    employeeParUnshare: {
      title: "Unshare Employee PAR?",
      message:
        "This action will unshare your employee PAR. You can edit it and share it again with your lead.",
      okText: "Unshare",
    },
    threeSixtyReviewShare: {
      title: "Share 360° Feedback?",
      message:
        "By Proceeding you will send your 360° feedback to the employee's lead. This action cannot be undone.",
      okText: "Share",
    },
    threeSixtyReviewReject: {
      title: "Decline 360° Feedback Request?",
      message:
        "This will decline the 360 Feedback request. You can't undo this action.",
      okText: "Decline",
    },
    leadParShare: {
      title: "Share Lead's Feedback?",
      message:
        "This action will share your review with the employee. You can't undo this action.",
      okText: "Share",
    },
    leadParBulkShare: {
      title: "Bulk Share Lead's Feedback?",
      message:
        "This will share the lead's feedback with all the selected members. You can't undo this action.",
      okText: "Share",
    },
    editSharedReviews: {
      title: "Edit Shared Feedback",
      message:
        "Do you want to edit the shared lead's feedback and employee PAR?",
      okText: "Edit",
    },
    editLeadReview: {
      title: "Edit Lead's Feedback",
      message: "Do you want to edit the lead's feedback?",
      okText: "Edit",
    },
    threeSixtyReminder: {
      title: "Send 360° Feedback Reminder?",
      message:
        "If you send 360° reminders, employees who haven't yet responded to their 360° feedback requests will receive a reminder. Do you wish to continue?",
      okText: "Send",
    },
  },
  tooltip: {
    top5Percent20PercentInfo:
      "The quota for these ratings are calculated based on overall team headcount. Please ensure the ratings are finalized in conversation with the respective functional lead.",
    adminParEmployeeStatusExplanation:
      "Shared status indicates that the employee PAR is shared with their lead but can be unshared, modified, and shared again. \n\nShared-Blocked status indicates that the employee PAR is shared with their lead and cannot be unshared.",
    adminParLeadStatusExplanation:
      "Once lead's feedback is shared, employee PAR will switch to Shared-Blocked state. \n\nIf you revert a Shared lead's feedback, the employee PAR status will switch back to Draft status.",
    adminParF2fStatusExplanation:
      "Lead's feedback must be shared to update F2F status. F2F status cannot be modified once marked as completed.",
    removeAGroupFromMap: "Remove the entire group",
    top5TextFieldHelper:
      "Enter 5% quota. Min : 0, Max : 5% of the group's total headcount",
    top20TextFieldHelper:
      "Enter 20% quota. Min : 0, Max : 20% of the group's total headcount",
    removeATeamFromGroup: "Remove the team from the group",
    finishAssignQuotaButtonHelper:
      "Confirm and save all the slot allocations for groups",
    addATeamToGroupHelper: "Create a new group using selected teams",
    addATeamToGroupHelperDisabled: "Select relevant teams to create a group",
    editQuotaValues:
      "Edit quota values and add functional leads to the group with view permissions",
    resetQuotaValues: "Reset quota values to default",
  },
};

export const APP_DESC = " Internal App Product Template.";

export const redirectUrl = "iapm-marketplace-redirect-url";
