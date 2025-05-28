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
import {
  Loader2,
  FileText,
  Download,
  Copy,
  Settings,
  Globe,
} from "lucide-react";
import { generateMedicalReport, initGeminiAPI } from "@/lib/gemini-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

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
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
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
        // Only pass custom API key if user entered one
        initGeminiAPI(apiKey || undefined);
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
          name: patientInfo.name || undefined,
          age: patientInfo.age ? Number.parseInt(patientInfo.age) : undefined,
          gender: patientInfo.gender || undefined,
          symptoms: patientInfo.symptoms || undefined,
          location: patientInfo.location || undefined,
        },
        language
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
      toast.success("Copied to clipboard", {
        description: "The report has been copied to your clipboard.",
      });
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

    toast.success("Report downloaded", {
      description: "The text report has been downloaded successfully.",
    });
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
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border text-sm font-mono max-h-96 overflow-y-auto">
              {report}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Label htmlFor="language">
                  Report Language / Bahasa Laporan
                </Label>
                <Select
                  value={language}
                  onValueChange={(value: "id" | "en") => setLanguage(value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* API Key Settings */}
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

            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {language === "id" ? "Informasi Pasien" : "Patient Information"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    {language === "id" ? "Nama Lengkap" : "Full Name"}
                  </Label>
                  <Input
                    id="name"
                    placeholder={
                      language === "id" ? "Nama pasien" : "Patient name"
                    }
                    value={patientInfo.name}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="age">
                    {language === "id" ? "Usia" : "Age"}
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={
                      language === "id" ? "Usia pasien" : "Patient age"
                    }
                    value={patientInfo.age}
                    onChange={(e) =>
                      setPatientInfo({ ...patientInfo, age: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">
                    {language === "id" ? "Jenis Kelamin" : "Gender"}
                  </Label>
                  <Select
                    value={patientInfo.gender}
                    onValueChange={(value) =>
                      setPatientInfo({ ...patientInfo, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "id"
                            ? "Pilih jenis kelamin"
                            : "Select gender"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">
                        {language === "id" ? "Laki-laki" : "Male"}
                      </SelectItem>
                      <SelectItem value="Perempuan">
                        {language === "id" ? "Perempuan" : "Female"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">
                    {language === "id" ? "Lokasi" : "Location"}
                  </Label>
                  <Input
                    id="location"
                    placeholder={
                      language === "id" ? "Kota, Indonesia" : "City, Indonesia"
                    }
                    value={patientInfo.location}
                    onChange={(e) =>
                      setPatientInfo({
                        ...patientInfo,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="symptoms">
                  {language === "id" ? "Keluhan Utama" : "Chief Complaint"}
                </Label>
                <Textarea
                  id="symptoms"
                  placeholder={
                    language === "id"
                      ? "Jelaskan keluhan pasien"
                      : "Describe patient symptoms"
                  }
                  value={patientInfo.symptoms}
                  onChange={(e) =>
                    setPatientInfo({ ...patientInfo, symptoms: e.target.value })
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
                  {language === "id"
                    ? "Membuat Laporan..."
                    : "Generating Report..."}
                </>
              ) : language === "id" ? (
                "Buat Laporan Medis"
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
            {language === "id" ? "Salin" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            {language === "id" ? "Unduh TXT" : "Download TXT"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
