import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile-android' | 'mobile-ios' | 'tablet-ios';

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  deviceType: DeviceType;
  isIOS: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isIOS, setIsIOS] = useState<boolean>(false);

  // Detect platform & standalone mode
  useEffect(() => {
    // 1. Detect if already installed (standalone mode)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect Device Type
    const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    const isIpad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIphone = /iPhone|iPod/i.test(ua);
    const isAndroidDevice = /Android/i.test(ua);
    const isTabletDevice = isIpad || (/tablet|android(?!.*mobile)/i.test(ua));
    const isMobileDevice = /Mobi|Android/i.test(ua) && !isTabletDevice;

    const detectedIOS = isIphone || isIpad;
    setIsIOS(detectedIOS);

    if (isIpad) {
      setDeviceType('tablet-ios');
    } else if (isIphone) {
      setDeviceType('mobile-ios');
    } else if (isTabletDevice) {
      setDeviceType('tablet');
    } else if (isMobileDevice) {
      setDeviceType('mobile-android');
    } else {
      setDeviceType('desktop');
    }

    // On iOS, native beforeinstallprompt is not supported, but can always be installed via Add to Home Screen
    if (detectedIOS && !isStandalone) {
      setIsInstallable(true);
    }

    // Listen for standalone display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayChange);

    // 3. Listen for beforeinstallprompt (Chromium Desktop, Android, Tablets)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event captured');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsModalOpen(false);
      toast.success('تم تثبيت تطبيق Simply University بنجاح! شكراً لك.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (isInstalled) {
      toast.info('التطبيق مثبت بالفعل على هذا الجهاز!');
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[PWA] User accepted the installation prompt');
          setDeferredPrompt(null);
          setIsInstallable(false);
        } else {
          console.log('[PWA] User dismissed the installation prompt');
        }
      } catch (err) {
        console.error('[PWA] Error calling prompt():', err);
        setIsModalOpen(true);
      }
    } else {
      // Fallback: Open guided modal for iOS, iPad, or browser where prompt wasn't fired directly
      setIsModalOpen(true);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isInstallable,
        isInstalled,
        deviceType,
        isIOS,
        isModalOpen,
        setIsModalOpen,
        promptInstall,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAProvider');
  }
  return context;
}
