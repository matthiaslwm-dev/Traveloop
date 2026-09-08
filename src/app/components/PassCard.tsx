import Image from "next/image";
import type { PassKey } from "../data/passes";

/**
 * The Malaysia Experience Card. The artwork is the printed card front —
 * identical on every tier, exactly as it comes off the press — so the tier is
 * carried by the frame and the wash over it, the way the physical cards do it.
 * Sizing comes from the wrapper (.pass-stack, .pricing-visual).
 */
export default function PassCard({ tierKey, name }: { tierKey: PassKey; name: string }) {
  return (
    <div className={`pass-card tier-${tierKey}`}>
      <div className="card-face">
        <Image
          className="card-art"
          src="/malaysia-card-front.webp"
          alt={`${name} Malaysia Experience Card`}
          fill
          sizes="(max-width:640px) 260px, (max-width:1024px) 340px, 540px"
        />
        <div className="card-tint" />
        <div className="card-shine" />
      </div>
    </div>
  );
}

/** Silver / Platinum / Gold fanned out, Gold in front. Spreads on hover. */
export function PassStack({ className = "" }: { className?: string }) {
  return (
    <div className={`pass-stack ${className}`.trim()}>
      <div className="pass-stack-item pass-stack-1">
        <PassCard tierKey="silver" name="Silver" />
      </div>
      <div className="pass-stack-item pass-stack-2">
        <PassCard tierKey="platinum" name="Platinum" />
      </div>
      <div className="pass-stack-item pass-stack-3">
        <PassCard tierKey="gold" name="Gold" />
      </div>
    </div>
  );
}
