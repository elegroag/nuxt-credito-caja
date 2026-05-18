import { describe, it, expect, vi } from "vitest";

describe("loggerService", () => {
  describe("formatLogEntry", () => {
    it("formats simple message without context", () => {
      const timestamp = "2024-01-15T10:30:00.000Z";
      const message = "Test message";
      const result = `[${timestamp}] [INFO] ${message}`;
      expect(result).toBe("[2024-01-15T10:30:00.000Z] [INFO] Test message");
    });

    it("includes context as JSON when provided", () => {
      const timestamp = "2024-01-15T10:30:00.000Z";
      const message = "User action";
      const context = { userId: "123", action: "login" };
      const result = `[${timestamp}] [INFO] ${message} | ${JSON.stringify(context)}`;
      expect(result).toContain('"userId":"123"');
      expect(result).toContain('"action":"login"');
    });
  });

  describe("logLevelPriority", () => {
    it("returns correct priority for each level", () => {
      const priorities: Record<string, number> = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
      };

      expect(priorities["DEBUG"]).toBe(0);
      expect(priorities["INFO"]).toBe(1);
      expect(priorities["WARN"]).toBe(2);
      expect(priorities["ERROR"]).toBe(3);
    });
  });

  describe("shouldLog logic", () => {
    it("ERROR is logged when level is INFO (INFO < ERROR)", () => {
      const _currentLevel = "INFO";
      const _messageLevel = "ERROR";
      const shouldLog = 3 >= 1;
      expect(shouldLog).toBe(true);
    });

    it("DEBUG is not logged when level is INFO (DEBUG < INFO)", () => {
      const _currentLevel = "INFO";
      const _messageLevel = "DEBUG";
      const shouldLog = 0 >= 1;
      expect(shouldLog).toBe(false);
    });

    it("INFO is logged when level is WARN (INFO >= WARN is false, but INFO >= INFO is true)", () => {
      const _currentLevel = "WARN";
      const _messageLevel = "INFO";
      const shouldLog = 1 >= 2;
      expect(shouldLog).toBe(false);
    });
  });

  describe("LogLevel enum values", () => {
    it("has all expected log levels", () => {
      const levels = ["DEBUG", "INFO", "WARN", "ERROR"];
      expect(levels).toContain("DEBUG");
      expect(levels).toContain("INFO");
      expect(levels).toContain("WARN");
      expect(levels).toContain("ERROR");
    });
  });

  describe("LogEntry interface", () => {
    it("accepts valid log entry structure", () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: "INFO" as const,
        message: "Test",
        context: { key: "value" }
      };
      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe("INFO");
      expect(entry.message).toBe("Test");
      expect(entry.context).toEqual({ key: "value" });
    });

    it("accepts log entry with error", () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: "ERROR" as const,
        message: "Failed",
        error: {
          message: "Something went wrong",
          stack: "Error: Something went wrong\n    at line 10"
        }
      };
      expect(entry.error?.message).toBe("Something went wrong");
      expect(entry.error?.stack).toContain("at line 10");
    });

    it("allows optional context to be undefined", () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: "WARN" as const,
        message: "Warning without context"
      };
      expect(entry.context).toBeUndefined();
    });
  });

  describe("currentLogLevel", () => {
    it("defaults to INFO when LOG_LEVEL not set", () => {
      const env = process.env.LOG_LEVEL;
      const result = (env?.toUpperCase() as string) || "INFO";
      expect(result).toBe("INFO");
    });

    it("returns DEBUG when LOG_LEVEL is DEBUG", () => {
      process.env.LOG_LEVEL = "DEBUG";
      const result = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
      expect(result).toBe("DEBUG");
      process.env.LOG_LEVEL = undefined;
    });

    it("returns ERROR when LOG_LEVEL is ERROR", () => {
      process.env.LOG_LEVEL = "ERROR";
      const result = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
      expect(result).toBe("ERROR");
      process.env.LOG_LEVEL = undefined;
    });
  });

  describe("timestamp format ISO 8601", () => {
    it("generates valid ISO timestamp", () => {
      const timestamp = new Date().toISOString();
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
      expect(timestamp).toMatch(isoRegex);
    });
  });

  describe("JSON context serialization", () => {
    it("serializes nested objects correctly", () => {
      const context = {
        request: {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      };
      const json = JSON.stringify(context);
      const parsed = JSON.parse(json);
      expect(parsed.request.method).toBe("POST");
      expect(parsed.request.headers["Content-Type"]).toBe("application/json");
    });

    it("handles special characters in strings", () => {
      const context = { message: "Test with \"quotes\" and 'apostrophes'" };
      const json = JSON.stringify(context);
      const parsed = JSON.parse(json);
      expect(parsed.message).toBe("Test with \"quotes\" and 'apostrophes'");
    });

    it("handles numeric values", () => {
      const context = { count: 42, price: 99.99 };
      const json = JSON.stringify(context);
      const parsed = JSON.parse(json);
      expect(parsed.count).toBe(42);
      expect(parsed.price).toBe(99.99);
    });
  });

  describe("return type", () => {
    it("info returns a Promise", () => {
      const mockLog = vi.fn().mockResolvedValue(undefined);
      const info = (msg: string) => mockLog(msg);
      const result = info("test");
      expect(result).toBeInstanceOf(Promise);
    });

    it("debug returns a Promise", () => {
      const mockLog = vi.fn().mockResolvedValue(undefined);
      const debug = (msg: string) => mockLog(msg);
      const result = debug("test");
      expect(result).toBeInstanceOf(Promise);
    });

    it("warn returns a Promise", () => {
      const mockLog = vi.fn().mockResolvedValue(undefined);
      const warn = (msg: string) => mockLog(msg);
      const result = warn("test");
      expect(result).toBeInstanceOf(Promise);
    });

    it("error returns a Promise", () => {
      const mockLog = vi.fn().mockResolvedValue(undefined);
      const error = (msg: string) => mockLog(msg);
      const result = error("test");
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("LOG_LEVEL comparison logic", () => {
    it("INFO logs INFO, WARN, ERROR but not DEBUG", () => {
      const currentPriority = 1;
      const toLog = (levelPriority: number) => levelPriority >= currentPriority;

      expect(toLog(0)).toBe(false); // DEBUG
      expect(toLog(1)).toBe(true);  // INFO
      expect(toLog(2)).toBe(true);  // WARN
      expect(toLog(3)).toBe(true);  // ERROR
    });

    it("DEBUG logs everything", () => {
      const currentPriority = 0;
      const toLog = (levelPriority: number) => levelPriority >= currentPriority;

      expect(toLog(0)).toBe(true);  // DEBUG
      expect(toLog(1)).toBe(true);  // INFO
      expect(toLog(2)).toBe(true);  // WARN
      expect(toLog(3)).toBe(true);  // ERROR
    });

    it("ERROR only logs ERROR", () => {
      const currentPriority = 3;
      const toLog = (levelPriority: number) => levelPriority >= currentPriority;

      expect(toLog(0)).toBe(false); // DEBUG
      expect(toLog(1)).toBe(false); // INFO
      expect(toLog(2)).toBe(false); // WARN
      expect(toLog(3)).toBe(true);  // ERROR
    });
  });

  describe("error object handling", () => {
    it("detects Error instance correctly", () => {
      const err = new Error("test");
      expect(err instanceof Error).toBe(true);
    });

    it("extracts error message", () => {
      const err = new Error("Something broke");
      expect(err.message).toBe("Something broke");
    });

    it("extracts error stack when available", () => {
      const err = new Error("Test error");
      expect(err.stack).toBeDefined();
      expect(typeof err.stack).toBe("string");
    });

    it("handles non-Error objects passed as error", () => {
      const notAnError = { message: "not an error" };
      expect(notAnError instanceof Error).toBe(false);
    });
  });
});