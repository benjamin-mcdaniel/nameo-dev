import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isPublic = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  if (!isPublic(context.request) && !auth().userId) {
    return auth().redirectToSignIn({ returnBackUrl: context.request.url });
  }
});
