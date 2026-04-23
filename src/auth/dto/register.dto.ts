import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export class RegisterDto extends createZodDto(registerSchema) {}
