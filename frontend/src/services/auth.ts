export const login = async (username: string, password: string) => {
  // 実際の実装はこれから
  return { token: 'dummy-token', user: { username } };
};

export const logout = async () => {
  // 実際の実装はこれから
};

export default { login, logout };
