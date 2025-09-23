import { z } from "zod";

/** Helpers for { year, month, day } calendar validation */
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) =>
  [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

/** Y-M-D date object */
export const YMDDateSchema = z
  .object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  })
  .superRefine((d, ctx) => {
    if (d.day > daysInMonth(d.year, d.month)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid calendar date",
        path: ["day"],
      });
    }
  });

/** Nullable Y-M-D date */
export const NullableYMDDateSchema = YMDDateSchema.nullable();

/** Common field validators */
const nonEmpty = z.string().min(1, "Required");
const email = z.string().email("Invalid email");
const phone = z.string().regex(/^[0-9+\-().\s]{7,20}$/, "Invalid phone number");

/** Employee schema matching your TS type exactly */
export const EmployeeSchema = z.object({
  id: nonEmpty,
  lastName: nonEmpty,
  firstName: nonEmpty,
  epf: z.string().nullable(),
  employeeLocation: z.string().nullable(),
  workLocation: z.string().nullable(),
  wso2Email: email,
  workPhoneNumber: z
    .string()
    .nullable()
    .refine((v) => v === null || phone.safeParse(v).success, { message: "Invalid phone number" }),
  startDate: YMDDateSchema, // required
  jobRole: z.string().nullable(),
  managerEmail: z.string().email().nullable(),
  reportToEmail: z.string().email().nullable(),
  additionalManagerEmail: z.string().email().nullable(),
  additionalReportToEmail: z.string().email().nullable(),
  employeeStatus: z.string().nullable(),
  lengthOfService: z.number().int().nonnegative().nullable(),
  subordinateCount: z.number().int().nonnegative().nullable(),
  probationEndDate: NullableYMDDateSchema,
  agreementEndDate: NullableYMDDateSchema,
  employmentTypeId: z.number().int(),
  designationId: z.number().int(),
  officeId: z.number().int(),
  teamId: z.number().int(),
  companyId: z.number().int(),
  subTeamId: z.number().int(),
  businessUnitId: z.number().int(),
  unitId: z.number().int(),
  personalInfoId: z.number().int(),
});

export type EmployeeValidated = z.infer<typeof EmployeeSchema>;

export const PersonalInfoSchema = z.object({
  nic: z.string().min(5, "NIC must be at least 5 characters"),

  fullName: z.string().min(1, "Full name is required"),

  nameWithInitials: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),

  title: z.string().min(1, "Title is required"),

  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format (expected ISO date string)",
  }),

  age: z.number().int().positive().optional(),

  personalEmail: z.string().email("Invalid email format"),

  personalPhone: z.string().min(7, "Phone number is too short"),
  homePhone: z.string().min(7, "Phone number is too short"),

  address: z.string().min(1, "Address is required"),

  postalCode: z.string().optional(),

  country: z.string().min(1, "Country is required"),

  nationality: z.string().optional(),

  languageSpoken: z.string().optional(),

  createdBy: z.string().min(1),
  createdOn: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid createdOn timestamp" }),
  updatedBy: z.string().min(1),
  updatedOn: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid updatedOn timestamp" }),
});

// Inferred TS type (optional, if you want to use it)
export type PersonalInfoValidated = z.infer<typeof PersonalInfoSchema>;

export const EmployeeCreationSchema = z.object({
  lastName: nonEmpty,
  firstName: nonEmpty,
  epf: z.string().nullable(),
  employeeLocation: z.string().nullable(),
  workLocation: z.string().nullable(),
  wso2Email: email,
  workPhoneNumber: z
    .string()
    .nullable()
    .refine((v) => v === null || phone.safeParse(v).success, { message: "Invalid phone number" }),
  startDate: NullableYMDDateSchema,
  jobRole: z.string().nullable(),
  managerEmail: z.string().email().nullable(),
  reportToEmail: z.string().email().nullable(),
  additionalManagerEmail: z.string().email().nullable(),
  additionalReportToEmail: z.string().email().nullable(),
  employeeStatus: z.string().nullable(),
  lengthOfService: z.number().int().nonnegative().nullable(),
  subordinateCount: z.number().int().nonnegative().nullable(),
  probationEndDate: NullableYMDDateSchema,
  agreementEndDate: NullableYMDDateSchema,
  employmentTypeId: z.number().int(),
  designationId: z.number().int(),
  officeId: z.number().int(),
  teamId: z.number().int(),
  companyId: z.number().int(),
  subTeamId: z.number().int(),
  businessUnitId: z.number().int(),
  unitId: z.number().int(),
  personalInfoId: z.number().int(),
});

export type EmployeeCreationValidated = z.infer<typeof EmployeeCreationSchema>;
