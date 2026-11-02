let token: string | null = null;

export function rememberedPushToken(): string | null {
  return token;
}

export function rememberPushToken(value: string | null) {
  token = value;
}
