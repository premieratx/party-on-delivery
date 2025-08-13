import React from "react";

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid gap-8 md:grid-cols-2 items-center">
        <div>
          <h1 className="text-4xl/tight md:text-5xl/tight font-extrabold tracking-tight">
            Instant party & concierge delivery in Austin
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Alcohol, party kits, rentals, and more — delivered fast to your Airbnb or boat.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/shop" className="inline-flex items-center rounded-2xl px-5 py-3 bg-black text-white">
              Shop now
            </a>
            <a href="/concierge" className="inline-flex items-center rounded-2xl px-5 py-3 border">
              Book concierge
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Open late • Verified ID on delivery • No hidden fees</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
          <div className="h-28 md:h-40 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </section>
  );
};
