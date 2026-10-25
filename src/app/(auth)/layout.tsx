import { GoogleOAuthProvider } from "@react-oauth/google";
import { Logo } from "@/components/brand/logo";
import { publicEnv } from "@/lib/env/public";

/**
 * Sign-in and sign-up: a centered column with the logo top-left and no site nav. Google's
 * script loads here and nowhere else (implementation-plan §4.4).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    // The site is English-only; without a locale Google labels its button in the visitor's
    // browser or network language.
    <GoogleOAuthProvider
      clientId={publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      locale="en"
    >
      <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6 lg:px-8">
        <Logo />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center px-4 pt-4 pb-16 outline-none md:px-6 md:pt-10"
      >
        {children}
      </main>
    </GoogleOAuthProvider>
  );
}
