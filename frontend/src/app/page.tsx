"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ObsidianCardPreview } from "@/components/ObsidianCardPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from "sonner";
import {
  Youtube,
  Wand2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Github,
  Globe,
  MousePointerClick,
  Search,
  ClipboardCopy,
  Eye,
  Code,
  ClipboardCheck,
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [cookies, setCookies] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultMarkdown, setResultMarkdown] = useState("");
  const cookiesRef = useRef(cookies);
  cookiesRef.current = cookies;

  const isPlaylistUrl = (text: string) =>
    /youtube\.com.*[?&]list=/.test(text) || /youtu\.be.*[?&]list=/.test(text);

  const generate = useCallback(async (targetUrl: string, cookieStr?: string) => {
    setLoading(true);
    setResultMarkdown("");
    setResultTitle("");
    try {
      const res = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, cookies: cookieStr || null }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to convert playlist");
      }
      const data = await res.json();
      setResultTitle(data.title);
      setResultMarkdown(data.markdown);
      toast.success(
        `Generated ${data.markdown.split("cardlink").length - 1} cards from "${data.title}"`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: check clipboard for a playlist URL
  useEffect(() => {
    if (!navigator.clipboard?.readText) return;
    navigator.clipboard.readText().then((text) => {
      const trimmed = text.trim();
      if (isPlaylistUrl(trimmed)) {
        setUrl(trimmed);
        toast.info("Playlist URL detected in clipboard — generating...", {
          icon: <ClipboardCheck className="h-4 w-4" />,
          duration: 3000,
        });
        generate(trimmed, cookiesRef.current);
      }
    }).catch(() => {/* clipboard permission denied, fine */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Auto-generate when a valid URL is pasted/typed
    if (isPlaylistUrl(newUrl.trim())) {
      generate(newUrl.trim(), cookiesRef.current);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) { toast.error("Please enter a YouTube playlist URL"); return; }
    generate(url, cookies);
  };

  const copyToClipboard = () => {
    if (!resultMarkdown) return;
    navigator.clipboard.writeText(resultMarkdown);
    toast.success("Copied to clipboard!");
  };

  const downloadFile = () => {
    if (!resultMarkdown) return;
    const blob = new Blob([resultMarkdown], { type: "text/markdown" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    const safeTitle = resultTitle
      ? resultTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "playlist";
    link.download = `${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast.success("Download started!");
  };

  const COOKIE_STEPS = [
    {
      icon: <Globe className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Open YouTube in your browser",
      detail: "Make sure you're logged in to the account that has access to the private playlist.",
    },
    {
      icon: <MousePointerClick className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Open DevTools",
      detail: "Press F12 or right-click anywhere → Inspect.",
    },
    {
      icon: <Search className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Go to the Network tab",
      detail:
        'Refresh the page. Click on any request to youtube.com (e.g. the first "playlist?list=…" request). In the Headers panel, scroll down to find the "cookie:" header.',
    },
    {
      icon: <ClipboardCopy className="h-4 w-4 text-primary flex-shrink-0" />,
      title: "Copy the entire cookie value",
      detail: "Right-click the cookie value → Copy value. Paste it in the field below.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Toaster theme="dark" position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Youtube className="h-6 w-6 text-primary" />
            <span className="font-bold tracking-tight text-lg">
              Obsidi<span className="text-primary">Tube</span>
            </span>
          </div>
          <a
            href="https://github.com/giiibb/obsiditube"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 shadow-[0_0_20px_rgba(200,100,60,0.15)]">
            <Wand2 className="h-4 w-4" />
            <span>Turn playlists into actionable tasks</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white/80 to-white/30 bg-clip-text text-transparent pb-1">
            YouTube to Obsidian
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Convert any YouTube playlist into beautifully formatted Obsidian
            checklist cards. Fast, frictionless, secure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-white/10 bg-card/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />

              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Configuration
                </CardTitle>
                <CardDescription>
                  Paste a public or private playlist link.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="url">Playlist URL</Label>
                    <Input
                      id="url"
                      placeholder="https://youtube.com/playlist?list=..."
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="bg-background/50 border-white/10 focus-visible:ring-primary h-12 text-base transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Advanced toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full"
                  >
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {showAdvanced
                      ? "Hide private playlist options"
                      : "Private playlist? Click here"}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                      {/* Step-by-step cookie guide */}
                      <div className="rounded-lg border border-white/10 bg-background/30 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowGuide(!showGuide)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                        >
                          <span>📖 How to get your cookies</span>
                          {showGuide ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {showGuide && (
                          <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
                            {COOKIE_STEPS.map((step, i) => (
                              <div
                                key={i}
                                className="flex gap-3 items-start"
                              >
                                <div className="mt-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-[11px] font-bold text-primary flex-shrink-0">
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground leading-tight">
                                    {step.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    {step.detail}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="cookies"
                          className="text-muted-foreground flex items-center justify-between"
                        >
                          <span>Session Cookies</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider border border-yellow-500/20 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                            Private Only
                          </span>
                        </Label>
                        <Textarea
                          id="cookies"
                          placeholder="Paste the cookie header value here..."
                          value={cookies}
                          onChange={(e) => setCookies(e.target.value)}
                          className="font-mono text-xs bg-background/50 border-white/10 min-h-[80px] resize-none focus-visible:ring-primary"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic button: Generate → Copy + Download + Regenerate once results exist */}
                  {resultMarkdown ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={copyToClipboard}
                        className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        onClick={downloadFile}
                        className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 border-white/10 bg-background/30 hover:bg-background/60 flex-shrink-0"
                        disabled={loading || !url}
                        title="Regenerate"
                      >
                        {loading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Wand2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                      disabled={loading || !url}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Generating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5" />
                          Generate Cards
                        </span>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 h-[600px] flex flex-col">
            <Card className="flex-1 flex flex-col border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl transition-all">
              <div className="h-14 border-b border-white/5 bg-background/50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 opacity-60">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground ml-2 truncate max-w-[200px] sm:max-w-xs">
                    {resultTitle ? `${resultTitle}.md` : "Output"}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  {/* View Mode Toggle */}
                  <div className="flex rounded-md border border-white/10 overflow-hidden mr-1.5">
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "preview"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode("code")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "code"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Code className="h-3.5 w-3.5" />
                      Code
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all"
                    onClick={copyToClipboard}
                    disabled={!resultMarkdown}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 bg-background/30 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all"
                    onClick={downloadFile}
                    disabled={!resultMarkdown}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative bg-[#0a0a0a] overflow-y-auto">
                {!resultMarkdown ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 select-none">
                    <Youtube className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready when you are</p>
                    <p className="text-sm">
                      Your markdown will appear here
                    </p>
                  </div>
                ) : viewMode === "code" ? (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <div className="p-4 md:p-6 pb-12 w-full min-h-full">
                      <pre className="text-sm font-mono leading-relaxed text-[#e5e5e5] whitespace-pre-wrap break-words">
                        {resultMarkdown}
                      </pre>
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-full w-full absolute inset-0">
                    <ObsidianCardPreview markdown={resultMarkdown} />
                  </ScrollArea>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
