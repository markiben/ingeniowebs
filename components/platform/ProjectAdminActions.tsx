"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  finishProjectAction,
  setProjectProgressAction,
  updateProjectHoursAction,
} from "@/lib/platform/actions";
import { refreshPlatform } from "@/lib/platform/client-refresh";
import type { PlatformProject } from "@/lib/platform/types";

export default function ProjectAdminActions({
  project,
}: {
  project: PlatformProject;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <form
        className="plat-hours-form"
        action={(formData) => {
          startTransition(async () => {
            formData.set("projectId", project.id);
            await updateProjectHoursAction(formData);
            refreshPlatform(router);
          });
        }}
      >
        <input type="hidden" name="pricingType" value={project.pricingType} />
        <label>
          Est.
          <input
            type="number"
            name="hoursEstimated"
            min={0}
            step={0.5}
            defaultValue={project.hoursEstimated}
          />
        </label>
        <label>
          Inv.
          <input
            type="number"
            name="hoursInvested"
            min={0}
            step={0.5}
            defaultValue={project.hoursInvested}
          />
        </label>
        <label>
          $/h
          <input
            type="number"
            name="hourlyCost"
            min={0}
            step={1}
            defaultValue={project.hourlyCost}
          />
        </label>
        <label className="plat-check">
          <input
            type="checkbox"
            name="maintenancePlan"
            defaultChecked={project.maintenancePlan}
          />
          Mant.
        </label>
        <button className="plat-btn is-ghost" type="submit" disabled={pending}>
          Guardar horas
        </button>
      </form>

      <button
        type="button"
        className="plat-btn is-ghost"
        disabled={pending || project.progress >= 100}
        onClick={() =>
          startTransition(async () => {
            await setProjectProgressAction(
              project.id,
              Math.min(100, project.progress + 25),
              "in_progress",
            );
            refreshPlatform(router);
          })
        }
      >
        +25% avance
      </button>
      {project.status !== "completed" ? (
        <button
          type="button"
          className="plat-btn is-danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await finishProjectAction(project.id);
              refreshPlatform(router);
            })
          }
        >
          Terminar proyecto
        </button>
      ) : (
        <span className="plat-badge is-done">Finalizado</span>
      )}
    </div>
  );
}
