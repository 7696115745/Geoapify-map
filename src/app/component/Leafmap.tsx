"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationProperties {
  address_line1?: string;
  address_line2?: string;
  state?: string;
  country?: string;
  postcode?: string;
  category?: string;
  lat?: string | null;
  lon?: string | null;
}

interface Suggestion {
  properties: LocationProperties;
}

interface GeoapifyResponse {
  features: Suggestion[];
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const LeafletMap = ({ data }: { data: GeoapifyResponse | null }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [prevPosition, setPrevPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !mapRef.current) {
      console.log("Initializing map...");

      const map = L.map("map").setView([51.505, -0.09], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 25,
      }).addTo(map);

      console.log("Map initialized");
    }

    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map...");
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log("Data updated:", data);

    if (data && data.features && data.features.length > 0) {
      const location = data.features[0];
      const { lat, lon } = location.properties;

      // Convert lat and lon to number, defaulting to 0 if not present
      const latNumber = lat ? parseFloat(lat) : 0;
      const lonNumber = lon ? parseFloat(lon) : 0;

      console.log("Location data:", location.properties);

      setPosition([latNumber, lonNumber]);

      if (mapRef.current) {
        const map = mapRef.current;

        map.eachLayer((layer: L.Layer) => {
          if (layer instanceof L.Marker) {
            console.log("Removing old marker...");
            map.removeLayer(layer);
          }
        });

        const newMarker = () => {
          const marker = L.marker([latNumber, lonNumber]).addTo(map);
          marker.bindPopup(`
            <div>
              <strong>Address:</strong><br/>
              ${location.properties.address_line1 || ''}<br/>
              ${location.properties.address_line2 || ''}<br/>
              ${location.properties.state || ''}<br/>
              ${location.properties.country || ''}<br/>
              ${lat || ''}<br/>
              ${lon || ''}
            </div>
          `).openPopup();

          console.log("New marker added at:", [latNumber, lonNumber]);
        };

        if (prevPosition) {
          const distance = getDistance(prevPosition[0], prevPosition[1], latNumber, lonNumber);
          console.log("Distance between previous and new location:", distance);

          if (distance < 0.5) { // within 0.5 km, no animation
            console.log("New location is close to previous location, skipping animation");
            map.setView([latNumber, lonNumber], 18, { animate: true });
            newMarker();
          } else if (distance > 1) { // more than 1 km, zoom out then zoom in
            console.log("New location is more than 1 km from previous location, performing full animation");

            // Zoom out to a more moderate zoom level
            map.flyTo(prevPosition, 7, {
              animate: true,
              duration: 2, // Duration of zoom-out animation
            });

            // Set a timeout to wait for the zoom-out animation to complete
            setTimeout(() => {
              newMarker();

              // Zoom in to the new position
              map.flyTo([latNumber, lonNumber], 18, {
                animate: true,
                duration: 2, // Duration of zoom-in animation
              });
            }, 2000); // Adjust this delay to match the zoom-out duration
          } else { // between 0.5 km and 1 km, regular animation
            console.log("New location is between 0.5 km and 1 km from previous location, performing regular animation");
            newMarker();
            map.flyTo([latNumber, lonNumber], 18, {
              animate: true,
              duration: 2, // Duration of zoom-in animation
            });
          }
        } else {
          // First time setting the position
          newMarker();

          // Zoom in to the new position
          map.flyTo([latNumber, lonNumber], 18, {
            animate: true,
            duration: 2, // Duration of zoom-in animation
          });
        }

        setPrevPosition([latNumber, lonNumber]);
      }
    } else {
      console.log("No valid location data found.");
    }
  }, [data]);

  return (
    <div id="map" style={{ height: "550px", width: "100%" }}></div>
  );
};

export default LeafletMap;
