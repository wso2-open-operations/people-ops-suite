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

# Source table name for personal_info_audit snapshots.
const SOURCE_TABLE_PERSONAL_INFO_AUDIT = "personal_info_audit";

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

# Personal information fields surfaced in the history.
#
# `full_name` is deliberately excluded: it is generated from first_name and last_name, so
# tracking it would emit a second event for every name change. The audit columns
# (created_*, updated_*, id) are excluded for the same reason as on the employee table.
final readonly & string[] TRACKED_PERSONAL_INFO_FIELDS = [
    "nic_or_passport", "first_name", "last_name", "title", "dob", "gender",
    "personal_email", "personal_phone", "resident_number",
    "address_line_1", "address_line_2", "city", "state_or_province",
    "postal_code", "country", "nationality"
];

# The tracked field list for a given audit source.
#
# + sourceTable - Audit table the snapshot came from
# + return - Fields to diff for that source; empty when the source is not tracked
isolated function trackedFieldsFor(string sourceTable) returns string[] {
    if sourceTable == SOURCE_TABLE_EMPLOYEE_AUDIT {
        return TRACKED_EMPLOYEE_FIELDS;
    }
    if sourceTable == SOURCE_TABLE_PERSONAL_INFO_AUDIT {
        return TRACKED_PERSONAL_INFO_FIELDS;
    }
    return [];
}

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
# Each source table has its own tracked field list. employee_audit and personal_info_audit
# both produce events; employee_additional_managers_audit is fetched for completeness but
# has no tracked fields, so it establishes baselines and emits nothing.
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

        string[] trackedFields = trackedFieldsFor(snapshot.sourceTable);

        if hasBaseline && !isBaseline && trackedFields.length() > 0 {
            foreach string 'field in trackedFields {
                json previousValue = getField(previous, 'field);
                json currentValue = getField(snapshot.data, 'field);

                if previousValue != currentValue {
                    events.push({
                        employeePkId: snapshot.employeePkId,
                        'field: 'field,
                        sourceTable: snapshot.sourceTable,
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

# Resolve raw foreign-key values on history events to human-readable names.
#
# Events arrive carrying ids from the audit snapshots ("87"). Anything that has a mapping
# is replaced with its name; values with no mapping (a deleted lookup row, or a field that
# was never an id) are left exactly as they are rather than blanked, so nothing disappears
# from the timeline.
#
# + events - History events carrying raw values
# + lookup - Field -> id -> name mapping
# + return - Events with id values replaced by names where a mapping exists
public isolated function resolveHistoryEventNames(HistoryEvent[] events, map<map<string>> lookup)
        returns HistoryEvent[] =>
    from HistoryEvent event in events
    select {
        employeePkId: event.employeePkId,
        'field: event.'field,
        sourceTable: event.sourceTable,
        previousValue: resolveLookupValue(event.'field, event.previousValue, lookup),
        currentValue: resolveLookupValue(event.'field, event.currentValue, lookup),
        occurredOn: event.occurredOn,
        actionBy: event.actionBy,
        isSystem: event.isSystem
    };

# Replace a single id with its name when a mapping exists.
#
# + field - The audit field the value belongs to
# + value - The raw value, possibly an id
# + lookup - Field -> id -> name mapping
# + return - The resolved name, or the original value when there is no mapping
isolated function resolveLookupValue(string 'field, string? value, map<map<string>> lookup)
        returns string? {
    if value is () {
        return ();
    }
    if !lookup.hasKey('field) {
        return value;
    }
    map<string> byId = lookup.get('field);
    return byId.hasKey(value) ? byId.get(value) : value;
}
