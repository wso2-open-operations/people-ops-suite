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

export const CommonMessage = {
  notFound: {
    title: "404",
    description: "The page you’re looking for doesn’t exist.",
    backHome: "Back Home",
  },
  loading: {
    appReady: "We are getting things ready ...",
    pageData: "Loading page data",
    appInit: "Loading ...",
    userInfo: "Loading User Info ...",
  },
  auth: {
    tokenRefreshPromiseMissing: "Token refresh promise is not available",
  },
  session: {
    title: "Are you still there?",
    description: "It looks like you've been inactive for a while. Would you like to continue?",
    continueButton: "Continue",
    logoutButton: "Logout",
  },
  maintenance: {
    description:
      "Exciting changes are on the way! Our website is currently undergoing a transformation to enhance your experience. Please check back soon to see the amazing updates.",
  },
};

export const DataEntryMessage = {
  title: "Daily Data Entry",
  subtitle: "Record daily food waste metrics for breakfast and lunch services",
  selectDate: "Select Date",
  selectedDate: "Selected Date",
  mealLabels: {
    breakfast: "Breakfast",
    lunch: "Lunch",
  },
  fields: {
    totalWasteKg: "Total Waste (kg)",
    totalPlateCount: "Total Plate Count",
    wastePerPlateGrams: "Waste/Plate (grams)",
  },
  placeholders: {
    waste: "0.0",
    plates: "0",
  },
  units: {
    grams: "g",
    kilograms: "kg",
  },
  summary: {
    title: "Daily Summary Preview",
    totalDailyWaste: "Total Daily Waste",
    totalPlatesServed: "Total Plates Served",
    dataCompletion: "Data Completion",
  },
  snackbar: {
    atLeastOneMeal: "Please fill in at least breakfast or lunch data",
    loadFailed: "Failed to load daily records. Please try again.",
    saveUnexpectedFailure: "Unexpected failure during save.",
    savedPartialPrefix: "Saved",
    savedPartialSuffix: "meal record(s).",
    savedForDatePrefix: "Daily record saved for",
  },
  actions: {
    save: "Save Daily Record",
    saving: "Saving...",
    cancel: "Cancel",
  },
};

export const AdManagementMessage = {
  title: "Ad Management Console",
  subtitle: "Configure dashboard announcements, promotional content, and scheduling",
  sections: {
    activeAd: "Currently Active Ad",
    addNewAd: "Add New Ad",
    adLibrary: "Ad Library",
  },
  labels: {
    adName: "Ad Name",
    mediaUrl: "Media URL",
    uploaded: "Uploaded",
    displayDuration: "Display Duration",
    schedule: "Schedule",
    videoType: "Type",
    video: "Video",
    duration: "Duration",
  },
  helper: {
    adNamePlaceholder: "e.g., Morning Promotion",
    mediaUrlPlaceholder: "https://example.com/promo-video.mp4",
    mediaUrlSupport: "Supported: MP4, WebM, JPG, PNG, GIF, and embeddable links",
    imageDuration: "Display Duration (Seconds) - For Images",
    videoDetected: "Video detected - Duration uses the video's native length",
    scheduleDisabled: "Disabled",
    activeBadge: "ACTIVE",
  },
  actions: {
    testAd: "Test Ad",
    uploadAndAdd: "Upload & Add to Library",
    setActive: "Set Active",
    active: "Active",
    preview: "Preview",
    delete: "Delete",
  },
  snackbar: {
    adNameRequired: "Please enter an ad name",
    mediaUrlRequired: "Please enter a media URL",
    adAddedSuccess: "Ad added successfully",
    adAddedFailed: "Failed to add ad. Please try again.",
    activeUpdatedSuccess: "Active ad updated",
    activeUpdatedFailed: "Failed to activate ad. Please try again.",
    deleteActiveBlocked: "Cannot delete active ad. Please select another ad first.",
    adDeletedSuccess: "Ad deleted successfully",
    adDeletedFailed: "Failed to delete ad. Please try again.",
  },
};

export const DashboardOverviewMessage = {
  mealLabels: {
    breakfast: "Breakfast",
    lunch: "Lunch",
  },
  collectionActions: {
    actionOne: "Action 1",
    actionTwo: "Action 2",
    actionThree: "Action 3",
    confirmTitlePrefix: "Do you want to",
    confirmSuffix: "?",
    confirmBody: "Please note that once done, this cannot be undone.",
  },
  panel: {
    serverErrorTitle: "Oops! Internal Server Error",
    serverErrorDescription: "We are trying to fix the problem",
    noDataTitle: "No data available",
    noDataDescription: "There are no collections to display",
  },
  addCollectionModal: {
    title: "Add Collection",
    description: "To proceed, please enter the following details of the collection.",
    warning: "Please make sure to enter your collection name",
    nameLabel: "Collection Name",
    nameTooltip: "Collection x",
    nameRequired: "Collection Name is required",
    typeLabel: "Collection Type",
    typeTooltip: "Category A",
    typeRequired: "Collection Type is required",
    cancel: "Cancel",
    submit: "Submit",
  },
  kpi: {
    totalWaste: "Total Waste",
    plateCount: "Plate Count",
    wastePerPlate: "Waste/Plate",
  },
  charts: {
    weeklyTrend: "Weekly Waste Trend",
    dailyComposition: "Daily Waste Composition",
    monthlyOverview: "Monthly Overview",
    yearlyOverview: "Yearly Overview",
    breakfastLegend: "Breakfast (kg)",
    lunchLegend: "Lunch (kg)",
  },
  fullscreen: {
    enterTitle: "Enter fullscreen",
    exitTitle: "Exit fullscreen",
  },
};
