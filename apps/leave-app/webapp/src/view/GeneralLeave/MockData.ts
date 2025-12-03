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

// NOTE: THIS IS MOCK TEST DATA FOR TESTING PURPOSES ONLY (TO BE REMOVED)
export interface EmailContact {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export const mockEmailContacts: EmailContact[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@leaveapp.com",
    department: "Engineering",
    role: "Senior Developer"
  },
  {
    id: "2", 
    name: "Sarah Johnson",
    email: "sarah.johnson@leaveapp.com",
    department: "HR",
    role: "HR Manager"
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.brown@leaveapp.com", 
    department: "Engineering",
    role: "Team Lead"
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@leaveapp.com",
    department: "Marketing",
    role: "Marketing Specialist"
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.wilson@leaveapp.com",
    department: "Engineering", 
    role: "DevOps Engineer"
  },
  {
    id: "6",
    name: "Lisa Garcia",
    email: "lisa.garcia@leaveapp.com",
    department: "Design",
    role: "UX Designer"
  },
  {
    id: "7",
    name: "Robert Martinez",
    email: "robert.martinez@leaveapp.com",
    department: "Sales",
    role: "Sales Manager"
  },
  {
    id: "8",
    name: "Jennifer Lee",
    email: "jennifer.lee@leaveapp.com",
    department: "Engineering",
    role: "Frontend Developer"
  },
  {
    id: "9",
    name: "James Taylor",
    email: "james.taylor@leaveapp.com",
    department: "Operations",
    role: "Operations Manager"
  },
  {
    id: "10",
    name: "Amanda Rodriguez",
    email: "amanda.rodriguez@leaveapp.com",
    department: "Finance",
    role: "Financial Analyst"
  }
];

// Email groups
export interface EmailGroup {
  id: string;
  name: string;
  description: string;
  members: string[]; 
}

export const mockEmailGroups: EmailGroup[] = [
  {
    id: "eng-team",
    name: "Engineering Team",
    description: "All engineering team members",
    members: [
      "john.smith@leaveapp.com",
      "michael.brown@leaveapp.com", 
      "david.wilson@leaveapp.com",
      "jennifer.lee@leaveapp.com"
    ]
  },
  {
    id: "management",
    name: "Management",
    description: "All managers and team leads",
    members: [
      "sarah.johnson@leaveapp.com",
      "michael.brown@leaveapp.com",
      "robert.martinez@leaveapp.com",
      "james.taylor@leaveapp.com"
    ]
  },
  {
    id: "hr-team",
    name: "HR Team", 
    description: "Human Resources department",
    members: ["sarah.johnson@leaveapp.com"]
  },
  {
    id: "all-staff",
    name: "All Staff",
    description: "Everyone in the organization",
    members: mockEmailContacts.map(contact => contact.email)
  }
];

