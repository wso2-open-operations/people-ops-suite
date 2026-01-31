### Create and register an OpenID Connect single-page app in Asgardeo

Follow the instructions given in [Register an OpenID Connect single-page app](https://wso2.com/asgardeo/docs/guides/applications/register-single-page-app/) to create a new Application in [Asgardeo](https://accounts.asgardeo.io/).
When creating this, be sure to give the Authorized Redirect URL correctly. By default, this React app will start in http://localhost:3000. Therefore, that should be the value here. Make sure to also add the same to Allowed origins in the Asgardeo application.
Note that this URL is `http` and not `https`. If the URL the React app starts in is not the exact URL given in the Asgardeo app, then it will run into an issue.

### Create config.js file in the `public` folder, with the following environment variables

Replace the values as necessary. `REACT_APP_BACKEND_BASE_URL` can be left as an empty string for now.
The other values can be found in the **Quick Start** tab in the Asgardeo application.

```js
window.config = {
  REACT_APP_BACKEND_BASE_URL: "",
  REACT_APP_ASGARDEO_CLIENT_ID: "xxxx",
  ASGARDEO_CLIENT_SECRET: "",
  REACT_APP_ASGARDEO_BASE_URL: "https://api.asgardeo.io/t/xxxx",
  REACT_APP_AUTH_SIGN_IN_REDIRECT_URL: "http://localhost:3000",
  REACT_APP_AUTH_SIGN_OUT_REDIRECT_URL: "http://localhost:3000",
};
```

---
