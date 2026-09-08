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

import type { PageProps } from "@/types";
import { services } from "@/constants";
import { Header } from "@/components/core";
import { PageTransitionWrapper } from "@/components/shared";
import { ServiceTile } from "@/components/features/services";
import { useEffect, useState } from "react";

function HomePage({ user: _user }: PageProps) {
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    // Derive the version from the deployed micro-app manifest (microapp.json served at
    // the app root); hide the version on any failure or if it isn't defined.
    fetch("microapp.json")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ versions?: { version?: string }[] }>)
          : Promise.reject(new Error(`microapp.json ${res.status}`)),
      )
      .then((manifest) => {
        const versions = manifest?.versions;
        const version =
          Array.isArray(versions) && versions.length > 0
            ? versions[versions.length - 1]?.version?.trim()
            : undefined;
        // Only show a real version (starts with a digit); ignore placeholders like "unknown".
        if (typeof version === "string" && /^\d/.test(version)) {
          setAppVersion(version);
        }
      })
      .catch(() => {
        // manifest missing / unreachable / malformed → keep the version hidden
      });
  }, []);

  return (
    <PageTransitionWrapper type="main">
      <div className="min-h-screen bg-[#F2F2EF] flex flex-col">
        <Header />
        <main className="px-4 pt-3 pb-4 flex flex-col gap-4 flex-1">
          {services.map((service, index) => (
            <ServiceTile key={index} {...service} />
          ))}
        </main>
        {appVersion && (
          <p
            className="text-center text-xs text-[#9AA0A6]"
            style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 12px)" }}
          >
            v{appVersion}
          </p>
        )}
      </div>
    </PageTransitionWrapper>
  );
}

export default HomePage;
