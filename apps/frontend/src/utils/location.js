const locationErrorMessage = (error) => {
  if (error?.code === 1) return "Location permission is blocked. Allow location access in Chrome and macOS settings.";
  if (error?.code === 2) return "Location is temporarily unavailable. Check Wi-Fi/location services and try again.";
  if (error?.code === 3) return "Location request timed out. Move near a window or try again.";
  return "Unable to capture location right now.";
};

const requestPosition = (options) => new Promise((resolve, reject) => {
  const geo = typeof window === "undefined" ? null : window.navigator?.geolocation;
  console.log("Requesting location with options:", geo , options);
  if (!geo) {
    reject(new Error("Location is not supported by this browser"));
    return;
  }

  geo.getCurrentPosition(resolve, reject, options);
});

export const getCurrentLocation = async ({ onStatus } = {}) => {
  onStatus?.("Waiting for location permission...");

  try {
    const position = await requestPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (firstError) {
    if (firstError?.code !== 2 && firstError?.code !== 3) {
      throw new Error(locationErrorMessage(firstError));
    }

    onStatus?.("Location is taking longer. Trying once more...");
    try {
      const position = await requestPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (secondError) {
      throw new Error(locationErrorMessage(secondError));
    }
  }
};
