import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'zizo_device_id';

function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function useDeviceTrust() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isKnownDevice, setIsKnownDevice] = useState(false);

  useEffect(() => {
    let storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!storedDeviceId) {
      storedDeviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
      setIsKnownDevice(false);
    } else {
      setIsKnownDevice(true);
    }
    
    setDeviceId(storedDeviceId);
  }, []);

  const clearDevice = () => {
    localStorage.removeItem(DEVICE_ID_KEY);
    setDeviceId(null);
    setIsKnownDevice(false);
  };

  const trustDevice = () => {
    if (deviceId) {
      setIsKnownDevice(true);
    }
  };

  return {
    deviceId,
    isKnownDevice,
    clearDevice,
    trustDevice,
  };
}
