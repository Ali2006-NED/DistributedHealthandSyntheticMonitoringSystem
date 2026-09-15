import { env } from '../../config/env.js';

export function setAuthCookie(reply, cookie) {
  reply.setCookie('token', cookie, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * Number.parseInt(env.JWT_EXPIRES_IN) // Convert JWT_EXPIRES_IN to number and multiply by 60 for seconds
  });
}