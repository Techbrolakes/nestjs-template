import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";
import { ConflictDomainException } from "../errors/domain.exception";

function makeHost(
  url = "/api/v1/test",
  requestId?: string,
): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status };
  const req = { url, id: requestId };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn(filter["logger"], "error").mockImplementation(() => undefined);
    jest.spyOn(filter["logger"], "warn").mockImplementation(() => undefined);
  });

  it("serializes a DomainException with its code, message, and details", () => {
    const { host, status, json } = makeHost("/api/v1/users", "req-1");
    const err = new ConflictDomainException("USER_EMAIL_TAKEN", "taken", {
      email: "a@b.co",
    });

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "USER_EMAIL_TAKEN",
        message: "taken",
        details: { email: "a@b.co" },
        path: "/api/v1/users",
        requestId: "req-1",
      }),
    );
    expect(json.mock.calls[0][0].timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("maps a NestJS NotFoundException to code=NOT_FOUND with 404", () => {
    const { host, status, json } = makeHost();

    filter.catch(new NotFoundException("missing"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0]).toMatchObject({
      code: "NOT_FOUND",
      message: "missing",
    });
  });

  it("normalizes a BadRequestException with array message into a comma-joined string", () => {
    const { host, status, json } = makeHost();
    const exc = new BadRequestException({
      message: ["email must be an email", "password too short"],
    });

    filter.catch(exc, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({
      code: "BAD_REQUEST",
      message: "email must be an email, password too short",
    });
  });

  it("passes through a custom code field from an HttpException body", () => {
    const { host, json } = makeHost();
    class CustomHttpError extends HttpException {
      constructor() {
        super({ code: "CUSTOM_CODE", message: "boom" }, 418);
      }
    }

    filter.catch(new CustomHttpError(), host);

    expect(json.mock.calls[0][0]).toMatchObject({
      code: "CUSTOM_CODE",
      message: "boom",
    });
  });

  it("renders unknown (non-HTTP) exceptions as 500/INTERNAL_ERROR", () => {
    const { host, status, json } = makeHost();

    filter.catch(new Error("unexpected"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0]).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  });

  it("logs 5xx at error level and 4xx at warn level", () => {
    const errorSpy = jest.spyOn(filter["logger"], "error");
    const warnSpy = jest.spyOn(filter["logger"], "warn");

    filter.catch(new Error("boom"), makeHost().host);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    filter.catch(new NotFoundException("missing"), makeHost().host);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
