import { describe, expect, it } from "vitest";
import { sessionCodec } from "./session.js";

describe("sessionCodec", () => {
  it("sessionCodec round-trip preserves all fields", () => {
    const original = {
      threadId: "thread-abc-123",
      assistantId: "asst-xyz-789",
      tenantId: "tenant-company-456",
    };

    const serialized = sessionCodec.serialize(original);
    expect(serialized).toEqual(original);

    const deserialized = sessionCodec.deserialize(serialized);
    expect(deserialized).toEqual(original);
  });

  it("sessionCodec rejects malformed payloads returning null", () => {
    expect(sessionCodec.deserialize(null)).toBeNull();
    expect(sessionCodec.deserialize(undefined)).toBeNull();
    expect(sessionCodec.deserialize("not an object")).toBeNull();
    expect(sessionCodec.deserialize(12345)).toBeNull();
    expect(sessionCodec.deserialize([])).toBeNull();
    expect(sessionCodec.deserialize({})).toBeNull();

    // Missing assistantId & tenantId
    expect(
      sessionCodec.deserialize({
        threadId: "only-thread",
      }),
    ).toBeNull();

    // Missing tenantId
    expect(
      sessionCodec.deserialize({
        threadId: "th-1",
        assistantId: "as-1",
      }),
    ).toBeNull();

    // Empty strings
    expect(
      sessionCodec.deserialize({
        threadId: "th-1",
        assistantId: "",
        tenantId: "ten-1",
      }),
    ).toBeNull();

    // Whitespace only
    expect(
      sessionCodec.deserialize({
        threadId: "  ",
        assistantId: "as-1",
        tenantId: "ten-1",
      }),
    ).toBeNull();

    // Non-string fields
    expect(
      sessionCodec.deserialize({
        threadId: 123,
        assistantId: "as-1",
        tenantId: "ten-1",
      }),
    ).toBeNull();
  });

  it("never returns partial object and strips extraneous secret fields", () => {
    const payloadWithSecrets = {
      threadId: "thread-safe",
      assistantId: "asst-safe",
      tenantId: "tenant-safe",
      apiKey: "secret-key-12345",
      bearerToken: "jwt.secret.token",
      password: "supersecretpassword",
    };

    const serialized = sessionCodec.serialize(payloadWithSecrets);
    expect(serialized).toEqual({
      threadId: "thread-safe",
      assistantId: "asst-safe",
      tenantId: "tenant-safe",
    });
    expect(serialized).not.toHaveProperty("apiKey");
    expect(serialized).not.toHaveProperty("bearerToken");
    expect(serialized).not.toHaveProperty("password");

    const deserialized = sessionCodec.deserialize(payloadWithSecrets);
    expect(deserialized).toEqual({
      threadId: "thread-safe",
      assistantId: "asst-safe",
      tenantId: "tenant-safe",
    });
    expect(deserialized).not.toHaveProperty("apiKey");
    expect(deserialized).not.toHaveProperty("bearerToken");
    expect(deserialized).not.toHaveProperty("password");
  });

  it("getDisplayId returns threadId or null", () => {
    expect(
      sessionCodec.getDisplayId?.({
        threadId: "th-display-1",
        assistantId: "as-1",
        tenantId: "ten-1",
      }),
    ).toBe("th-display-1");

    expect(sessionCodec.getDisplayId?.(null)).toBeNull();
    expect(sessionCodec.getDisplayId?.({})).toBeNull();
    expect(
      sessionCodec.getDisplayId?.({
        threadId: "   ",
      }),
    ).toBeNull();
    expect(
      sessionCodec.getDisplayId?.({
        threadId: 999 as unknown as string,
      }),
    ).toBeNull();
  });

  it("pendingResume persisted in sessionParams", () => {
    const sessionWithPendingResume = {
      threadId: "thread-hitl-123",
      assistantId: "asst-hitl-456",
      tenantId: "tenant-hitl-789",
      interruptId: "interrupt-step-1",
      pendingResume: {
        interruptId: "interrupt-step-1",
        requestId: "request-uuid-abc",
      },
    };

    const serialized = sessionCodec.serialize(sessionWithPendingResume);
    expect(serialized).toEqual(sessionWithPendingResume);

    const deserialized = sessionCodec.deserialize(serialized);
    expect(deserialized).toEqual(sessionWithPendingResume);
    expect(deserialized?.pendingResume).toEqual({
      interruptId: "interrupt-step-1",
      requestId: "request-uuid-abc",
    });

    // Strips extraneous secrets while preserving pendingResume
    const withSecrets = {
      ...sessionWithPendingResume,
      secretToken: "super-secret-token",
    };
    const serializedClean = sessionCodec.serialize(withSecrets);
    expect(serializedClean).toEqual(sessionWithPendingResume);
    expect(serializedClean).not.toHaveProperty("secretToken");

    // Malformed pendingResume is omitted but valid base params survive
    const withMalformedPending = {
      threadId: "thread-hitl-123",
      assistantId: "asst-hitl-456",
      tenantId: "tenant-hitl-789",
      pendingResume: {
        interruptId: 123,
      },
    };
    const deserializedMalformed = sessionCodec.deserialize(withMalformedPending);
    expect(deserializedMalformed).toEqual({
      threadId: "thread-hitl-123",
      assistantId: "asst-hitl-456",
      tenantId: "tenant-hitl-789",
    });
    expect(deserializedMalformed).not.toHaveProperty("pendingResume");
  });
});
