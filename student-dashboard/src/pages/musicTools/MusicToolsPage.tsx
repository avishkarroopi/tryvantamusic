import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TOOL_REGISTRY } from "@/mcam/features/toolkit/toolRegistry";
import { ToolLauncherOverlay } from "@/mcam/features/toolkit/ToolLauncherOverlay";

export function MusicToolsPage() {
  const [openTool, setOpenTool] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Music Tools" description="The same M-series tools available live in class — practice anytime between lessons." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOL_REGISTRY.map((tool) => (
          <Card key={tool.id}>
            <CardBody>
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                {tool.icon}
              </div>
              <p className="mt-3 font-display font-semibold text-ink-900 dark:text-white">{tool.name}</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{tool.tagline}</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setOpenTool(tool.id)}>
                Open tool
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <ToolLauncherOverlay toolId={openTool} onClose={() => setOpenTool(null)} />
    </div>
  );
}
