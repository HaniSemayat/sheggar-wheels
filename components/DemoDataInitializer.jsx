"use client";

import { useEffect } from "react";
import { initializeDemoData } from "../lib/demo-data";

export default function DemoDataInitializer() {
  useEffect(() => {
    initializeDemoData();
  }, []);

  return null;
}
