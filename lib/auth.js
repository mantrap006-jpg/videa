import jwt from "jsonwebtoken";

const COOKIE_NAME = "videa_token";

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function getTokenFromRequest(request) {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}

export function getUserFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export { COOKIE_NAME };