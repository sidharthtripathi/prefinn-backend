import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

const occupationTypeSchema = z.enum([
    "SALARIED",
    "SELF_EMPLOYED",
    "BUSINESS",
    "RETIRED",
    "STUDENT",
  ]);
  

export const businessLoanSchema = z.object({
  fullName: z.string().min(1),
  mobileNumber: z
    .string()
    .refine(
      (value) => isValidPhoneNumber(value),
      "Invalid phone number format"
    ),
  city: z.string(), // replace with city enum
  pincode: z.string(), // depends on country as well
  propertyType: z.string(),
  panNumber: z.string(),
  occupationType: occupationTypeSchema,
  monthlyIncome : z.number().gt(0),
  loanAmount : z.number().gt(0),

});

export const businessLoanVerifySchema = z.object({
    otp : z.number(),
    businessLoanId : z.string()
})