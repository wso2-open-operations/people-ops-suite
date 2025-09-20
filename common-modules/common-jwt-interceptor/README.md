# Overview
The CommonJwtInterceptor module is designed to extract specific details from the JWT (JSON Web Token) and place them into the RequestContext. This ensures that the necessary user information is readily available for subsequent processing and validation within your application.

# Features
1. Extract user details (e.g., email and groups) from the JWT.
2. Integrates seamlessly with various applications.
3. Enhances security and authorization processes by leveraging JWT claims.
4. Simplifies access to user-specific information across different components.

# Usage
### 1. Import the CommonJwtInterceptor
To use the CommonJwtInterceptor, import it into your application as follows:
```
import wso2/common_jwt_interceptor;
```



### 2. Initialize with the default constructor
Initialize the CommonJwtInterceptor within the createInterceptors() function as follows
```
public function createInterceptors() returns [common_jwt_interceptor:CommonJwtInterceptor] {
    return [new common_jwt_interceptor:CommonJwtInterceptor()];
}
```

# Options
The constructor of the CommonJwtInterceptor accepts three optional parameters.
You may provide the necessary values and configure the CommonJwtInterceptor during construction.

- jwtHeaderName
    - The name of the header, which contains the JWT assertion header
    - The default value is 'x-jwt-assertion'
    ```
    public function createInterceptors() returns [common_jwt_interceptor:CommonJwtInterceptor] {
        return [new common_jwt_interceptor:CommonJwtInterceptor(jwtHeaderName = "Custom_Header")];
    }
    ```

- extractFields
    - Fields to be extracted from the JWT
    - The default value is ['email', 'groups']
    ```
    public function createInterceptors() returns [common_jwt_interceptor:CommonJwtInterceptor] {
        return [new common_jwt_interceptor:CommonJwtInterceptor(extractFields = ["sub", "org_id"])];
    }
    ```

- pathsToSkip
    - Paths to be skipped/ignored by the CommonJwtInterceptor
    - The default value is []
    ```
    public function createInterceptors() returns [common_jwt_interceptor:CommonJwtInterceptor] {
        return [new common_jwt_interceptor:CommonJwtInterceptor(
            pathsToSkip = ["health", string `collection1/\d+/collection2/\S+`])];
    }
    ```

# How to access extracted data
The extracted information can be read directly to the record given by the library if the CommonJwtInterceptor is initialized with default \'extractFields\'.
```
common_jwt_interceptor:InvokerDetails invokerDetails = check ctx.getWithType(common_jwt_interceptor:EXTRACTED_DATA);
// Access the prepopulated data
log:printInfo(string `Email: ${invokerDetails.email}`);
log:printInfo(string `Groups: ${invokerDetails.groups.toString()}`);
```
In the above example, the record specified in the library  (common_jwt_interceptor:InvokerDetails) is utilized as the default required fields are used (['email', 'groups']).

If you want to extract additional/different fields, you must define a record with the relevant fields and extract them.

```
# The CustomInvokerDetails record represents the details of the invoker.
public type CustomInvokerDetails record {|
    # The sub of the invoker
    string sub;
    # The organization id
    string org_id;
|};

# Initialize the interceptor
public function createInterceptors() returns [common_jwt_interceptor:CommonJwtInterceptor] {
    return [new common_jwt_interceptor:CommonJwtInterceptor(extractFields = ["sub", "org_id"])];
}

CustomInvokerDetails invokerDetails = check ctx.getWithType(common_jwt_interceptor:EXTRACTED_DATA);
// Access the prepopulated data
log:printInfo(string `Email: ${invokerDetails.sub}`);
log:printInfo(string `OrgId: ${invokerDetails.org_id}`);
```

# Contributing
We welcome contributions to enhance the CommonJwtInterceptor module. To contribute, please fork the repository, create a new branch, and submit a pull request with your changes.

# License
Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.

# Contact
For any questions or issues, please open an issue on the GitHub repository or contact the maintainer at internal-apps-group@wso2.com.