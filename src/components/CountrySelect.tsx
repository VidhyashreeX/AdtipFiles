import React, { useState } from "react";
import countryData from "./countryData.json";

interface Country {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

interface Props {
  value: string;
  onChange: (code: string) => void;
}

const CountrySelect: React.FC<Props> = ({ value, onChange }) => {
  const [search, setSearch] = useState("");
  const filtered = countryData.filter((c: Country) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search country..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-1"
      />
      <div className="max-h-48 overflow-y-auto border rounded bg-white absolute w-full z-10">
        {filtered.map((country: Country) => (
          <div
            key={country.code}
            className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${value === country.dial_code ? "bg-adtip-teal/10" : ""}`}
            onClick={() => onChange(country.dial_code)}
          >
            <span className="mr-2">{country.flag}</span>
            <span className="mr-2">{country.name}</span>
            <span className="ml-auto">{country.dial_code}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountrySelect;
