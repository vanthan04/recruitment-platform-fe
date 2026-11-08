import {
  MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isPlausibleVietnamesePhoneNumber,
  newPasswordSchema,
  optionalPhoneNumberSchema,
  requiredPhoneNumberSchema,
} from "@/lib/validation/rules";

const messagesFor = (
  schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } },
  v: unknown,
) => {
  const result = schema.safeParse(v);
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
};

describe("newPasswordSchema (mirrors the backend's password rules)", () => {
  it("states the same limits as the backend", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_LENGTH).toBe(128);
  });

  it.each(["password123", "abcdefg1", "1234567a", "Abcdefg1!", "x".repeat(127) + "1"])(
    "accepts %p",
    (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(true);
    },
  );

  it("accepts exactly the maximum length", () => {
    expect(newPasswordSchema.safeParse("a".repeat(PASSWORD_MAX_LENGTH - 1) + "1").success).toBe(true);
  });

  it("rejects fewer than 8 characters, even when it has a letter and a digit", () => {
    expect(messagesFor(newPasswordSchema, "abc123")).toContain("Mật khẩu tối thiểu 8 ký tự");
    expect(messagesFor(newPasswordSchema, "abcde12")).toContain("Mật khẩu tối thiểu 8 ký tự"); // 7 chars
  });

  it("rejects all-digit and all-letter passwords", () => {
    expect(messagesFor(newPasswordSchema, "12345678")).toEqual(["Mật khẩu phải có ít nhất một chữ cái"]);
    expect(messagesFor(newPasswordSchema, "abcdefgh")).toEqual(["Mật khẩu phải có ít nhất một chữ số"]);
  });

  it("rejects the old 6-character minimum's typical passwords", () => {
    expect(newPasswordSchema.safeParse("abcdef").success).toBe(false);
    expect(newPasswordSchema.safeParse("123456").success).toBe(false);
  });

  it("rejects more than 128 characters", () => {
    expect(messagesFor(newPasswordSchema, "a1" + "x".repeat(PASSWORD_MAX_LENGTH))).toContain(
      "Mật khẩu tối đa 128 ký tự",
    );
  });

  it("rejects an empty password", () => {
    expect(newPasswordSchema.safeParse("").success).toBe(false);
  });
});

describe("Vietnamese phone numbers", () => {
  // Every one of these is accepted by the backend's @IsPhoneNumber('VN') — verified
  // against the real validator when this rule was written — so the form must never block them.
  it.each([
    "0912345678",
    "0912 345 678",
    "091-234-5678",
    "+84912345678",
    "+84 912 345 678",
    "84912345678",
    "912345678",
    "0398765432",
    "02438251234",
    "(024) 3825 1234",
    "028 3822 1234",
  ])("accepts %p (the backend accepts it too)", (value) => {
    expect(isPlausibleVietnamesePhoneNumber(value)).toBe(true);
  });

  it.each(["", "   ", "123456", "12345678", "abcdefghij", "09123abc78", "0912345678901", "+841234567890123"])(
    "rejects %p (certainly not a phone number)",
    (value) => {
      expect(isPlausibleVietnamesePhoneNumber(value)).toBe(false);
    },
  );

  it("requiredPhoneNumberSchema refuses a blank value with a Vietnamese message", () => {
    expect(messagesFor(requiredPhoneNumberSchema, "")).toEqual([
      "Số điện thoại không hợp lệ (ví dụ: 0912 345 678)",
    ]);
    expect(requiredPhoneNumberSchema.safeParse("0912345678").success).toBe(true);
  });

  it("optionalPhoneNumberSchema allows blank or missing, but still checks what is typed", () => {
    expect(optionalPhoneNumberSchema.safeParse("").success).toBe(true);
    expect(optionalPhoneNumberSchema.safeParse(undefined).success).toBe(true);
    expect(optionalPhoneNumberSchema.safeParse("0912345678").success).toBe(true);
    expect(optionalPhoneNumberSchema.safeParse("not a phone").success).toBe(false);
  });
});

describe("MAX_LENGTH mirrors the backend's @MaxLength", () => {
  it("has the backend's limits", () => {
    expect(MAX_LENGTH).toEqual({
      title: 200,
      jobLocation: 200,
      companyName: 200,
      address: 300,
      province: 200,
      ward: 200,
      cvTitle: 300,
    });
  });
});
