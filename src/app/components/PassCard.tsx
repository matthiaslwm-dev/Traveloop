import Image from "next/image";
import type { PassKey } from "../data/passes";

/** The Traveloop pass artwork. Sizing comes from the wrapper (.pass-stack, .pricing-visual). */
export default function PassCard({ tierKey, name }: { tierKey: PassKey; name: string }) {
  return (
    <div className={`pass-card tier-${tierKey}`}>
      <div className="card-shine" />
      <div className="card-top">
        <Image src="/traveloop-logo.webp" alt="" width={1280} height={345} />
        <span>{name.toUpperCase()}</span>
      </div>
      <div className="card-chip" />
      <div className="card-bottom">
        <strong>EXPERIENCE MALAYSIA</strong>
        <span>TOURIST PASS · 2026</span>
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
