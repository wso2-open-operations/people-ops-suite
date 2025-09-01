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

import { SearchInput } from "@/components/ui";

function Header() {
  return (
    <header className="w-full bg-white px-4 sticky top-0">
      <div className="pb-[1.2rem] border-b-[1px] border-[#E5E5E5] mt-5">
        <SearchInput />
      </div>
    </header>
  );
}

export default Header;
