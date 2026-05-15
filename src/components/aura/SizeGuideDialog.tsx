import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ruler } from "lucide-react";

const MEN = [
  { size: "S",   label: "Small",    chest: "35–37", waist: "29–31" },
  { size: "M",   label: "Medium",   chest: "38–40", waist: "32–34" },
  { size: "L",   label: "Large",    chest: "42–44", waist: "36–38" },
  { size: "XL",  label: "X-Large",  chest: "46–48", waist: "40–42" },
  { size: "XXL", label: "XX-Large", chest: "50–52", waist: "44–46" },
];

const YOUTH = [
  { size: "XS", label: "X-Small", chest: "22–24", height: "41–45", weight: "39–43" },
  { size: "S",  label: "Small",   chest: "25–27", height: "46–53", weight: "44–69" },
  { size: "M",  label: "Medium",  chest: "28–30", height: "54–59", weight: "70–100" },
  { size: "L",  label: "Large",   chest: "30–32", height: "60–64", weight: "101–125" },
];

export function SizeGuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Size Guide
          </DialogTitle>
          <DialogDescription>All measurements in inches. If you're between sizes we recommend going up.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <section>
            <h3 className="mb-3 text-sm font-semibold">Men / Unisex</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Size</Th><Th>Label</Th><Th>Chest (in)</Th><Th>Waist (in)</Th>
                  </tr>
                </thead>
                <tbody>
                  {MEN.map((r) => (
                    <tr key={r.size} className="border-t border-border">
                      <Td className="font-semibold text-primary">{r.size}</Td>
                      <Td>{r.label}</Td>
                      <Td>{r.chest}</Td>
                      <Td>{r.waist}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold">Youth / Kids</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th>Size</Th><Th>Label</Th><Th>Chest (in)</Th><Th>Height (in)</Th><Th>Weight (lb)</Th>
                  </tr>
                </thead>
                <tbody>
                  {YOUTH.map((r) => (
                    <tr key={r.size} className="border-t border-border">
                      <Td className="font-semibold text-primary">{r.size}</Td>
                      <Td>{r.label}</Td>
                      <Td>{r.chest}</Td>
                      <Td>{r.height}</Td>
                      <Td>{r.weight}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            Reference fit: model is 6'2", wearing Men's Medium. Measurements may vary slightly by garment style.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
