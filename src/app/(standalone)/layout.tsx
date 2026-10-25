import { Logo } from "@/components/brand/logo";

/** Forbidden and payment result pages: the auth shell with one centered card (design-plan §6.1). */
export default function StandaloneLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6 lg:px-8">
        <Logo />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center px-4 pt-4 pb-16 outline-none md:px-6 md:pt-16"
      >
        {children}
      </main>
    </>
  );
}
