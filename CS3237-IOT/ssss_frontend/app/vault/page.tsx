"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import LeftTitle from "../_components/common/LeftTitle";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import StyledButton from "../_components/common/StyledButton";
import { useRouter } from "next/navigation";
const mapContainerStyle = {
  width: "50vw",
  height: "50vh",
  borderRadius: "2rem",
};

// ... (rest of your imports)

export default function VaultPage() {
  const router = useRouter();
  const [markerPosition, setMarkerPosition] = useState({
    lat: 0, // set default latitude if needed
    lng: 0, // set default longitude if needed
  });
  const [mapIsReady, setMapIsReady] = useState(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "", // Replace with your API key
  });

  const onMapLoad = (map) => {
    setMapIsReady(true);
  };

  const onMarkerDragEnd = (event) => {
    setMarkerPosition({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  };

  const addVault = async () => {
    //Axios post to vaults
    try {
      await axios.post("http://localhost:3000/vault", {
        //Change this to make more secure
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      });
      //Send back to home
      router.push(`/`);
    } catch (err) {
      alert("Error adding vault");
      return;
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <LeftTitle title="/vault" />
      <div className="w-full flex justify-center items-center">
        <div className="w-1/2 h-1/2">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={8}
            center={markerPosition}
            onLoad={onMapLoad}
          >
            {mapIsReady && (
              <MarkerF
                position={markerPosition}
                draggable={true}
                onDragEnd={onMarkerDragEnd}
              />
            )}
          </GoogleMap>
        </div>
      </div>
      <div className="text-center mt-4">
        <p>Latitude: {markerPosition.lat}</p>
        <p>Longitude: {markerPosition.lng}</p>
      </div>
      <StyledButton label="Add" onClick={addVault} />
    </main>
  );
}
