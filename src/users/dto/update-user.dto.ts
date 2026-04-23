import { createZodDto } from "nestjs-zod";
import { createUserSchema } from "./create-user.dto";
import { z } from "zod";

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
