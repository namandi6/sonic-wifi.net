import { Wifi, Clock, Zap, Star } from "lucide-react";

export interface WifiPackage {
  id: string;
  name: string;
  duration: string;
  price: number;
  speed: string;
  devices: number;
  popular?: boolean;
  color: "electric" | "fire";
}

interface PackageCardProps {
  pkg: WifiPackage;
  onSelect: (pkg: WifiPackage) => void;
}

export const wifiPackages: WifiPackage[] = [
  { id: "1hr", name: "Quick Dash", duration: "1 Hour", price: 20, speed: "10 Mbps", devices: 1, color: "electric" },
  { id: "3hr", name: "Sprint", duration: "3 Hours", price: 50, speed: "10 Mbps", devices: 2, color: "electric" },
  { id: "daily", name: "Full Speed", duration: "24 Hours", price: 100, speed: "20 Mbps", devices: 3, popular: true, color: "fire" },
  { id: "weekly", name: "Power Week", duration: "7 Days", price: 500, speed: "20 Mbps", devices: 5, color: "electric" },
  { id: "monthly", name: "Sonic Month", duration: "30 Days", price: 1500, speed: "50 Mbps", devices: 10, color: "fire" },
];

const PackageCard = ({ pkg, onSelect }: PackageCardProps) => {
  return (
    <div
      className={`card-sonic rounded-2xl p-6 cursor-pointer relative overflow-hidden group ${
        pkg.popular ? "package-popular" : ""
      }`}
      onClick={() => onSelect(pkg)}
    >
      {/* Speed line decoration */}
      <div className="speed-line-bg" />

      {pkg.popular && (
        <div className="absolute top-0 right-0">
          <div className="btn-fire text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
            <Star className="w-3 h-3" fill="currentColor" />
            POPULAR
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            pkg.color === "fire"
              ? "bg-fire/20 border border-fire/30"
              : "bg-electric/20 border border-electric/30"
          }`}
        >
          <Wifi
            className={`w-6 h-6 ${pkg.color === "fire" ? "text-fire" : "text-electric"}`}
          />
        </div>

        {/* Name */}
        <h3 className="font-heading text-2xl text-foreground mb-1">{pkg.name}</h3>

        {/* Duration */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
          <Clock className="w-4 h-4" />
          <span>{pkg.duration}</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span
            className={`font-display text-5xl ${
              pkg.color === "fire" ? "gradient-text-fire" : "gradient-text-electric"
            }`}
          >
            KES {pkg.price}
          </span>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className={`w-3 h-3 ${pkg.color === "fire" ? "text-fire" : "text-electric"}`} />
            <span>{pkg.speed} download speed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className={`w-3 h-3 ${pkg.color === "fire" ? "text-fire" : "text-electric"}`} />
            <span>Up to {pkg.devices} device{pkg.devices > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Button */}
        <button
          className={`w-full py-3 rounded-xl font-heading text-lg tracking-wide transition-all ${
            pkg.color === "fire" ? "btn-fire" : "btn-electric"
          }`}
        >
          GET VOUCHER →
        </button>
      </div>
    </div>
  );
};

export default PackageCard;
