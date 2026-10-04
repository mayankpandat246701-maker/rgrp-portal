"use client";

import Link from "next/link";
type DirectoryFiltersProps = {
  states: string[];
  districts: Array<{ state: string; district: string }>;
  daitvas: string[];
  values: {
    q: string;
    state: string;
    district: string;
    daitva: string;
    sort: string;
  };
};

export function DirectoryFilters({
  states,
  districts,
  daitvas,
  values,
}: DirectoryFiltersProps) {
  const availableDistricts = values.state
    ? districts.filter((item) => item.state === values.state)
    : districts;

  return (
    <form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6" method="get">
      <label className="lg:col-span-2">
        <span className="mb-1 block text-sm font-semibold text-stone-700">कार्यकर्ता खोजें</span>
        <input
          className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
          defaultValue={values.q}
          maxLength={100}
          name="q"
          placeholder="नाम, पंजीकरण संख्या या दायित्व"
          type="search"
        />
      </label>
      <label>
        <span className="mb-1 block text-sm font-semibold text-stone-700">राज्य</span>
        <select className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm" defaultValue={values.state} name="state">
          <option value="">सभी राज्य</option>
          {states.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-semibold text-stone-700">जिला</span>
        <select className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm" defaultValue={values.district} name="district">
          <option value="">सभी जिले</option>
          {availableDistricts.map(({ state, district }) => (
            <option key={`${state}-${district}`} value={district}>{district}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-semibold text-stone-700">दायित्व</span>
        <select className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm" defaultValue={values.daitva} name="daitva">
          <option value="">सभी दायित्व</option>
          {daitvas.map((daitva) => <option key={daitva} value={daitva}>{daitva}</option>)}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-semibold text-stone-700">क्रम</span>
        <select className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm" defaultValue={values.sort} name="sort">
          <option value="name">नाम के अनुसार</option>
          <option value="recent">हाल ही में अपडेट</option>
        </select>
      </label>
      <div className="flex items-end gap-2 lg:col-span-6">
        <button className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800" type="submit">फ़िल्टर करें</button>
        <Link className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50" href="/saksham-karyakarta">फ़िल्टर हटाएँ</Link>
      </div>
    </form>
  );
}
