---
name: add-feature-module
description: Use when the user asks to add a new feature module, create a new resource, scaffold a new domain area, or "add a <noun>" module (e.g., "add a posts module", "create an orders feature"). Enforces this template's repository-port pattern, Zod DTOs, co-located entities, and migration workflow.
---

# Adding a feature module

This template ships a specific shape for feature modules. Follow every step — skipping any breaks the ORM-swap guarantee or the Zod-as-source-of-truth rule.

## Module shape

```
src/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.service.spec.ts
  <name>.entity.ts               # TypeORM entity, co-located (NOT in a central dir)
  <name>.repository.ts           # port (interface) — callers depend on this
  <name>.repository.typeorm.ts   # adapter (TypeORM implementation)
  dto/
    create-<name>.dto.ts         # Zod schema + createZodDto
    update-<name>.dto.ts
```

## Steps

1. **Generate the module skeleton.**

   ```bash
   pnpm exec nest g module <name> --no-spec
   pnpm exec nest g controller <name> --no-spec
   pnpm exec nest g service <name>
   ```

   The CLI places files under `src/<name>/`.

2. **Create the entity at `src/<name>/<name>.entity.ts`** (co-located, not in a shared folder). Use `@PrimaryGeneratedColumn("uuid")`. `autoLoadEntities: true` in `app.module.ts` picks it up automatically.

3. **Define DTOs under `src/<name>/dto/`.** Never use `class-validator`. Use Zod:

   ```ts
   import { createZodDto } from "nestjs-zod";
   import { z } from "zod";

   export const create<Name>Schema = z.object({ ... });
   export type Create<Name>Input = z.infer<typeof create<Name>Schema>;
   export class Create<Name>Dto extends createZodDto(create<Name>Schema) {}
   ```

   For `update-*.dto.ts`, derive from the create schema: `create<Name>Schema.partial()` or `.omit({...}).partial()`.

4. **Define the repository port at `src/<name>/<name>.repository.ts`.** This is an abstract class or `InjectionToken`. Callers MUST depend on this, never on the TypeORM implementation directly. This is what makes the ORM swappable.

   Pattern (see `src/users/users.repository.ts` for the canonical example):

   ```ts
   export abstract class <Name>sRepository {
     abstract create(...): Promise<<Name>>;
     abstract findById(id: string): Promise<<Name> | null>;
     // ...
   }
   ```

5. **Implement the TypeORM adapter at `src/<name>/<name>.repository.typeorm.ts`.** Use `@InjectRepository(<Name>)` to get the TypeORM repo. Register this class as the provider for `<Name>sRepository` in the module.

6. **Wire the module (`src/<name>/<name>.module.ts`):**

   ```ts
   imports: [TypeOrmModule.forFeature([<Name>])],
   controllers: [<Name>sController],
   providers: [
     <Name>sService,
     { provide: <Name>sRepository, useClass: TypeOrm<Name>sRepository },
   ],
   exports: [<Name>sService],
   ```

7. **Controller conventions:**
   - `@Controller({ path: "<plural>", version: "1" })` — URI versioning, all routes under `/api/v1`.
   - `@ApiTags("<plural>")` and `@ApiBearerAuth()` for Swagger.
   - Guards: `JwtAuthGuard` is global; use `@Public()` from `src/common/decorators/public.decorator.ts` for unauthenticated endpoints.
   - Role-gated routes: `@UseGuards(RolesGuard)` + `@Roles("ADMIN")`.

8. **Service spec (`<name>.service.spec.ts`).** At minimum, test one method. Mock the repository port (not the TypeORM adapter) — this keeps tests fast and independent of DB.

9. **Register the module in `app.module.ts`** under `imports:`.

10. **Generate and apply the migration:**

    ```bash
    pnpm db:migrate:generate src/migrations/Add<Name>
    pnpm db:migrate:run
    ```

    Review the generated SQL before running. Migrations with destructive ops (DROP, ALTER with data loss) need manual review.

11. **Verify.** Run `pnpm build && pnpm test && pnpm lint` before declaring done.

## What NOT to do

- Do NOT put the entity in a central `database/` or `entities/` folder.
- Do NOT use `class-validator` or `class-transformer` for DTOs — they are not in `package.json`.
- Do NOT have the service depend on the TypeORM adapter directly.
- Do NOT hand-write SQL migrations unless there is a specific reason TypeORM's generator cannot express the change.
- Do NOT skip the `.spec.ts` file — unit coverage on the repository-port pattern is trivial and catches wiring bugs.

## Reference files

- Canonical module: `src/users/` — study it before starting.
- DTO pattern: `src/users/dto/create-user.dto.ts`.
- Repository port + adapter: `src/users/users.repository.ts` and `src/users/users.repository.typeorm.ts`.
