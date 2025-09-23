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
import ballerina/sql;

# Build the database select query with dynamic filter attributes.
#
# + mainQuery - Main query without the new sub query
# + filters - Array of sub queries to be added to the main query
# + return - Dynamically build sql:ParameterizedQuery
isolated function buildSqlSelectQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filters)
    returns sql:ParameterizedQuery {

    boolean isFirstSearch = true;
    sql:ParameterizedQuery updatedQuery = mainQuery;

    foreach sql:ParameterizedQuery filter in filters {
        if isFirstSearch {
            updatedQuery = sql:queryConcat(mainQuery, ` WHERE `, filter);
            isFirstSearch = false;
            continue;
        }

        updatedQuery = sql:queryConcat(updatedQuery, ` AND `, filter);
    }

    return updatedQuery;
}

# Build the database update query with dynamic attributes.
#
# + mainQuery - Main query without the new sub query
# + filters - Array of sub queries to be added to the main query
# + return - Dynamically build sql:ParameterizedQuery
isolated function buildSqlUpdateQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filters)
    returns sql:ParameterizedQuery {

    boolean isFirstUpdate = true;
    sql:ParameterizedQuery updatedQuery = ``;

    foreach sql:ParameterizedQuery filter in filters {
        if isFirstUpdate {
            updatedQuery = sql:queryConcat(mainQuery, filter);
            isFirstUpdate = false;
            continue;
        }

        updatedQuery = sql:queryConcat(updatedQuery, ` , `, filter);
    }

    return updatedQuery;
}

# Build the filter (WHERE) clause of the SQL query with the given set of filter types
#
# + mainQuery - Main query without the new sub query
# + filterQueries - Array of filter queries needed to be concatenate with the main query
# + return - SQL filter clause
isolated function buildSqlQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filterQueries)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = mainQuery;
    foreach int i in 0 ... filterQueries.length() - 1 {
        if i == 0 {
            sqlQuery = sql:queryConcat(sqlQuery, ` WHERE `, filterQueries[i]);
        }
        else {
            sqlQuery = sql:queryConcat(sqlQuery, ` AND `, filterQueries[i]);
        }
    }
    return sqlQuery;
}

# Join two or few sql queries
#
# + parts - Sql parameteried query array
# + separator - Seperator to seperate sql queries
# + return - Sql parameterized query
isolated function joinQuery(sql:ParameterizedQuery[] parts, sql:ParameterizedQuery separator)
    returns sql:ParameterizedQuery {

    if parts.length() == 0 {
        return ``;
    }
    sql:ParameterizedQuery result = parts[0];
    foreach int i in 1 ..< parts.length() {
        result = sql:queryConcat(result, separator, parts[i]);
    }
    return result;
}
