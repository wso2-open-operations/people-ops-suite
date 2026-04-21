// copyright (c) 2026 wso2 llc. (https://www.wso2.com).
//
// wso2 llc. licenses this file to you under the apache license,
// version 2.0 (the "license"); you may not use this file except
// in compliance with the license.
// you may obtain a copy of the license at
//
// http://www.apache.org/licenses/license-2.0
//
// unless required by applicable law or agreed to in writing,
// software distributed under the license is distributed on an
// "as is" basis, without warranties or conditions of any
// kind, either express or implied. see the license for the
// specific language governing permissions and limitations
// under the license.
import { EmployeeBasicInfo } from "@services/employee";
import {
  BusinessUnitState,
  CompanyState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";
import { NodeType } from "@utils/types";

import { useOrgAddMutations } from "./useOrgAddMutations";

interface useOrgAddEntityActionProps {
  nodeType: NodeType;
}

export function useOrgAddActions({ nodeType }: useOrgAddEntityActionProps) {
  const {
    isAdding,
    addBusinessUnits,
    addBusinessUnitTeam,
    addTeams,
    addSubTeams,
    addUnits,
    addTeamSubTeam,
    addSubTeamUnit,
  } = useOrgAddMutations();

  type OrgOption =
    | (Partial<BusinessUnitState> & { inputValue?: string; canAdd?: boolean })
    | (Partial<TeamState> & { inputValue?: string; canAdd?: boolean })
    | (Partial<SubTeamState> & { inputValue?: string; canAdd?: boolean })
    | (Partial<UnitState> & { inputValue?: string; canAdd?: boolean });

  interface AddOrgItemFormValues {
    orgNode: OrgOption | null;
    orgNodeHead: EmployeeBasicInfo | null;
    functionalLead: EmployeeBasicInfo | null;
  }

  type ParentNode = CompanyState | BusinessUnitState | TeamState | SubTeamState;
  type MappableParentNode = BusinessUnitState | TeamState | SubTeamState;

  const createNewMapping = async (data: AddOrgItemFormValues, parent: MappableParentNode) => {
    const { orgNode, functionalLead } = data;

    if (!parent || !orgNode?.id) {
      throw new Error("Missing org node for mapping");
    }

    switch (nodeType) {
      case NodeType.Team: {
        await addBusinessUnitTeam({
          payload: {
            businessUnitId: (parent as BusinessUnitState).id,
            teamId: orgNode.id,
            ...(functionalLead?.workEmail && {
              functionalLeadEmail: functionalLead.workEmail,
            }),
          },
        }).unwrap();
        break;
      }
      case NodeType.SubTeam: {
        await addTeamSubTeam({
          payload: {
            businessUnitTeamId: (parent as TeamState).businessUnitTeamId,
            subTeamId: orgNode.id,
            ...(functionalLead?.workEmail && {
              functionalLeadEmail: functionalLead.workEmail,
            }),
          },
        }).unwrap();
        break;
      }
      case NodeType.Unit: {
        await addSubTeamUnit({
          payload: {
            businessUnitTeamSubTeamId: (parent as SubTeamState).businessUnitTeamSubTeamId,
            unitId: orgNode.id,
            ...(functionalLead?.workEmail && {
              functionalLeadEmail: functionalLead.workEmail,
            }),
          },
        }).unwrap();
        break;
      }
      default:
        throw new Error(`Mapping is not supported for node type: ${nodeType}`);
    }
  };

  const createNewOrgItem = async (data: AddOrgItemFormValues, parent: ParentNode) => {
    const { orgNode, orgNodeHead, functionalLead } = data;

    if (!nodeType || !orgNode?.name) {
      throw new Error("Missing required org item fields");
    }

    switch (nodeType) {
      case NodeType.BusinessUnit: {
        await addBusinessUnits({
          name: orgNode.name,
          ...(orgNodeHead?.workEmail && { headEmail: orgNodeHead.workEmail }),
        }).unwrap();
        break;
      }

      case NodeType.Team: {
        if (!parent) throw new Error("Parent business unit is required");
        await addTeams({
          payload: {
            name: orgNode.name,
            ...(orgNodeHead?.workEmail && { headEmail: orgNodeHead.workEmail }),
            businessUnit: {
              businessUnitId: (parent as BusinessUnitState).id,
              ...(functionalLead?.workEmail && {
                functionalLeadEmail: functionalLead.workEmail,
              }),
            },
          },
        }).unwrap();
        break;
      }

      case NodeType.SubTeam: {
        if (!parent) throw new Error("Parent team is required");
        await addSubTeams({
          payload: {
            name: orgNode.name,
            ...(orgNodeHead?.workEmail && { headEmail: orgNodeHead.workEmail }),
            businessUnitTeam: {
              businessUnitTeamId: (parent as TeamState).businessUnitTeamId,
              ...(functionalLead?.workEmail && {
                functionalLeadEmail: functionalLead.workEmail,
              }),
            },
          },
        }).unwrap();
        break;
      }

      case NodeType.Unit: {
        if (!parent) throw new Error("Parent sub-team is required");
        await addUnits({
          payload: {
            name: orgNode.name,
            ...(orgNodeHead?.workEmail && { headEmail: orgNodeHead.workEmail }),
            businessUnitTeamSubTeamUnit: {
              businessUnitTeamSubTeamId: (parent as SubTeamState).businessUnitTeamSubTeamId,
              ...(functionalLead?.workEmail && {
                functionalLeadEmail: functionalLead.workEmail,
              }),
            },
          },
        }).unwrap();
        break;
      }

      default:
        throw new Error(`Create is not supported for node type: ${nodeType}`);
    }
  };

  return {
    isAdding,
    createNewOrgItem,
    createNewMapping,
  };
}
