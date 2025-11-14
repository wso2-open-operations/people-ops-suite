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

const path = require("path");

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@root": path.resolve(__dirname),
    "@src": path.resolve(__dirname, "src"),
    "@app": path.resolve(__dirname, "src/app"),
    "@assets": path.resolve(__dirname, "src/assets"),
    "@component": path.resolve(__dirname, "src/component"),
    "@config": path.resolve(__dirname, "src/config"),
    "@context": path.resolve(__dirname, "src/context"),
    "@layout": path.resolve(__dirname, "src/layout"),
    "@slices": path.resolve(__dirname, "src/slices"),
    "@view": path.resolve(__dirname, "src/view"),
    "@utils": path.resolve(__dirname, "src/utils"),
    "@/types": path.resolve(__dirname, "src/types"),
  };
  return config;
};
