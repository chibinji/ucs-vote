export function BrandHeader({
  subtitle = "UNZA Computer Society Election",
}: {
  subtitle?: string;
}) {
  return (
    <header className="w-full print:hidden">
      <div className="ucs-masthead">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <img
            src="/branding/unza-crest.png"
            alt="The University of Zambia"
            className="h-16 w-auto object-contain sm:h-[4.5rem]"
          />
          <img
            src="/branding/ucs-lockup.png"
            alt="UNZA Computer Society"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </div>
      </div>
      <div className="ucs-pattern" />
      <div className="bg-[#2C8992] px-4 py-3 text-center text-white">
        <p className="font-[family-name:var(--font-display)] text-lg tracking-wide sm:text-2xl">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="mt-auto border-t border-[#454B4C]/10 bg-[#F6F2ED]/75 px-4 py-6 text-center text-sm text-[#454B4C] print:hidden">
      <p className="font-[family-name:var(--font-display)] tracking-wide">
        University of Zambia · Computer Society
      </p>
      <p className="mt-1 text-xs">Service and Excellence · Secret ballot · One voter, one vote</p>
    </footer>
  );
}
