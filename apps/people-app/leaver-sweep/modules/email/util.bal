import ballerina/lang.regexp;
import ballerina/mime;

# HTML-escape a string to prevent injection/XSS.
# Escapes &, <, >, ", and ' (& first to prevent double-escaping).
#
# + str - String to escape
# + return - HTML-escaped string
isolated function htmlEscape(string str) returns string {
    string escaped = str;
    escaped = re `&`.replaceAll(escaped, "&amp;");
    escaped = re `<`.replaceAll(escaped, "&lt;");
    escaped = re `>`.replaceAll(escaped, "&gt;");
    escaped = re `"`.replaceAll(escaped, "&quot;");
    escaped = re `'`.replaceAll(escaped, "&#39;");
    return escaped;
}

# Bind values to the email template and encode.
#
# + content - Email content
# + keyValPairs - Key value pairs
# + return - Email content
isolated function bindKeyValues(string content, map<string> keyValPairs) returns string|error {
    string bindContent = keyValPairs.entries().reduce(
        isolated function(string accumulation, [string, string] keyVal) returns string {
        regexp:RegExp r = re `<!-- \[${keyVal[0].toUpperAscii()}\] -->`;
        string valueToReplace = keyVal[0] == "EMPLOYEE_LIST" ? keyVal[1] : htmlEscape(keyVal[1]);
        return r.replaceAll(accumulation, valueToReplace);
    },
    content);
    return mime:base64Encode(bindContent).ensureType();
}
