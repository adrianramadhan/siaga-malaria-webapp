"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, Copy, Settings } from "lucide-react";
import { generateMedicalReport, initGeminiAPI } from "@/lib/gemini-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MedicalReportProps {
  prediction: "Parasitized" | "Uninfected";
  confidence: number;
}

export function MedicalReport({ prediction, confidence }: MedicalReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    age: "",
    gender: "",
    symptoms: "",
    location: "",
  });

  // Check if environment API key exists
  useEffect(() => {
    const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    setHasEnvApiKey(!!envApiKey);
  }, []);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize the API with the provided key or use env variable
      try {
        // Only pass custom API key if user entered one, otherwise use env variable
        initGeminiAPI(apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      } catch {
        setError("API key not found. Please provide a Gemini API key.");
        setLoading(false);
        return;
      }

      // Generate the report
      const generatedReport = await generateMedicalReport(
        prediction,
        confidence,
        {
          age: patientInfo.age ? Number.parseInt(patientInfo.age) : undefined,
          gender: patientInfo.gender || undefined,
          symptoms: patientInfo.symptoms || undefined,
          location: patientInfo.location || undefined,
        }
      );

      setReport(generatedReport ?? null);
    } catch (err) {
      console.error("Error:", err);
      setError(
        "Failed to generate report. Please check your API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `malaria-report-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Medical Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report ? (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border text-sm">
              {report}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Collapsible
              open={showApiKeyInput}
              onOpenChange={setShowApiKeyInput}
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2">
                  <Settings className="h-4 w-4 mr-2" />
                  {hasEnvApiKey ? "Use Custom API Key" : "API Key Settings"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border rounded-md mb-4">
                  <Label htmlFor="api-key">Gemini API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={
                      hasEnvApiKey
                        ? "Override default API key (optional)"
                        : "Enter your Gemini API key"
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {hasEnvApiKey
                      ? "A default API key is configured. You can override it if needed."
                      : "Get your free API key from Google AI Studio"}
                    {!hasEnvApiKey && (
                      <a
                        href="https://ai.google.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline ml-1"
                      >
                        Google AI Studio
                      </a>
                    )}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Patient age"
                    value={patientInfo.age}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, age: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    placeholder="Patient gender"
                    value={patientInfo.gender}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, gender: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe patient symptoms"
                  value={patientInfo.symptoms}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, symptoms: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Patient location in Indonesia"
                  value={patientInfo.location}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, location: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                "Generate Medical Report"
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      {report && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyReport}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
