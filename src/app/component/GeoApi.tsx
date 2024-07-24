"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import useDebounce from "../customhooks/page"; // Import the custom debounce hook
import axios from "axios";

const LeafletMap = dynamic(() => import("./Leafmap"), {
  ssr: false, // Disable server-side rendering for this component
});

interface LocationProperties {
  address_line1?: string;
  address_line2?: string;
  state?: string;
  country?: string;
  postcode?: string;
  category?: string;
}

interface Suggestion {
  properties: LocationProperties;
}

interface GeoapifyResponse {
  features: Suggestion[];
}

const Geoapifymap: React.FC = () => {
  const [data, setData] = useState<GeoapifyResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState<boolean>(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 800); // 800ms debounce delay

  const fetchSuggestions = async (query: string) => {
    try {
      const url = `/api/geoapihide?query=${query}`;
      const response = await axios.get(url);

      const data: GeoapifyResponse = response.data;
      setSuggestions(data.features || []);
      setError(null);
    } catch (error) {
       console.error(error);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery && showSearch) {
      fetchSuggestions(debouncedSearchQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchQuery, showSearch]);

  const handleSuggestionClick = (location: Suggestion) => {
    if (location && location.properties) {
      setSearchQuery(
        location.properties.address_line1 ||
        location.properties.address_line2 ||
        location.properties.state ||
        location.properties.country ||
        ''
      );
      setSuggestions([]);
      setShowSearch(false);
      setData({ features: [location] });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setSuggestions([]);
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  };

  const handleInputFocus = () => {
    setShowSearch(true);
  };

  return (
    <div className="GeoLocation">
      <div className="name flex justify-center mt-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">Geoapify Map</h1>
      </div>
      <div className="GeoLocation-inner-part my-4">
        <div className="Search-box relative lg:w-1/2 mx-auto px-2 w-full md:w-9/12">
          <input 
            type="search" 
            placeholder="Search" 
            name="search" 
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="border p-3 rounded outline-none w-full placeholder:font-semibold"
            aria-label="Search for a location"
          />
          {showSearch && suggestions.length > 0 && (
            <ul className="absolute mt-2 border border-gray-300 rounded bg-white suggestions w-fit z-10">
              {suggestions.map((location, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(location)}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                >
                  {location.properties.address_line1}, {location.properties.address_line2 || location.properties.state}, {location.properties.country} ({location.properties.postcode || location.properties.category})
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <div className="mt-2 text-red-500">{error}</div>}
      </div>
      <div className="map mt-5">
        <LeafletMap data={data} />
      </div>
    </div>
  );
};

export default Geoapifymap;


