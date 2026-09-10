import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Divider } from "@/components/ui/Divider";
import { BatchActions } from "./BatchActions";

interface Props { params: Promise<{ id: string }> }

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

const BATCH_CLS: Record<string, string> = {
  PENDING:     "bg-warning/10 text-warning border-warning/20",
  IN_PROGRESS: "bg-accent/10 text-accent border-accent/20",
  COMPLETED:   "bg-success/10 text-success border-success/20",
  CANCELLED:   "bg-error/10 text-error border-error/20",
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const b = await prisma.productionBatch.findUnique({ where: { id }, select: { product: { select: { name: true } } } });
  return { title: `Batch — ${b?.product.name ?? "Production"} — LUMYNAT Admin` };
}

export default async function BatchDetailPage({ params }: Props) {
  const { id } = await params;

  const batch = await prisma.productionBatch.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      targetQuantity: true,
      actualQuantity: true,
      failedQuantity: true,
      totalMaterialCost: true,
      costPerUnit: true,
      notes: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      product: {
        select: {
          id: true, name: true, sku: true,
          finishedGoods: { select: { quantityOnHand: true } },
        },
      },
      recipeVersion: {
        select: {
          versionNumber: true,
          yieldQuantity: true,
          ingredients: {
            select: {
              quantity: true,
              rawMaterial: { select: { id: true, name: true, consumptionUnit: true } },
            },
          },
        },
      },
      deductions: {
        select: {
          id: true,
          quantityDeducted: true,
          costPerUnit: true,
          totalCost: true,
          rawMaterial: { select: { name: true, consumptionUnit: true } },
        },
      },
    },
  });

  if (!batch) notFound();

  const runs = Math.ceil(batch.targetQuantity / batch.recipeVersion.yieldQuantity);

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/production"
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200 mb-4 block"
        >
          ← Production
        </Link>
        <div className="flex items-start gap-4">
          <div>
            <h1 className="font-display text-4xl font-light italic text-text">{batch.product.name}</h1>
            <p className="font-body text-sm text-text-muted mt-1">
              {batch.product.sku} · Recipe v{batch.recipeVersion.versionNumber} · {runs} run{runs !== 1 ? "s" : ""}
            </p>
          </div>
          <span className={`mt-2 font-body text-[10px] tracking-widest uppercase border px-2 py-0.5 ${BATCH_CLS[batch.status] ?? ""}`}>
            {batch.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — batch info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-5">
              Batch Summary
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Target",    value: batch.targetQuantity },
                { label: "Actual",    value: batch.actualQuantity  ?? "—" },
                { label: "Failed",    value: batch.failedQuantity  ?? "—" },
                { label: "On Hand",   value: batch.product.finishedGoods?.quantityOnHand ?? 0 },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-body text-[10px] tracking-widest uppercase text-text-muted">{s.label}</p>
                  <p className="font-display text-2xl font-light text-text">{s.value}</p>
                </div>
              ))}
            </div>
            {(batch.totalMaterialCost || batch.costPerUnit) && (
              <>
                <Divider className="my-4" />
                <div className="grid grid-cols-2 gap-4 font-body text-sm">
                  <div>
                    <p className="text-[11px] text-text-muted">Total Material Cost</p>
                    <p className="text-text">${toNum(batch.totalMaterialCost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted">Cost Per Unit</p>
                    <p className="text-text">${toNum(batch.costPerUnit).toFixed(4)}</p>
                  </div>
                </div>
              </>
            )}
            {batch.notes && (
              <>
                <Divider className="my-4" />
                <p className="font-body text-sm text-text-muted">{batch.notes}</p>
              </>
            )}
          </div>

          {/* Recipe ingredients */}
          <div className="bg-surface border border-border-subtle p-6">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
              Recipe Ingredients (per run × {runs})
            </p>
            <div className="space-y-3">
              {batch.recipeVersion.ingredients.map((ing) => {
                const perRun = toNum(ing.quantity);
                const total  = perRun * runs;
                return (
                  <div key={ing.rawMaterial.id} className="flex justify-between font-body text-sm">
                    <span className="text-text">{ing.rawMaterial.name}</span>
                    <span className="text-text-muted">
                      {perRun.toFixed(2)} × {runs} = <span className="text-text">{total.toFixed(2)} {ing.rawMaterial.consumptionUnit.toLowerCase()}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deductions (post-completion) */}
          {batch.deductions.length > 0 && (
            <div className="bg-surface border border-border-subtle p-6">
              <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
                Actual Deductions
              </p>
              <div className="space-y-2">
                {batch.deductions.map((d) => (
                  <div key={d.id} className="flex justify-between font-body text-sm">
                    <span className="text-text">{d.rawMaterial.name}</span>
                    <span className="text-text-muted">
                      {toNum(d.quantityDeducted).toFixed(2)} {d.rawMaterial.consumptionUnit.toLowerCase()}
                      {" · "}
                      <span className="text-text">${toNum(d.totalCost).toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="space-y-6">
          <BatchActions
            batchId={batch.id}
            status={batch.status}
            targetQuantity={batch.targetQuantity}
          />

          {/* Timeline */}
          <div className="bg-surface border border-border-subtle p-6 space-y-3">
            <p className="font-body text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
              Timeline
            </p>
            {[
              { label: "Created",   date: batch.createdAt },
              { label: "Started",   date: batch.startedAt },
              { label: "Completed", date: batch.completedAt },
            ].map(({ label, date }) => (
              <div key={label} className="flex justify-between font-body text-sm">
                <span className="text-text-muted">{label}</span>
                <span className="text-text">
                  {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
