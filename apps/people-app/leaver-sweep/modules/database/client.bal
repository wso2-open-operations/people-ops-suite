import ballerinax/mysql;
import ballerinax/mysql.driver as _;

# Database Client Configuration.
public type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
|};

configurable DatabaseConfig dbConfig = ?;

function initLeaverSweepDbClient() returns mysql:Client|error => new (...dbConfig);

# Database Client.
final mysql:Client databaseClient = check initLeaverSweepDbClient();
