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

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logger } from "@/utils/logger";

const RELOAD_COUNT_KEY = "people_error_boundary_reload_count";
const MAX_AUTO_RELOADS = 2;

function getReloadCount(): number {
  return parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) ?? "0", 10);
}

function incrementReloadCount(): number {
  const next = getReloadCount() + 1;
  sessionStorage.setItem(RELOAD_COUNT_KEY, String(next));
  return next;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary. On a React render crash, silently reloads the
 * WebView (equivalent to force-close + reopen) so the wallet return resume
 * flow can restart cleanly without user intervention. A sessionStorage counter
 * prevents infinite reload loops — after MAX_AUTO_RELOADS attempts a minimal
 * fallback screen is shown instead.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Logger.error("AppErrorBoundary", { error: error.message, stack: info.componentStack });

    const count = incrementReloadCount();
    if (count <= MAX_AUTO_RELOADS) {
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // Only reached if auto-reloads are exhausted — render a minimal fallback.
    return (
      <div className="h-screen bg-white grid place-items-center px-6">
        <div className="text-center max-w-[320px]">
          <div className="text-[#ff7300] font-bold text-xl mb-3">
            Something went wrong
          </div>
          <div className="text-[#6B7280] text-[15px] leading-snug">
            We encountered an issue while loading the app. Please try again later.
          </div>
        </div>
      </div>
    );
  }
}
