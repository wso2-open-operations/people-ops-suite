// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import Layout from "../layout/Layout";
import Error from "../layout/pages/404";
import { RequestState } from "@utils/types";
import { uiMessages } from "@config/constant";
import PreLoader from "@components/common/PreLoader";
import { getActiveRoutesV2, routes } from "../route";
import Maintenance from "../layout/pages/Maintenance";
import ErrorHandler from "@components/common/ErrorHandler";
import { RootState, useAppSelector } from "../slices/store";
import { selectEmployeeMapStatus } from "@slices/metaSlice";
import { selectEmployeeInfoStatus } from "@slices/authSlice";
import { selectMaintenanceStatus } from "@slices/healthSlice";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const AppHandler = () => {
  const auth = useAppSelector((state: RootState) => state.auth);
  const employeeInfoStatus = useAppSelector(selectEmployeeInfoStatus);
  const maintenanceStatus = useAppSelector(selectMaintenanceStatus);
  const employeeMetaDataStatus = useAppSelector(selectEmployeeMapStatus);
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <Error />,
      children: getActiveRoutesV2(routes, auth.roles),
    },
  ]);

  return (
    <>
      {(auth.status === RequestState.LOADING ||
        employeeInfoStatus === RequestState.LOADING ||
        employeeMetaDataStatus === RequestState.LOADING) && <PreLoader isLoading={true} message={auth.statusMessage} />}

      {auth.status === RequestState.SUCCEEDED &&
        employeeInfoStatus === RequestState.SUCCEEDED &&
        !maintenanceStatus &&
        employeeMetaDataStatus === RequestState.SUCCEEDED && <RouterProvider router={router} />}

      {auth.status === RequestState.FAILED && <ErrorHandler message={auth.errorMessage} />}

      {(auth.employeeInfoStatus === RequestState.FAILED && !maintenanceStatus) ||
        (employeeMetaDataStatus === RequestState.FAILED && (
          <ErrorHandler message={uiMessages.error.fetchUserDetails} />
        ))}

      {maintenanceStatus && <Maintenance />}
    </>
  );
};

export default AppHandler;
