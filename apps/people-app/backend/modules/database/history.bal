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

# Source table name for employee_audit snapshots.
const SOURCE_TABLE_EMPLOYEE_AUDIT = "employee_audit";

# Action type recorded for a row insert.
const ACTION_TYPE_INSERT = "INSERT";

# Actors that are automated processes rather than people.
final readonly & string[] SYSTEM_ACTORS = ["MIGRATION", "system-scheduler"];

# Employee fields surfaced in the history. Everything else in the audit
# snapshot is either noise or not meaningful to a reader.
#
# Deliberately excluded as noise: updated_on, updated_by, created_on, created_by,
# employee_thumbnail and id. Bulk migrations re-write those columns on rows whose
# meaningful values never changed, so diffing them buries the real changes.
final readonly & string[] TRACKED_EMPLOYEE_FIELDS = [
    "business_unit_id", "team_id", "sub_team_id", "unit_id",
    "designation_id", "employment_type_id", "company_id", "office_id",
    "manager_email", "employee_status", "work_location",
    "job_role", "secondary_job_title", "external_designation",
    "house_id", "epf", "probation_end_date", "agreement_end_date", "start_date"
];

# Derive field-level change events by comparing consecutive audit snapshots.
#
# Snapshots must arrive ordered by action_on ascending. They may interleave rows from
# several employee records and several source tables; this function separates those
# streams itself rather than assuming the caller has grouped them.
#
# Three properties make the derived history truthful:
#
# 1. An INSERT yields no change events. It is the baseline that the next UPDATE is
# compared against, not a change in its own right. Treating it as a change would make
# every field appear to change on the employee's first day.
#
# 2. Snapshots are compared within a single employee record. A person may hold several
# employee rows over time (a rehire), and their snapshots interleave in one time-ordered
# stream. Comparing across records would invent transitions that never happened.
#
# 3. Snapshots are compared within a single source table. The three audit tables carry
# different columns under partly overlapping names, so a cross-table comparison would
# report tracked fields flipping to null purely because the other table lacks them.
#
# Only TRACKED_EMPLOYEE_FIELDS produce events; all of them live in employee_audit, so
# snapshots from the other audit tables establish baselines but currently emit nothing.
#
# + snapshots - Audit snapshots ordered oldest first
# + return - One event per changed tracked field, newest first
public isolated function buildHistoryEvents(AuditSnapshot[] snapshots) returns HistoryEvent[] {
    HistoryEvent[] events = [];

    // Keyed by employee record *and* source table, so neither a rehire nor a different
    // audit table is ever compared against the wrong baseline.
    map<json> previousByRecord = {};

    foreach AuditSnapshot snapshot in snapshots {
        string recordKey = string `${snapshot.employeePkId}|${snapshot.sourceTable}`;

        // hasKey, not `previous is json`: a JSON null is itself a valid json value, so an
        // absent baseline and a stored null are indistinguishable by type alone.
        boolean hasBaseline = previousByRecord.hasKey(recordKey);
        json previous = previousByRecord[recordKey] ?: ();

        // An INSERT restarts the baseline for this record rather than being diffed
        // against whatever preceded it.
        boolean isBaseline = snapshot.actionType == ACTION_TYPE_INSERT;

        if hasBaseline && !isBaseline && snapshot.sourceTable == SOURCE_TABLE_EMPLOYEE_AUDIT {
            foreach string 'field in TRACKED_EMPLOYEE_FIELDS {
                json previousValue = getField(previous, 'field);
                json currentValue = getField(snapshot.data, 'field);

                if previousValue != currentValue {
                    events.push({
                        employeePkId: snapshot.employeePkId,
                        'field: 'field,
                        previousValue: toDisplayValue(previousValue),
                        currentValue: toDisplayValue(currentValue),
                        occurredOn: snapshot.actionOn,
                        actionBy: snapshot.actionBy,
                        isSystem: isSystemActor(snapshot.actionBy)
                    });
                }
            }
        }

        previousByRecord[recordKey] = snapshot.data;
    }

    return events.reverse();
}

# Read a member from a JSON snapshot without failing when it is absent.
#
# Audit payloads are written by database triggers whose column set has changed over
# time, so older rows legitimately lack fields that newer rows carry.
#
# + data - JSON snapshot to read from
# + fieldName - Member name to read
# + return - The member value, or () when the snapshot is not an object or lacks the member
isolated function getField(json data, string fieldName) returns json {
    if data is map<json> {
        return data[fieldName];
    }
    return ();
}

# Render a JSON scalar as the string shown in the timeline.
#
# + value - JSON value taken from an audit snapshot
# + return - String form of the scalar, or () when the value is absent or JSON null
isolated function toDisplayValue(json value) returns string? {
    if value is () {
        return ();
    }
    if value is string {
        return value;
    }
    return value.toString();
}

# Check whether an audit actor is an automated process rather than a person.
#
# + actionBy - Value of the audit row's action_by column
# + return - True when the actor is a known system actor
isolated function isSystemActor(string actionBy) returns boolean {
    return SYSTEM_ACTORS.indexOf(actionBy) !is ();
}
