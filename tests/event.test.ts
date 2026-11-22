import { describe, it, expect } from "vitest";
import { EventSchema } from "@/lib/schemas/event";

describe("Event Creation & Schema Validation", () => {
  it("validates a valid event creation payload", () => {
    const valid = {
      name: "New Clean Hackathon",
      slug: "new-clean-hackathon",
      tagline: "48 hours of building",
      rulesMd: "Build anything original.",
      maxTeamSize: 4,
    };

    const result = EventSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("new-clean-hackathon");
      expect(result.data.maxTeamSize).toBe(4);
    }
  });

  it("rejects uppercase or invalid characters in event slug", () => {
    const invalid = {
      name: "Invalid Slug Event",
      slug: "Invalid_Slug!",
    };

    const result = EventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("enforces team size constraints between 1 and 20", () => {
    const tooSmall = {
      name: "Tiny Team",
      slug: "tiny-team",
      maxTeamSize: 0,
    };
    expect(EventSchema.safeParse(tooSmall).success).toBe(false);

    const tooBig = {
      name: "Huge Team",
      slug: "huge-team",
      maxTeamSize: 50,
    };
    expect(EventSchema.safeParse(tooBig).success).toBe(false);
  });
});
