import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export class CreateUserDto extends createZodDto(createUserSchema) {}
