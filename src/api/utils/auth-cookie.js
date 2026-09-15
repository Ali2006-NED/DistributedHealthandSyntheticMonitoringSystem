import { env } from '../../config/env.js';

export function setAuthCookie(reply, cookie) {
  reply.setCookie('token', cookie, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15 // 15 minutes
  });
}