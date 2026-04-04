import type { Metadata } from "next";
import { StartWizard } from "@/components/start/wizard";

export const metadata: Metadata = {
  title: "Start Selling Your Home — NoComiss",
  description:
    "Enter your address, upload photos, and get an AI-powered listing in minutes. No agent needed.",
};

export default function StartPage() {
  return <StartWizard />;
}
