"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound-settings";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => {
      setEnabled(isSoundEnabled());
    });
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={enabled ? "Disable sound effects" : "Enable sound effects"}
      title={enabled ? "Sound on" : "Sound off"}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      <span className="sr-only">{enabled ? "Sound on" : "Sound off"}</span>
    </Button>
  );
}
