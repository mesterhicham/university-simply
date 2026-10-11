import { usePlatformSettings } from '@/hooks/useAdminFeatures';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
}

export function PlatformLogo({
  className = "flex items-center gap-2",
  imageClassName = "h-9 max-w-[180px] object-contain",
  textClassName = "text-xl font-bold text-foreground",
  iconClassName = "h-8 w-8 text-primary",
  showText = true
}: PlatformLogoProps) {
  const { data: settings } = usePlatformSettings();

  const logoUrl = settings?.map?.['logo_url']?.value;
  const platformName = settings?.map?.['platform_name']?.value || 'Simply University';

  if (logoUrl) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <img
          src={logoUrl}
          alt={platformName}
          className={imageClassName}
          onError={(e) => {
            // If image fails to load, replace target with null/fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {showText && <span className={textClassName}>{platformName}</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GraduationCap className={iconClassName} />
      {showText && <span className={textClassName}>{platformName}</span>}
    </div>
  );
}
