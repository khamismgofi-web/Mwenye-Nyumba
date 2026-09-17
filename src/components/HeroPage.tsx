import heroBg from "./assets/hero-bg.jpg";

export default function HeroPage() {
  return (
    <div>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
        <p className="font-serif text-lg text-[#1B2430]">Mwenye-Nyumba</p>
        <a href="#" className="text-sm font-medium text-[#1B2430] hover:opacity-70">
          Sign in
        </a>
      </nav>

      {/* Hero */}
      <section
        className="w-full py-24 md:py-32 px-6 md:px-10 bg-cover"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(27,36,48,0.88) 15%, rgba(27,36,48,0.55) 55%, rgba(27,36,48,0.35) 100%), url(${heroBg})`,
          backgroundPosition: "center 40%",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-[2.75rem] md:text-6xl leading-[1.05] text-white">
            Every property.
            <br />
            One place to manage it.
          </h1>
          <p className="text-lg mt-6 max-w-md leading-relaxed text-[#D7DCE2]">
            Units, tenants, rent, and repairs — tracked in one dashboard, instead of a
            notebook and a dozen phone calls.
          </p>
          <div className="mt-9 flex items-center gap-6">
            <button className="px-6 py-3 rounded text-sm font-medium text-white bg-[#0F5C4E] hover:opacity-90 transition-opacity">
              Get started
            </button>
            <a
              href="#"
              className="text-sm font-medium underline text-white"
              style={{ textUnderlineOffset: "3px", textDecorationColor: "#C98A2C" }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24 pt-24 bg-[#F5F6F3]">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#DDE1DC] border-t border-[#DDE1DC]">
          <div className="py-8 md:py-10 md:pr-8">
            <p className="font-serif text-xl mb-2 text-[#1B2430]">Rent, tracked automatically</p>
            <p className="text-sm leading-relaxed text-[#6B7280]">
              See who's paid, who's late, and by how much — without opening a spreadsheet.
            </p>
          </div>
          <div className="py-8 md:py-10 md:px-8">
            <p className="font-serif text-xl mb-2 text-[#1B2430]">Tenants link themselves</p>
            <p className="text-sm leading-relaxed text-[#6B7280]">
              Give a new tenant a code for their unit. They enter it once, and their
              account is linked — no manual setup.
            </p>
          </div>
          <div className="py-8 md:py-10 md:pl-8">
            <p className="font-serif text-xl mb-2 text-[#1B2430]">Repairs, out of your inbox</p>
            <p className="text-sm leading-relaxed text-[#6B7280]">
              Maintenance requests come in through the app and stay there until they're
              actually resolved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}