---
name: add-websocket-event
description: Use when the user asks to add a Socket.IO event, WebSocket handler, "@SubscribeMessage", real-time push, server-emitted event, or anything that involves sending/receiving messages over the WS connection. Enforces this template's handshake-auth + Zod-validated-payloads + user-scoped-rooms pattern.
---

# Adding a WebSocket event

The template's WS architecture has three invariants that every new event must respect:

1. **Auth happens at handshake.** `RedisIoAdapter` (in `src/common/adapters/redis-io.adapter.ts`) installs `io.use()` middleware that verifies the JWT and attaches `socket.data.user = { id, email, role }`. Any handler that runs can trust `socket.data.user` exists.

2. **Every payload is Zod-parsed.** The `WsZodValidationPipe` (in `src/common/pipes/ws-zod-validation.pipe.ts`) is the WS analogue of the global HTTP `ZodValidationPipe`. Use it declaratively via `@UsePipes` — never hand-roll `.parse()` inside a handler.

3. **Server-side broadcast is always scoped to a room.** Never call `this.server.emit(...)` without a room. The template's convention is `user:${userId}` rooms, joined at connection time.

## Steps

### For an inbound event (client → server)

1. **Define the payload schema.** Add to `src/<module>/<module>.schema.ts`:

   ```ts
   export const <eventName>EventSchema = z.object({ ... });
   export type <EventName>Event = z.infer<typeof <eventName>EventSchema>;
   ```

2. **Add the handler to the gateway:**

   ```ts
   @SubscribeMessage("<event-name>")
   @UsePipes(new WsZodValidationPipe(<eventName>EventSchema))
   handle<EventName>(
     @ConnectedSocket() client: Socket,
     @MessageBody() body: <EventName>Event,  // already parsed by the pipe
   ) {
     const userId = client.data.user.id;  // guaranteed non-null by handshake auth
     // ...
     return { event: "<ack-event>", data: ... };  // optional ack
   }
   ```

3. **Never trust `client.data` beyond `user`.** It's untyped.

### For an outbound event (server → client)

1. **Define the payload schema.** Even for server-emitted events, document the shape so clients can generate types from it.

2. **Emit through a room, never globally:**

   ```ts
   // to one user's devices
   this.server.to(`user:${userId}`).emit("<event>", payload);

   // to a group
   this.server.to(`group:${groupId}`).emit("<event>", payload);
   ```

3. **If the emission is a side-effect of a BullMQ job** (reliable delivery semantics): enqueue with `NotificationsService.enqueue(...)`. The processor handles the emit. This pattern survives the sending node restarting.

4. **If the emission is transactional to a controller action** (fire-and-forget): inject the gateway and call `emitToUser` directly.

### For a new room type

If adding rooms beyond `user:*` (e.g., `group:*`, `org:*`):

1. Join during `handleConnection` or in a `@SubscribeMessage("join-room")` handler after auth checks.
2. Always prefix the room name with a namespace (`group:<id>`, not just `<id>`) to avoid collisions.
3. Leave on disconnect (Socket.IO does this automatically).

### Testing

1. Create a spec file: `<module>.gateway.spec.ts`.
2. Construct a mock `Socket` with `data.user = { id, email, role }`.
3. Call the handler directly; assert the return shape.
4. For emit assertions, mock the `server` and spy on `.to(room).emit(event, payload)`.

### Verify

`pnpm build && pnpm test && pnpm lint`.

## What NOT to do

- Do NOT add `@UseGuards(WsJwtGuard)` — that guard was removed. Auth is enforced at the handshake. Any `@SubscribeMessage` handler that runs is already authenticated.
- Do NOT read auth from `client.handshake.headers` inside a handler. Use `client.data.user`.
- Do NOT call `this.server.emit(...)` with no room — that broadcasts to every connected client across every node in the cluster. Almost never what you want.
- Do NOT hand-roll JSON parsing in a handler. Use `@UsePipes(new WsZodValidationPipe(schema))`.
- Do NOT configure CORS or the Redis adapter inside the gateway. Both live in `RedisIoAdapter` and apply globally.
- Do NOT use `@WebSocketGateway({ namespace: ... })` without discussing — the template assumes the default namespace; introducing namespaces changes the client-side connection URL.

## Reference files

- Adapter (auth, CORS, Redis pub/sub): `src/common/adapters/redis-io.adapter.ts`.
- Pipe: `src/common/pipes/ws-zod-validation.pipe.ts`.
- Gateway example: `src/notifications/notifications.gateway.ts`.
- Schema example: `src/notifications/notifications.schema.ts`.
